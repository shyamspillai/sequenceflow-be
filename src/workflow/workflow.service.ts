import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Workflow } from './entities/workflow.entity'
import { WorkflowNode } from './entities/node.entity'
import { WorkflowEdge } from './entities/edge.entity'
import { CreateWorkflowInputDto, PersistedWorkflowDto } from './dto/workflow.dto'
import { executeWorkflow, ExecutionResult } from './utils/runner'

@Injectable()
export class WorkflowService {
	constructor(
		@InjectRepository(Workflow) private readonly workflowRepo: Repository<Workflow>,
		@InjectRepository(WorkflowNode) private readonly nodeRepo: Repository<WorkflowNode>,
		@InjectRepository(WorkflowEdge) private readonly edgeRepo: Repository<WorkflowEdge>,
	) {}

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

	async execute(id: string, initialInput?: Record<string, unknown>): Promise<ExecutionResult> {
		const wf = await this.workflowRepo.findOne({ where: { id } })
		if (!wf) throw new NotFoundException('Workflow not found')
		const dto = this.toPersistedDto(wf)
		return executeWorkflow(dto, initialInput)
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
					inputSchema: n.inputSchema,
					outputSchema: n.outputSchema,
					config: n.config,
					validationLogic: n.validationLogic ?? undefined,
					connections: n.connections,
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