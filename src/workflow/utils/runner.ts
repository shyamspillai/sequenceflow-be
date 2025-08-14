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

function predicatePasses(p: any, payload: Record<string, unknown>): boolean {
	const base = payload
	const subject = p?.targetField ? (base as any)[p.targetField] : base
	const logic = applyJsonLogic(parseJsonIfString(p?.validationLogic, undefined), { ...base, value: subject }).isValid
	if (logic) return true
	// fallback: if validationConfig exists, support common "in" rule for text
	try {
		const cfg = p?.validationConfig
		if (cfg?.kind === 'text' && Array.isArray(cfg.rules)) {
			for (const r of cfg.rules) {
				if (r.type === 'in' && Array.isArray(r.options)) {
					if (typeof subject === 'string' && r.options.includes(subject)) return true
				}
			}
		}
	} catch {}
	return false
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
		if (node.type === 'decision') {
			const cfg: any = parseJsonIfString<any>((node as any).config, {} as any)
			const decisions: any[] = parseJsonIfString<any[]>(cfg?.decisions, [] as any[])
			const matches = new Set<string>()
			for (const d of decisions) {
				if (d?.predicates && d.predicates.length > 0) {
					const checks = d.predicates.map((p: any) => predicatePasses(p, payload))
					const combiner = d.combiner ?? 'all'
					const valid = combiner === 'all' ? checks.every(Boolean) : checks.some(Boolean)
					if (valid) matches.add(d.id)
				} else {
					const pass = predicatePasses(d, payload)
					if (pass) matches.add(d.id)
				}
			}
			const matchedIds = Array.from(matches)
			logs.push({ kind: 'decision', nodeId: (node as any).id, name: node.name, content: `Matched ${matchedIds.length} outcome(s): ${matchedIds.join(', ') || 'none'}` })
			for (const edge of out.get(curId) ?? []) {
				if (!edge.sourceHandleId) {
					stack.push(edge.targetId)
					continue
				}
				if (edge.sourceHandleId.startsWith('out-')) {
					const condId = edge.sourceHandleId.slice('out-'.length)
					if (matches.has(condId)) stack.push(edge.targetId)
				}
			}
		} else if (node.type === 'notification') {
			const cfg: any = parseJsonIfString<any>((node as any).config, {} as any)
			const content = interpolateTemplate((cfg ?? {}).template ?? '', payload as any)
			logs.push({ kind: 'notification', nodeId: (node as any).id, name: node.name, content })
			for (const edge of out.get(curId) ?? []) stack.push(edge.targetId)
		} else if (node.type === 'inputText') {
			logs.push({ kind: 'input', nodeId: (node as any).id, name: node.name, content: `Input: ${JSON.stringify(payload)}` })
			for (const edge of out.get(curId) ?? []) stack.push(edge.targetId)
		}
	}
	return { logs }
} 