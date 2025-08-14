import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Workflow } from './entities/workflow.entity'
import { WorkflowNode } from './entities/node.entity'
import { WorkflowEdge } from './entities/edge.entity'
import { CreateWorkflowInputDto, PersistedWorkflowDto } from './dto/workflow.dto'
import { executeWorkflow, ExecutionResult } from './utils/runner'
import { WorkflowRun } from './entities/run.entity'
import { WorkflowRunLog } from './entities/runLog.entity'

@Injectable()
export class WorkflowService {
	constructor(
		@InjectRepository(Workflow) private readonly workflowRepo: Repository<Workflow>,
		@InjectRepository(WorkflowNode) private readonly nodeRepo: Repository<WorkflowNode>,
		@InjectRepository(WorkflowEdge) private readonly edgeRepo: Repository<WorkflowEdge>,
		@InjectRepository(WorkflowRun) private readonly runRepo: Repository<WorkflowRun>,
		@InjectRepository(WorkflowRunLog) private readonly logRepo: Repository<WorkflowRunLog>,
	) {}

	private parseIfString<T>(val: unknown, fallback: T): T {
		if (typeof val === 'string') {
			try { return JSON.parse(val) as T } catch { return fallback }
		}
		return (val as T) ?? fallback
	}

	async list(): Promise<Array<{ id: string; name: string; updatedAt: number }>> {
		const items = await this.workflowRepo.find({ order: { updatedAt: 'DESC' } })
		return items.map(w => ({ id: w.id, name: w.name, updatedAt: w.updatedAt.getTime() }))
	}

	async get(id: string): Promise<PersistedWorkflowDto | null> {
		const wf = await this.workflowRepo.findOne({ where: { id } })
		if (!wf) return null
		return this.toPersistedDto(wf)
	}

	async create(input: CreateWorkflowInputDto): Promise<PersistedWorkflowDto> {
		const wf = new Workflow()
		wf.name = input.name
		wf.nodes = input.workflow.nodes.map(n => {
			const node = new WorkflowNode()
			node.workflow = wf
			node.persistedId = n.id
			node.baseId = n.base.id
			node.name = n.base.name
			node.type = n.base.type
			node.inputSchema = n.base.inputSchema
			node.outputSchema = n.base.outputSchema
			node.config = n.base.config
			node.validationLogic = (n.base as any).validationLogic ?? null
			node.connections = n.base.connections
			node.x = n.position.x
			node.y = n.position.y
			return node
		})
		wf.edges = input.workflow.edges.map(e => {
			const edge = new WorkflowEdge()
			edge.workflow = wf
			edge.sourceId = e.sourceId
			edge.targetId = e.targetId
			edge.sourceHandleId = e.sourceHandleId ?? null
			edge.targetHandleId = e.targetHandleId ?? null
			return edge
		})
		const saved = await this.workflowRepo.save(wf)
		return this.toPersistedDto(saved)
	}

	async update(workflow: PersistedWorkflowDto): Promise<PersistedWorkflowDto> {
		const existing = await this.workflowRepo.findOne({ where: { id: workflow.id } })
		if (!existing) throw new NotFoundException('Workflow not found')
		existing.name = workflow.name
		existing.nodes = workflow.nodes.map(n => {
			const node = new WorkflowNode()
			node.workflow = existing
			node.persistedId = n.id
			node.baseId = n.base.id
			node.name = n.base.name
			node.type = n.base.type
			node.inputSchema = n.base.inputSchema
			node.outputSchema = n.base.outputSchema
			node.config = n.base.config
			node.validationLogic = (n.base as any).validationLogic ?? null
			node.connections = n.base.connections
			node.x = n.position.x
			node.y = n.position.y
			return node
		})
		existing.edges = workflow.edges.map(e => {
			const edge = new WorkflowEdge()
			edge.workflow = existing
			edge.sourceId = e.sourceId
			edge.targetId = e.targetId
			edge.sourceHandleId = e.sourceHandleId ?? null
			edge.targetHandleId = e.targetHandleId ?? null
			return edge
		})
		const saved = await this.workflowRepo.save(existing)
		return this.toPersistedDto(saved)
	}

	async delete(id: string): Promise<void> {
		await this.workflowRepo.delete(id)
	}

	async execute(id: string, initialInput?: Record<string, unknown>): Promise<{ runId: string; logs: ExecutionResult['logs'] }> {
		const wf = await this.workflowRepo.findOne({ where: { id } })
		if (!wf) throw new NotFoundException('Workflow not found')
		const dto = this.toPersistedDto(wf)

		let run = new WorkflowRun()
		run.workflow = wf
		run.status = 'running'
		run.input = initialInput ?? null
		run = await this.runRepo.save(run)

		// system start log
		const startLog = new WorkflowRunLog()
		startLog.run = run
		startLog.type = 'system'
		startLog.message = 'Run started'
		await this.logRepo.save(startLog)

		const result = await executeWorkflow(dto, initialInput)

		const logEntities: WorkflowRunLog[] = result.logs.map(l => {
			const e = new WorkflowRunLog()
			e.run = run
			e.nodePersistedId = l.nodeId
			e.type = 'node-output'
			e.message = l.content
			e.data = { name: l.name, kind: l.kind }
			return e
		})
		if (logEntities.length) await this.logRepo.save(logEntities)

		const endLog = new WorkflowRunLog()
		endLog.run = run
		endLog.type = 'system'
		endLog.message = 'Run finished'
		await this.logRepo.save(endLog)

		run.status = 'succeeded'
		run.result = { logCount: logEntities.length }
		run.finishedAt = new Date()
		await this.runRepo.save(run)

		return { runId: run.id, logs: result.logs }
	}

	async listRuns(workflowId: string): Promise<Array<{ id: string; status: string; startedAt: number; finishedAt?: number }>> {
		const wf = await this.workflowRepo.findOne({ where: { id: workflowId } })
		if (!wf) throw new NotFoundException('Workflow not found')
		const runs = await this.runRepo.find({ where: { workflow: { id: workflowId } as any }, order: { startedAt: 'DESC' as any, updatedAt: 'DESC' as any } })
		return runs.map(r => ({ id: r.id, status: r.status, startedAt: r.startedAt.getTime(), finishedAt: r.finishedAt ? r.finishedAt.getTime() : undefined }))
	}

	async getRun(workflowId: string, runId: string): Promise<{ id: string; status: string; startedAt: number; finishedAt?: number; logs: Array<{ id: string; type: string; nodePersistedId?: string; message: string; data?: Record<string, unknown>; timestamp: number }> } | null> {
		const run = await this.runRepo.findOne({ where: { id: runId, workflow: { id: workflowId } as any } })
		if (!run) return null
		const logs = await this.logRepo.find({ where: { run: { id: run.id } as any }, order: { timestamp: 'ASC' as any } })
		return {
			id: run.id,
			status: run.status,
			startedAt: run.startedAt.getTime(),
			finishedAt: run.finishedAt ? run.finishedAt.getTime() : undefined,
			logs: logs.map(l => ({ id: l.id, type: l.type, nodePersistedId: l.nodePersistedId || undefined, message: l.message, data: l.data ?? undefined, timestamp: l.timestamp.getTime() })),
		}
	}

	private toPersistedDto(wf: Workflow): PersistedWorkflowDto {
		return {
			id: wf.id,
			name: wf.name,
			nodes: wf.nodes.map(n => ({
				id: n.persistedId,
				base: {
					id: n.baseId,
					type: n.type,
					name: n.name,
					inputSchema: this.parseIfString(n.inputSchema, {} as any),
					outputSchema: this.parseIfString(n.outputSchema, {} as any),
					config: this.parseIfString(n.config, {} as any),
					validationLogic: n.validationLogic ?? undefined,
					connections: this.parseIfString(n.connections, [] as any),
				},
				position: { x: n.x, y: n.y },
			})),
			edges: wf.edges.map(e => ({
				id: `${e.sourceId}->${e.targetId}`,
				sourceId: e.sourceId,
				targetId: e.targetId,
				sourceHandleId: e.sourceHandleId ?? undefined,
				targetHandleId: e.targetHandleId ?? undefined,
			})),
			createdAt: wf.createdAt.getTime(),
			updatedAt: wf.updatedAt.getTime(),
		}
	}
} 