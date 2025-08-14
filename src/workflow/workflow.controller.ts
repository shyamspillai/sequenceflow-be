import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put } from '@nestjs/common'
import { WorkflowService } from './workflow.service'
import { CreateWorkflowInputDto, PersistedWorkflowDto } from './dto/workflow.dto'

@Controller('workflows')
export class WorkflowController {
	constructor(private readonly service: WorkflowService) {}

	@Get()
	async list() {
		return this.service.list()
	}

	@Get(':id')
	async get(@Param('id') id: string) {
		const wf = await this.service.get(id)
		if (!wf) throw new NotFoundException('Workflow not found')
		return wf
	}

	@Post()
	async create(@Body() body: CreateWorkflowInputDto) {
		return this.service.create(body)
	}

	@Put(':id')
	async update(@Param('id') id: string, @Body() body: PersistedWorkflowDto) {
		if (id !== body.id) throw new NotFoundException('Mismatched id')
		return this.service.update(body)
	}

	@Delete(':id')
	async delete(@Param('id') id: string) {
		await this.service.delete(id)
		return { ok: true }
	}

	@Post(':id/execute')
	async execute(@Param('id') id: string, @Body() body?: { input?: Record<string, unknown> }) {
		return this.service.execute(id, body?.input)
	}

	@Post(':id/trigger')
	async trigger(@Param('id') id: string, @Body() body?: { input?: Record<string, unknown> }) {
		// Placeholder for async scheduler; for now, execute synchronously and return result
		return this.service.execute(id, body?.input)
	}

	@Get(':id/runs')
	async listRuns(@Param('id') id: string) {
		return this.service.listRuns(id)
	}

	@Get(':id/runs/:runId')
	async getRun(@Param('id') id: string, @Param('runId') runId: string) {
		const run = await this.service.getRun(id, runId)
		if (!run) throw new NotFoundException('Run not found')
		return run
	}
} 