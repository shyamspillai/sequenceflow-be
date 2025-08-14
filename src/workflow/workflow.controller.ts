import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common'
import { WorkflowService } from './workflow.service'
import { CreateWorkflowInputDto, PersistedWorkflowDto } from './dto/workflow.dto'

@Controller('workflows')
export class WorkflowController {
	constructor(private readonly workflowService: WorkflowService) {}

	@Get()
	async list() {
		return this.workflowService.list()
	}

	@Get('test-api')
	async testApi(@Query('name') name?: string, @Query('city') city?: string) {
		// Simple test API that returns mock data based on query parameters
		const responses = {
			weather: {
				city: city || 'Unknown',
				temperature: Math.floor(Math.random() * 35) + 5, // 5-40°C
				condition: ['sunny', 'cloudy', 'rainy', 'snowy'][Math.floor(Math.random() * 4)],
				humidity: Math.floor(Math.random() * 100),
				timestamp: new Date().toISOString()
			},
			user: {
				name: name || 'Anonymous',
				id: Math.floor(Math.random() * 1000),
				status: 'active',
				lastSeen: new Date().toISOString()
			}
		}

		// Return different data based on query parameters
		if (city) {
			return responses.weather
		} else if (name) {
			return responses.user
		} else {
			return {
				message: 'Test API endpoint',
				timestamp: new Date().toISOString(),
				availableParams: ['name', 'city'],
				examples: [
					'/workflows/test-api?city=London',
					'/workflows/test-api?name=John'
				]
			}
		}
	}

	@Post('test-api')
	async testApiPost(@Body() body: any) {
		// Echo back the posted data with some additional fields
		return {
			received: body,
			processed: true,
			timestamp: new Date().toISOString(),
			processingTime: Math.floor(Math.random() * 100) + 10 + 'ms'
		}
	}

	@Get(':id')
	async get(@Param('id') id: string) {
		return this.workflowService.get(id)
	}

	@Post()
	async create(@Body() input: CreateWorkflowInputDto) {
		return this.workflowService.create(input)
	}

	@Put(':id')
	async update(@Param('id') id: string, @Body() workflow: PersistedWorkflowDto) {
		return this.workflowService.update({ ...workflow, id })
	}

	@Delete(':id')
	async delete(@Param('id') id: string) {
		await this.workflowService.delete(id)
		return { deleted: true }
	}

	@Post(':id/execute')
	async execute(@Param('id') id: string, @Body() body: { input?: Record<string, unknown> }) {
		return this.workflowService.execute(id, body.input)
	}

	@Post(':id/trigger')
	async trigger(@Param('id') id: string, @Body() body: { input?: Record<string, unknown> }) {
		// Alias for execute
		return this.workflowService.execute(id, body.input)
	}

	@Get(':id/runs')
	async listRuns(@Param('id') id: string) {
		return this.workflowService.listRuns(id)
	}

	@Get(':id/runs/:runId')
	async getRun(@Param('id') id: string, @Param('runId') runId: string) {
		return this.workflowService.getRun(id, runId)
	}
} 