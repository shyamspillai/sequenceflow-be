import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Workflow } from '../entities/workflow.entity'
import { WorkflowNode } from '../entities/node.entity'
import { WorkflowEdge } from '../entities/edge.entity'
import { WorkflowRun } from '../entities/run.entity'
import { WorkflowRunLog } from '../entities/runLog.entity'
import { WorkflowTask } from '../entities/task.entity'
import { WorkflowQueues } from '../queues/workflow.queue'
import { DependencyService } from './dependency.service'
import { PersistedWorkflowDto } from '../dto/workflow.dto'

@Injectable()
export class AsyncWorkflowService {
	private readonly logger = new Logger(AsyncWorkflowService.name)

	constructor(
		@InjectRepository(Workflow) private readonly workflowRepo: Repository<Workflow>,
		@InjectRepository(WorkflowNode) private readonly nodeRepo: Repository<WorkflowNode>,
		@InjectRepository(WorkflowEdge) private readonly edgeRepo: Repository<WorkflowEdge>,
		@InjectRepository(WorkflowRun) private readonly runRepo: Repository<WorkflowRun>,
		@InjectRepository(WorkflowRunLog) private readonly logRepo: Repository<WorkflowRunLog>,
		@InjectRepository(WorkflowTask) private readonly taskRepo: Repository<WorkflowTask>,
		private readonly queues: WorkflowQueues,
		private readonly dependencyService: DependencyService,
	) {}

	/**
	 * Start async execution of a workflow
	 */
	async executeAsync(workflowId: string, initialInput?: Record<string, unknown>): Promise<{ runId: string }> {
		const workflow = await this.workflowRepo.findOne({ where: { id: workflowId } })
		if (!workflow) {
			throw new NotFoundException('Workflow not found')
		}

		this.logger.log(`Starting async execution of workflow ${workflowId}`)

		// Create workflow run
		let run = new WorkflowRun()
		run.workflow = workflow
		run.status = 'queued'
		run.input = initialInput ?? null
		run = await this.runRepo.save(run)

		// Log run start
		const startLog = new WorkflowRunLog()
		startLog.run = run
		startLog.type = 'system'
		startLog.message = 'Async workflow run started'
		await this.logRepo.save(startLog)

		// Create tasks for all nodes
		await this.createTasksForRun(run.id, workflowId)

		// Build task dependencies
		await this.dependencyService.buildTaskDependencies(run.id)

		// Update run status to running
		run.status = 'running'
		await this.runRepo.save(run)

		// Queue the start node (inputText) for execution
		await this.queueStartTask(run.id)

		this.logger.log(`Async workflow run ${run.id} initiated`)
		return { runId: run.id }
	}

	/**
	 * Get workflow execution status and logs
	 */
	async getRunStatus(runId: string): Promise<{
		status: string
		startedAt: Date
		finishedAt?: Date | null
		tasks: Array<{
			id: string
			nodeId: string
			nodeType: string
			status: string
			startedAt?: Date | null
			completedAt?: Date | null
			error?: string | null
		}>
		logs: Array<{
			id: string
			type: string
			message: string
			timestamp: Date
			nodeId?: string | null
		}>
	}> {
		const run = await this.runRepo.findOne({ 
			where: { id: runId },
			relations: ['logs', 'tasks']
		})

		if (!run) {
			throw new NotFoundException('Workflow run not found')
		}

		const tasks = await this.taskRepo.find({
			where: { run: { id: runId } },
			order: { createdAt: 'ASC' }
		})

		const logs = await this.logRepo.find({
			where: { run: { id: runId } },
			order: { timestamp: 'ASC' }
		})

		return {
			status: run.status,
			startedAt: run.startedAt,
			finishedAt: run.finishedAt,
			tasks: tasks.map(task => ({
				id: task.id,
				nodeId: task.nodeId,
				nodeType: task.nodeType,
				status: task.status,
				startedAt: task.startedAt,
				completedAt: task.completedAt,
				error: task.error,
			})),
			logs: logs.map(log => ({
				id: log.id,
				type: log.type,
				message: log.message,
				timestamp: log.timestamp,
				nodeId: log.nodePersistedId,
			}))
		}
	}

	/**
	 * Cancel a running workflow
	 */
	async cancelRun(runId: string): Promise<void> {
		const run = await this.runRepo.findOne({ where: { id: runId } })
		if (!run) {
			throw new NotFoundException('Workflow run not found')
		}

		if (run.status !== 'running' && run.status !== 'queued') {
			throw new Error(`Cannot cancel run in status: ${run.status}`)
		}

		// Update run status
		run.status = 'failed'
		run.finishedAt = new Date()
		run.result = { cancelled: true }
		await this.runRepo.save(run)

		// Cancel all pending/queued tasks
		await this.taskRepo.update(
			{ run: { id: runId }, status: 'pending' as any },
			{ status: 'skipped' as any }
		)

		await this.taskRepo.update(
			{ run: { id: runId }, status: 'queued' as any },
			{ status: 'skipped' as any }
		)

		// Log cancellation
		const cancelLog = new WorkflowRunLog()
		cancelLog.run = run
		cancelLog.type = 'system'
		cancelLog.message = 'Workflow run cancelled'
		await this.logRepo.save(cancelLog)

		this.logger.log(`Workflow run ${runId} cancelled`)
	}

	private async createTasksForRun(runId: string, workflowId: string): Promise<void> {
		const run = await this.runRepo.findOne({ where: { id: runId } })
		if (!run) {
			throw new Error(`Run ${runId} not found`)
		}

		// Get all nodes for this workflow
		const nodes = await this.nodeRepo.find({
			where: { workflow: { id: workflowId } }
		})

		// Create a task for each node
		const tasks: WorkflowTask[] = []
		for (const node of nodes) {
			const task = new WorkflowTask()
			task.run = run
			task.nodeId = node.baseId // Use baseId which is the frontend node id
			task.nodeType = node.type
			task.status = 'pending'
			task.dependencies = [] // Will be filled by buildTaskDependencies
			tasks.push(task)
		}

		await this.taskRepo.save(tasks)
		this.logger.log(`Created ${tasks.length} tasks for run ${runId}`)
	}

	private async queueStartTask(runId: string): Promise<void> {
		// Find the start task - either inputText or a task with no dependencies
		let startTask = await this.taskRepo.findOne({
			where: { 
				run: { id: runId },
				nodeType: 'inputText'
			},
			relations: ['run', 'run.workflow']
		})

		// If no inputText node found, find the task with no dependencies (root node)
		if (!startTask) {
			const allTasks = await this.taskRepo.find({
				where: { run: { id: runId } },
				relations: ['run', 'run.workflow']
			})

			// Find task with empty dependencies array or null
			startTask = allTasks.find(task => 
				!task.dependencies || 
				task.dependencies.length === 0 || 
				(Array.isArray(task.dependencies) && task.dependencies.every(dep => !dep))
			)
		}

		if (!startTask) {
			throw new Error(`Start task not found for run ${runId}`)
		}

		// Queue the start task with initial input
		const run = await this.runRepo.findOne({ where: { id: runId } })
		if (!run) {
			throw new Error(`Run ${runId} not found`)
		}

		startTask.status = 'queued'
		startTask.input = run.input || {}
		const savedTask = await this.taskRepo.save(startTask)

		// Add to execution queue
		const job = await this.queues.addTaskJob({
			taskId: savedTask.id,
			runId: runId,
			nodeId: startTask.nodeId,
			nodeType: startTask.nodeType,
			input: savedTask.input,
			workflowId: savedTask.run.workflow.id,
		})

		// Update task with job ID
		savedTask.jobId = job.id
		await this.taskRepo.save(savedTask)

		this.logger.log(`Queued start task ${savedTask.id} for run ${runId}`)
	}

	/**
	 * Get workflow data in the format expected by executors
	 */
	async getWorkflowData(workflowId: string): Promise<PersistedWorkflowDto> {
		const workflow = await this.workflowRepo.findOne({ where: { id: workflowId } })
		if (!workflow) {
			throw new Error(`Workflow ${workflowId} not found`)
		}

		return this.toPersistedDto(workflow)
	}

	private toPersistedDto(workflow: Workflow): PersistedWorkflowDto {
		// This method should be shared with the original WorkflowService
		// For now, we'll implement a basic version
		return {
			id: workflow.id,
			name: workflow.name,
			nodes: [], // Would need to load from DB
			edges: [], // Would need to load from DB
			createdAt: workflow.createdAt.getTime(),
			updatedAt: workflow.updatedAt.getTime(),
		}
	}
} 