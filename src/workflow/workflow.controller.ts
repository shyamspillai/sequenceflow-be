import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common'
import { WorkflowService } from './workflow.service'
import { AsyncWorkflowService } from './services/async-workflow.service'
import { CreateWorkflowInputDto, UpdateWorkflowInputDto } from './dto/workflow.dto'

@Controller('workflows')
export class WorkflowController {
	constructor(
		private readonly workflowService: WorkflowService,
		private readonly asyncWorkflowService: AsyncWorkflowService,
	) {}

	@Get()
	async list() {
		return this.workflowService.list()
	}

	@Get(':id')
	async get(@Param('id') id: string) {
		return this.workflowService.get(id)
	}

	@Post()
	async create(@Body() dto: CreateWorkflowInputDto) {
		return this.workflowService.create(dto)
	}

	@Put(':id')
	async update(@Param('id') id: string, @Body() dto: UpdateWorkflowInputDto) {
		// Handle both frontend formats: direct PersistedWorkflowDto or CreateWorkflowInputDto format
		let workflow
		
		if (dto.nodes && dto.edges) {
			// Direct format: { id, name, nodes, edges, createdAt, updatedAt }
			workflow = {
				id,
				name: dto.name,
				nodes: dto.nodes,
				edges: dto.edges,
				createdAt: dto.createdAt || Date.now(),
				updatedAt: Date.now(),
			}
		} else if (dto.workflow) {
			// Nested format: { name, workflow: { nodes, edges } }
			workflow = {
				id,
				name: dto.name,
				nodes: dto.workflow.nodes,
				edges: dto.workflow.edges,
				createdAt: dto.createdAt || Date.now(),
				updatedAt: Date.now(),
			}
		} else {
			throw new Error('Invalid workflow update format')
		}
		
		return this.workflowService.update(workflow)
	}

	@Delete(':id')
	async delete(@Param('id') id: string) {
		await this.workflowService.delete(id)
		return { deleted: true }
	}

	// Legacy synchronous execution
	@Post(':id/execute')
	async execute(@Param('id') id: string, @Body() body: { input?: Record<string, unknown> }) {
		return this.workflowService.execute(id, body.input)
	}

	// New async execution endpoints
	@Post(':id/execute-async')
	async executeAsync(@Param('id') id: string, @Body() body: { input?: Record<string, unknown> }) {
		return this.asyncWorkflowService.executeAsync(id, body.input)
	}

	@Get('runs/:runId/status')
	async getRunStatus(@Param('runId') runId: string) {
		return this.asyncWorkflowService.getRunStatus(runId)
	}

	@Get(':workflowId/runs/:runId/status')
	async getWorkflowRunStatus(@Param('workflowId') workflowId: string, @Param('runId') runId: string) {
		return this.asyncWorkflowService.getRunStatus(runId)
	}

	@Get(':workflowId/runs/:runId')
	async getWorkflowRun(@Param('workflowId') workflowId: string, @Param('runId') runId: string) {
		// Handle requests to /workflows/{workflowId}/runs/{runId} (without /status)
		return this.asyncWorkflowService.getRunStatus(runId)
	}

	// Test API endpoint for API call nodes - moved to avoid route conflicts
	@Get('api/test-weather')
	async testWeatherApi(@Query('city') city?: string) {
		// Mock weather API response
		const cities = {
			'dubai': { temperature: 35, humidity: 60, condition: 'sunny' },
			'london': { temperature: 15, humidity: 80, condition: 'cloudy' },
			'new york': { temperature: 22, humidity: 65, condition: 'partly cloudy' },
			'tokyo': { temperature: 18, humidity: 70, condition: 'rainy' },
			'sydney': { temperature: 25, humidity: 55, condition: 'clear' }
		}

		const cityKey = (city || 'london').toLowerCase()
		const weatherData = cities[cityKey] || cities['london']

		return {
			id: `weather-${Date.now()}`,
			city: city || 'London',
			name: `Weather for ${city || 'London'}`,
			count: 1,
			value: `${weatherData.temperature}°C`,
			result: 'success',
			message: `Current weather in ${city || 'London'}`,
			humidity: weatherData.humidity,
			condition: weatherData.condition,
			timestamp: new Date().toISOString(),
			temperature: weatherData.temperature
		}
	}

	@Post('runs/:runId/cancel')
	async cancelRun(@Param('runId') runId: string) {
		await this.asyncWorkflowService.cancelRun(runId)
		return { cancelled: true }
	}

	@Post(':workflowId/runs/:runId/cancel')
	async cancelWorkflowRun(@Param('workflowId') workflowId: string, @Param('runId') runId: string) {
		await this.asyncWorkflowService.cancelRun(runId)
		return { cancelled: true }
	}

	@Post(':id/trigger')
	async trigger(@Param('id') id: string, @Body() body: { input?: Record<string, unknown> }) {
		// Trigger async execution by default
		return this.asyncWorkflowService.executeAsync(id, body.input)
	}

	@Get(':id/runs')
	async listRuns(@Param('id') id: string) {
		return this.workflowService.listRuns(id)
	}

	@Get('runs/:runId/logs')
	async getRunLogs(@Param('runId') runId: string) {
		const status = await this.asyncWorkflowService.getRunStatus(runId)
		return { logs: status.logs }
	}

	@Get(':workflowId/runs/:runId/logs')
	async getWorkflowRunLogs(@Param('workflowId') workflowId: string, @Param('runId') runId: string) {
		const status = await this.asyncWorkflowService.getRunStatus(runId)
		return { logs: status.logs }
	}
} 