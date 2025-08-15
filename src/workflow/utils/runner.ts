import { PersistedWorkflowDto } from '../dto/workflow.dto'
import { applyJsonLogic } from './jsonLogic'
import { interpolateTemplate, getByPath } from './template'

export type ExecutionResult = {
	logs: Array<{ kind: 'notification' | 'input' | 'decision' | 'api' | 'api-error'; nodeId: string; name: string; content: string }>
}

function findStartNode(wf: PersistedWorkflowDto) {
	const n = wf.nodes.find(n => n.base.type === 'inputText')
	return n ? n.base : null
}

function parseJsonIfString<T>(val: unknown, fallback: T): T {
	if (typeof val === 'string') {
		try { return JSON.parse(val) as T } catch { return fallback }
	}
	return (val as T) ?? fallback
}

export type NodeExecuteResult = {
	logs: ExecutionResult['logs']
	allowedSourceHandles?: Set<string>
	payload?: Record<string, unknown>
}

export type NodeExecutor = (base: any, payload: Record<string, unknown>) => Promise<NodeExecuteResult>

async function executeApiCall(base: any, payload: Record<string, unknown>): Promise<NodeExecuteResult> {
	const config = parseJsonIfString(base.config, {}) as any
	const method = config.method || 'GET'
	const urlTemplate = config.url || 'https://api.example.com/endpoint'
	const headers = parseJsonIfString(config.headers, []) as any[]
	const bodyTemplate = config.bodyTemplate
	const timeoutMs = config.timeoutMs || 10000
	const expectedStatusCodes = config.expectedStatusCodes || [200, 201, 202, 204]

	try {
		// Interpolate URL with payload data
		const url = interpolateTemplate(urlTemplate, payload)
		
		// Build headers object
		const requestHeaders: Record<string, string> = {}
		for (const h of headers) {
			if (h.enabled && h.key && h.value) {
				requestHeaders[h.key] = interpolateTemplate(h.value, payload)
			}
		}

		// Add default Content-Type for requests with body
		if (['POST', 'PUT', 'PATCH'].includes(method) && bodyTemplate && !requestHeaders['Content-Type']) {
			requestHeaders['Content-Type'] = 'application/json'
		}

		// Prepare request body
		let body: string | undefined
		if (['POST', 'PUT', 'PATCH'].includes(method) && bodyTemplate) {
			body = interpolateTemplate(bodyTemplate, payload)
		}

		// Create abort controller for timeout
		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

		// Make HTTP request
		const response = await fetch(url, {
			method,
			headers: requestHeaders,
			body,
			signal: controller.signal
		})

		clearTimeout(timeoutId)

		// Read response
		let responseData: any
		const contentType = response.headers.get('content-type')
		
		if (contentType?.includes('application/json')) {
			responseData = await response.json()
		} else {
			responseData = await response.text()
		}

		// Check if status code is expected
		const success = expectedStatusCodes.includes(response.status)
		
		const result = {
			status: response.status,
			statusText: response.statusText,
			data: responseData,
			headers: Object.fromEntries(response.headers.entries()),
			success
		}

		const logKind = success ? 'api' : 'api-error'
		const logContent = success 
			? `${method} ${url} → ${response.status} ${response.statusText}`
			: `${method} ${url} → ${response.status} ${response.statusText} (unexpected status)`

		return {
			logs: [{ kind: logKind, nodeId: base.id, name: base.name, content: logContent }],
			payload: result
		}

	} catch (error: any) {
		const errorMessage = error.name === 'AbortError' ? 'Request timeout' : error.message || 'Unknown error'
		
		const result = {
			status: 0,
			statusText: 'Error',
			data: null,
			headers: {},
			success: false,
			error: errorMessage
		}

		return {
			logs: [{ kind: 'api-error', nodeId: base.id, name: base.name, content: `API Call failed: ${errorMessage}` }],
			payload: result
		}
	}
}

const executors: Record<string, NodeExecutor> = {
	inputText: async (base, payload) => ({ 
		logs: [{ kind: 'input', nodeId: base.id, name: base.name, content: `Input: ${JSON.stringify(payload)}` }],
		payload: payload // Pass the input payload to downstream nodes
	}),
	decision: async (base, payload) => {
		const cfg: any = parseJsonIfString<any>(base?.config, {} as any)
		const decisions: any[] = parseJsonIfString<any[]>(cfg?.decisions, [] as any[])
		const matches = new Set<string>()
		for (const d of decisions) {
			if (d?.predicates && d.predicates.length > 0) {
				const checks = d.predicates.map((p: any) => applyJsonLogic(p.validationLogic, { value: p.targetField ? getByPath(payload, p.targetField) : payload }).isValid)
				const combiner = d.combiner ?? 'all'
				const valid = combiner === 'all' ? checks.every(Boolean) : checks.some(Boolean)
				if (valid) matches.add(d.id)
			} else {
				const subject = d?.targetField ? getByPath(payload, d.targetField) : payload
				const res = applyJsonLogic(d?.validationLogic, { value: subject })
				if (res.isValid) matches.add(d.id)
			}
		}
		const matchedIds = Array.from(matches)
		const logs: ExecutionResult['logs'] = [{ kind: 'decision', nodeId: base.id, name: base.name, content: `Matched ${matchedIds.length} outcome(s): ${matchedIds.join(', ') || 'none'}` }]
		const allowedSourceHandles = new Set<string>([...matchedIds.map(id => `out-${id}`)])
		return { logs, allowedSourceHandles, payload } // Pass payload through
	},
	notification: async (base, payload) => {
		const cfg: any = parseJsonIfString<any>(base?.config, {} as any)
		const content = interpolateTemplate((cfg ?? {}).template ?? '', payload as any)
		return { 
			logs: [{ kind: 'notification', nodeId: base.id, name: base.name, content }],
			payload // Pass payload through to downstream nodes
		}
	},
	apiCall: executeApiCall,
}

// Export executors for use in async task execution
export function getExecutors(): Record<string, NodeExecutor> {
	return executors
}

export async function executeWorkflow(wf: PersistedWorkflowDto, initialInput?: Record<string, unknown>): Promise<ExecutionResult> {
	const start = findStartNode(wf)
	if (!start) return { logs: [] }
	const out = new Map<string, Array<{ targetId: string; sourceHandleId?: string }>>()
	for (const e of wf.edges) {
		const arr = out.get(e.sourceId) ?? []
		arr.push({ targetId: e.targetId, sourceHandleId: e.sourceHandleId })
		out.set(e.sourceId, arr)
	}
	const nodeById = new Map(wf.nodes.map(n => [n.id, n.base]))

	const logs: ExecutionResult['logs'] = []
	let payload: Record<string, unknown> = initialInput ?? {}
	const visited = new Set<string>()
	const stack: string[] = [start.id]
	while (stack.length) {
		const curId = stack.pop()!
		if (visited.has(curId)) continue
		visited.add(curId)
		const node = nodeById.get(curId)
		if (!node) continue
		const exec = executors[(node as any).type] as NodeExecutor | undefined
		if (!exec) continue
		const { logs: nodeLogs, allowedSourceHandles, payload: nodeOutput } = await exec(node as any, payload)
		logs.push(...(nodeLogs ?? []))
		
		// Update payload for next nodes if this node produced output
		if (nodeOutput) {
			payload = nodeOutput
		}
		
		for (const edge of out.get(curId) ?? []) {
			if (!allowedSourceHandles || !edge.sourceHandleId || allowedSourceHandles.has(edge.sourceHandleId)) {
				stack.push(edge.targetId)
			}
		}
	}
	return { logs }
} 