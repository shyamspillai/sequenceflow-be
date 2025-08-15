import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { WorkflowTask } from '../entities/task.entity'
import { WorkflowRun } from '../entities/run.entity'
import { WorkflowEdge } from '../entities/edge.entity'
import { WorkflowQueues } from '../queues/workflow.queue'

@Injectable()
export class DependencyService {
	private readonly logger = new Logger(DependencyService.name)

	constructor(
		@InjectRepository(WorkflowTask) private readonly taskRepo: Repository<WorkflowTask>,
		@InjectRepository(WorkflowRun) private readonly runRepo: Repository<WorkflowRun>,
		@InjectRepository(WorkflowEdge) private readonly edgeRepo: Repository<WorkflowEdge>,
		private readonly queues: WorkflowQueues,
	) {}

	/**
	 * Check dependencies and queue ready tasks when a node completes
	 */
	async checkAndQueueReadyTasks(runId: string, completedNodeId: string): Promise<void> {
		this.logger.log(`Checking dependencies after completion of node ${completedNodeId} in run ${runId}`)

		const run = await this.runRepo.findOne({ 
			where: { id: runId },
			relations: ['workflow'] // Add missing workflow relation
		})
		if (!run) {
			this.logger.error(`Run ${runId} not found`)
			return
		}

		// Get the completed task to check allowed source handles
		const completedTask = await this.taskRepo.findOne({
			where: { run: { id: runId }, nodeId: completedNodeId }
		})

		if (!completedTask || completedTask.status !== 'completed') {
			this.logger.warn(`Completed task not found or not in completed state for node ${completedNodeId}`)
			return
		}

		// Find all edges where this node is the source
		const outgoingEdges = await this.edgeRepo.find({
			where: { workflow: { id: run.workflow.id }, sourceId: completedNodeId }
		})

		// Filter edges based on allowed source handles (for decision nodes)
		const validEdges = outgoingEdges.filter(edge => {
			if (!completedTask.allowedSourceHandles) {
				// No handle restrictions specified, all edges are valid (for non-decision nodes)
				return true
			}
			if (completedTask.allowedSourceHandles.length === 0) {
				// Empty allowedSourceHandles means no edges should be followed (decision node with 0 matches)
				return false
			}
			// Check if this edge's source handle is allowed
			return edge.sourceHandleId && completedTask.allowedSourceHandles.includes(edge.sourceHandleId)
		})

		// Check each target node's dependencies
		for (const edge of validEdges) {
			await this.checkNodeDependencies(runId, edge.targetId, completedTask.output || {})
		}

		// Check if the entire workflow run is complete
		await this.checkWorkflowCompletion(runId)
	}

	/**
	 * Check if a specific node's dependencies are satisfied and queue it if ready
	 */
	private async checkNodeDependencies(runId: string, nodeId: string, payload: Record<string, unknown>): Promise<void> {
		// Get the task for this node
		const task = await this.taskRepo.findOne({
			where: { run: { id: runId }, nodeId },
			relations: ['run', 'run.workflow'] // Add missing relations
		})

		if (!task) {
			this.logger.warn(`Task not found for node ${nodeId} in run ${runId}`)
			return
		}

		if (task.status !== 'pending') {
			this.logger.debug(`Task ${task.id} is not in pending state (current: ${task.status})`)
			return
		}

		// Check if all dependencies are completed
		const allDependenciesCompleted = await this.areDependenciesSatisfied(runId, task.dependencies)

		if (allDependenciesCompleted) {
			this.logger.log(`All dependencies satisfied for task ${task.id} (node ${nodeId}), queuing for execution`)
			
			// Update task status and input
			task.status = 'queued'
			task.input = payload
			const savedTask = await this.taskRepo.save(task)

			// Add to execution queue
			const job = await this.queues.addTaskJob({
				taskId: savedTask.id,
				runId: runId,
				nodeId: nodeId,
				nodeType: task.nodeType,
				input: payload,
				workflowId: savedTask.run.workflow.id, // Now this will work
			})

			// Update task with job ID
			savedTask.jobId = job.id
			await this.taskRepo.save(savedTask)
		} else {
			this.logger.debug(`Dependencies not yet satisfied for task ${task.id} (node ${nodeId})`)
		}
	}

	/**
	 * Check if all dependencies for a task are satisfied
	 */
	private async areDependenciesSatisfied(runId: string, dependencies: string[]): Promise<boolean> {
		if (dependencies.length === 0) {
			return true // No dependencies
		}

		for (const depNodeId of dependencies) {
			const depTask = await this.taskRepo.findOne({
				where: { run: { id: runId }, nodeId: depNodeId }
			})

			if (!depTask || depTask.status !== 'completed') {
				return false
			}
		}

		return true
	}

	/**
	 * Check if the entire workflow run is complete
	 */
	private async checkWorkflowCompletion(runId: string): Promise<void> {
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

		const runningTasks = await this.taskRepo.count({
			where: { 
				run: { id: runId },
				status: 'running' as any
			}
		})

		// If no more tasks to process, mark run as complete
		if (pendingTasks === 0 && queuedTasks === 0 && runningTasks === 0) {
			const run = await this.runRepo.findOne({ where: { id: runId } })
			if (run && run.status === 'running') {
				// Check if any tasks failed
				const failedTasks = await this.taskRepo.count({
					where: { 
						run: { id: runId },
						status: 'failed' as any
					}
				})

				run.status = failedTasks > 0 ? 'failed' : 'succeeded'
				run.finishedAt = new Date()
				
				// Get task completion stats
				const completedTasks = await this.taskRepo.count({
					where: { 
						run: { id: runId },
						status: 'completed' as any
					}
				})

				run.result = {
					completedTasks,
					failedTasks,
					totalTasks: completedTasks + failedTasks,
				}

				await this.runRepo.save(run)
				this.logger.log(`Workflow run ${runId} completed with status: ${run.status}`)
			}
		}
	}

	/**
	 * Build dependency graph for tasks in a workflow run
	 */
	async buildTaskDependencies(runId: string): Promise<void> {
		const run = await this.runRepo.findOne({ 
			where: { id: runId },
			relations: ['workflow']
		})

		if (!run) {
			throw new Error(`Run ${runId} not found`)
		}

		// Get all edges for this workflow
		const edges = await this.edgeRepo.find({
			where: { workflow: { id: run.workflow.id } }
		})

		// Get all tasks for this run
		const tasks = await this.taskRepo.find({
			where: { run: { id: runId } }
		})

		// Build dependency map
		const dependencyMap = new Map<string, string[]>()

		for (const edge of edges) {
			const deps = dependencyMap.get(edge.targetId) || []
			deps.push(edge.sourceId)
			dependencyMap.set(edge.targetId, deps)
		}

		// Update tasks with their dependencies
		for (const task of tasks) {
			const dependencies = dependencyMap.get(task.nodeId) || []
			task.dependencies = dependencies
			await this.taskRepo.save(task)
		}

		this.logger.log(`Built dependencies for ${tasks.length} tasks in run ${runId}`)
	}
} 