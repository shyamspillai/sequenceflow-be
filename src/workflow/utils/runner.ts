import { PersistedWorkflowDto } from '../dto/workflow.dto'
import { applyJsonLogic } from './jsonLogic'
import { interpolateTemplate } from './template'

export type ExecutionResult = {
	logs: Array<{ kind: 'notification'; nodeId: string; name: string; content: string }>
}

function findStartNode(wf: PersistedWorkflowDto) {
	const n = wf.nodes.find(n => n.base.type === 'inputText')
	return n ? n.base : null
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
			const decisions = (node as any).config.decisions ?? []
			const matches = new Set<string>()
			for (const d of decisions) {
				if (d.predicates && d.predicates.length > 0) {
					const checks = d.predicates.map((p: any) => applyJsonLogic(p.validationLogic, { value: p.targetField ? (payload as any)[p.targetField] : payload }).isValid)
					const combiner = d.combiner ?? 'all'
					const valid = combiner === 'all' ? checks.every(Boolean) : checks.some(Boolean)
					if (valid) matches.add(d.id)
				} else {
					const subject = d.targetField ? (payload as any)[d.targetField] : payload
					const res = applyJsonLogic(d.validationLogic, { value: subject })
					if (res.isValid) matches.add(d.id)
				}
			}
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
			const content = interpolateTemplate(((node as any).config ?? {}).template ?? '', payload as any)
			logs.push({ kind: 'notification', nodeId: (node as any).id, name: node.name, content })
			for (const edge of out.get(curId) ?? []) stack.push(edge.targetId)
		} else if (node.type === 'inputText') {
			for (const edge of out.get(curId) ?? []) stack.push(edge.targetId)
		}
	}
	return { logs }
} 