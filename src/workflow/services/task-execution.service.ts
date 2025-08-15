import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { WorkflowTask } from '../entities/task.entity'
import { WorkflowRun } from '../entities/run.entity'
import { WorkflowRunLog } from '../entities/runLog.entity'
import { NodeExecuteResult, NodeExecutor, getExecutors } from '../utils/runner'
import { WorkflowQueues, TaskJobData } from '../queues/workflow.queue'

@Injectable()
export class TaskExecutionService {
	private readonly logger = new Logger(TaskExecutionService.name)

	constructor(
		@InjectRepository(WorkflowTask) private readonly taskRepo: Repository<WorkflowTask>,
		@InjectRepository(WorkflowRun) private readonly runRepo: Repository<WorkflowRun>,
		@InjectRepository(WorkflowRunLog) private readonly logRepo: Repository<WorkflowRunLog>,
		private readonly queues: WorkflowQueues,
	) {}

	/**
	 * Execute a single task
	 */
	async executeTask(taskId: string): Promise<void> {
		const task = await this.taskRepo.findOne({
			where: { id: taskId },
			relations: ['run', 'run.workflow'],
		})

		if (!task) {
			this.logger.error(`Task ${taskId} not found`)
			return
		}

		if (task.status !== 'queued') {
			this.logger.warn(`Task ${taskId} is not in queued state, current status: ${task.status}`)
			return
		}

		// Mark task as running
		task.status = 'running'
		task.startedAt = new Date()
		await this.taskRepo.save(task)

		this.logger.log(`Starting execution of task ${taskId} (node: ${task.nodeId}, type: ${task.nodeType})`)

		try {
			// Get the node executor based on type
			const executor = this.getNodeExecutor(task.nodeType)
			if (!executor) {
				throw new Error(`No executor found for node type: ${task.nodeType}`)
			}

			// Load the actual node configuration from the database
			const nodeRepo = this.runRepo.manager.getRepository('WorkflowNode')
			const nodeEntity = await nodeRepo.findOne({
				where: { 
					workflow: { id: task.run.workflow.id },
					baseId: task.nodeId
				}
			})

			let nodeConfig = {}
			if (nodeEntity) {
				// Parse the node configuration
				try {
					nodeConfig = typeof nodeEntity.config === 'string' 
						? JSON.parse(nodeEntity.config) 
						: (nodeEntity.config || {})
				} catch (error) {
					this.logger.warn(`Failed to parse node config for ${task.nodeId}: ${error}`)
				}
			}

			// Create node base object with actual configuration
			const nodeBase = {
				id: task.nodeId,
				type: task.nodeType,
				name: nodeEntity?.name || `${task.nodeType}-${task.nodeId}`,
				config: nodeConfig, // Use actual config from database
				inputSchema: {},
				outputSchema: {},
				connections: [],
			}

			// Execute the node
			const result: NodeExecuteResult = await executor(nodeBase, task.input || {})

			// Save logs
			if (result.logs && result.logs.length > 0) {
				const logEntities = result.logs.map(log => {
					const entity = new WorkflowRunLog()
					entity.run = task.run
					entity.nodePersistedId = task.nodeId
					entity.type = 'node-output'
					entity.message = log.content
					entity.data = { name: log.name, kind: log.kind }
					return entity
				})
				await this.logRepo.save(logEntities)
			}

			// Mark task as completed
			task.status = 'completed'
			task.output = result.payload || null
			task.allowedSourceHandles = result.allowedSourceHandles ? Array.from(result.allowedSourceHandles) : null
			task.completedAt = new Date()
			await this.taskRepo.save(task)

			this.logger.log(`Task ${taskId} completed successfully`)

			// Queue downstream tasks
			await this.queues.addDependencyCheckJob({
				runId: task.run.id,
				completedNodeId: task.nodeId,
			})

		} catch (error) {
			this.logger.error(`Task ${taskId} failed:`, error)

			// Mark task as failed
			task.status = 'failed'
			task.error = error instanceof Error ? error.message : String(error)
			task.completedAt = new Date()
			await this.taskRepo.save(task)

			// Still queue dependency check to handle workflow completion
			await this.queues.addDependencyCheckJob({
				runId: task.run.id,
				completedNodeId: task.nodeId,
			})
		}
	}

	private getNodeExecutor(nodeType: string): NodeExecutor | null {
		const executors = getExecutors()
		return executors[nodeType] || null
	}

	private async checkRunFailure(runId: string): Promise<void> {
		// Check if there are any more pending/queued tasks
		const pendingTasks = await this.taskRepo.count({
			where: { 
				run: { id: runId },
				status: 'pending' as any
			}
		})

		const queuedTasks = await this.taskRepo.count({
			where: { 
				run: { id: runId },
				status: 'queued' as any
			}
		})

		// If no more tasks to process, check if we should mark run as failed
		if (pendingTasks === 0 && queuedTasks === 0) {
			const failedTasks = await this.taskRepo.count({
				where: { 
					run: { id: runId },
					status: 'failed' as any
				}
			})

			if (failedTasks > 0) {
				const run = await this.runRepo.findOne({ where: { id: runId } })
				if (run) {
					run.status = 'failed'
					run.finishedAt = new Date()
					await this.runRepo.save(run)
				}
			}
		}
	}
} 