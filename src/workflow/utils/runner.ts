import { PersistedWorkflowDto } from '../dto/workflow.dto'
import { applyJsonLogic } from './jsonLogic'
import { interpolateTemplate } from './template'

export type ExecutionResult = {
	logs: Array<{ kind: 'notification' | 'input' | 'decision'; nodeId: string; name: string; content: string }>
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

export type NodeExecutor = (base: any, payload: Record<string, unknown>) => NodeExecuteResult

const executors: Record<string, NodeExecutor> = {
	inputText: (base, payload) => ({ logs: [{ kind: 'input', nodeId: base.id, name: base.name, content: `Input: ${JSON.stringify(payload)}` }] }),
	decision: (base, payload) => {
		const cfg: any = parseJsonIfString<any>(base?.config, {} as any)
		const decisions: any[] = parseJsonIfString<any[]>(cfg?.decisions, [] as any[])
		const matches = new Set<string>()
		for (const d of decisions) {
			if (d?.predicates && d.predicates.length > 0) {
				const checks = d.predicates.map((p: any) => applyJsonLogic(p.validationLogic, { value: p.targetField ? (payload as any)[p.targetField] : payload }).isValid)
				const combiner = d.combiner ?? 'all'
				const valid = combiner === 'all' ? checks.every(Boolean) : checks.some(Boolean)
				if (valid) matches.add(d.id)
			} else {
				const subject = d?.targetField ? (payload as any)[d.targetField] : payload
				const res = applyJsonLogic(d?.validationLogic, { value: subject })
				if (res.isValid) matches.add(d.id)
			}
		}
		const matchedIds = Array.from(matches)
		const logs: ExecutionResult['logs'] = [{ kind: 'decision', nodeId: base.id, name: base.name, content: `Matched ${matchedIds.length} outcome(s): ${matchedIds.join(', ') || 'none'}` }]
		const allowedSourceHandles = new Set<string>([...matchedIds.map(id => `out-${id}`)])
		return { logs, allowedSourceHandles }
	},
	notification: (base, payload) => {
		const cfg: any = parseJsonIfString<any>(base?.config, {} as any)
		const content = interpolateTemplate((cfg ?? {}).template ?? '', payload as any)
		return { logs: [{ kind: 'notification', nodeId: base.id, name: base.name, content }] }
	},
}

export function executeWorkflow(wf: PersistedWorkflowDto, initialInput?: Record<string, unknown>): ExecutionResult {
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
		const { logs: nodeLogs, allowedSourceHandles } = exec(node as any, payload)
		logs.push(...(nodeLogs ?? []))
		for (const edge of out.get(curId) ?? []) {
			if (!allowedSourceHandles || !edge.sourceHandleId || allowedSourceHandles.has(edge.sourceHandleId)) {
				stack.push(edge.targetId)
			}
		}
	}
	return { logs }
} 