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

		// Get the completed task to check allowed source handles and any delay
		const completedTask = await this.taskRepo.findOne({
			where: { run: { id: runId }, nodeId: completedNodeId }
		})

		if (!completedTask || completedTask.status !== 'completed') {
			this.logger.warn(`Completed task not found or not in completed state for node ${completedNodeId}`)
			return
		}

		// Extract delay from completed task output if it's a delay node
		const delayMs = (completedTask.output as any)?.delayMs || 0

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
			await this.checkNodeDependencies(runId, edge.targetId, completedTask.output || {}, delayMs)
		}

		// Check if the entire workflow run is complete
		await this.checkWorkflowCompletion(runId)
	}

	/**
	 * Check if a specific node's dependencies are satisfied and queue it if ready
	 */
	private async checkNodeDependencies(runId: string, nodeId: string, payload: Record<string, unknown>, delayMs?: number): Promise<void> {
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
			if (delayMs && delayMs > 0) {
				this.logger.log(`Dependencies satisfied for task ${task.id} (node ${nodeId}), queuing with ${delayMs}ms delay`)
			} else {
				this.logger.log(`All dependencies satisfied for task ${task.id} (node ${nodeId}), queuing for execution`)
			}
			
			// Update task status and input
			task.status = 'queued'
			task.input = payload
			const savedTask = await this.taskRepo.save(task)

			// Add to execution queue with optional delay
			const jobOptions: any = {
				attempts: 3,
				backoff: {
					type: 'exponential',
					delay: 2000,
				},
			}

			// Add delay if specified (for delay nodes)
			if (delayMs && delayMs > 0) {
				jobOptions.delay = delayMs
			}

			const job = await this.queues.addTaskJob({
				taskId: savedTask.id,
				runId: runId,
				nodeId: nodeId,
				nodeType: task.nodeType,
				input: payload,
				workflowId: savedTask.run.workflow.id, // Now this will work
			}, jobOptions)

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

		// If there are still running or queued tasks, don't mark anything as skipped yet
		if (runningTasks > 0 || queuedTasks > 0) {
			this.logger.debug(`Workflow ${runId} still has active tasks: ${runningTasks} running, ${queuedTasks} queued`)
			return
		}

		// Only when no tasks are running or queued, check for unreachable pending tasks
		if (pendingTasks > 0) {
			await this.markUnreachableTasksAsSkipped(runId)
			// Recount pending tasks after marking some as skipped
			const remainingPendingTasks = await this.taskRepo.count({
				where: { 
					run: { id: runId },
					status: 'pending' as any
				}
			})
			if (remainingPendingTasks > 0) {
				this.logger.debug(`Workflow ${runId} still has ${remainingPendingTasks} pending tasks that might become reachable`)
				return
			}
		}

		// Final check - recount all task types to ensure accuracy
		const finalPendingTasks = await this.taskRepo.count({
			where: { 
				run: { id: runId },
				status: 'pending' as any
			}
		})

		// If no more tasks to process, mark run as complete
		if (finalPendingTasks === 0 && queuedTasks === 0 && runningTasks === 0) {
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

				const skippedTasks = await this.taskRepo.count({
					where: { 
						run: { id: runId },
						status: 'skipped' as any
					}
				})

				run.result = {
					completedTasks,
					failedTasks,
					skippedTasks,
					totalTasks: completedTasks + failedTasks + skippedTasks,
				}

				await this.runRepo.save(run)
				this.logger.log(`Workflow run ${runId} completed with status: ${run.status} (${completedTasks} completed, ${failedTasks} failed, ${skippedTasks} skipped)`)
			}
		}
	}

	/**
	 * Mark tasks as skipped if they are unreachable due to decision node branching
	 */
	private async markUnreachableTasksAsSkipped(runId: string): Promise<void> {
		this.logger.debug(`Starting reachability analysis for run ${runId}`)
		const run = await this.runRepo.findOne({ 
			where: { id: runId },
			relations: ['workflow']
		})
		if (!run) return

		// Get all edges for this workflow
		const edges = await this.edgeRepo.find({
			where: { workflow: { id: run.workflow.id } }
		})

		// Get all tasks for this run
		const tasks = await this.taskRepo.find({
			where: { run: { id: runId } }
		})

		// Build a map of tasks and their allowed source handles (for decision/ifElse nodes)
		const tasksWithHandles = tasks.filter(t => 
			(t.status === 'completed' || t.status === 'running' || t.status === 'queued') &&
			t.allowedSourceHandles && t.allowedSourceHandles.length > 0
		)
		const allowedHandles = new Map<string, Set<string>>()
		
		for (const task of tasksWithHandles) {
			allowedHandles.set(task.nodeId, new Set(task.allowedSourceHandles))
			this.logger.debug(`Task ${task.nodeId} (${task.nodeType}) has allowed handles: [${task.allowedSourceHandles?.join(', ')}]`)
		}

		// Find reachable nodes by traversing from active execution paths
		const reachableNodes = new Set<string>()
		
		// Add all completed/running/queued nodes as reachable
		for (const task of tasks) {
			if (task.status === 'completed' || task.status === 'running' || task.status === 'queued') {
				reachableNodes.add(task.nodeId)
			}
		}

		// Traverse from all active nodes to find reachable downstream nodes
		let changed = true
		while (changed) {
			changed = false
			
			// Check all currently reachable nodes to see what they can reach
			const currentlyReachable = Array.from(reachableNodes)
			for (const nodeId of currentlyReachable) {
				const nodeAllowedHandles = allowedHandles.get(nodeId)
				
				// Find outgoing edges from this node
				const outgoingEdges = edges.filter(e => e.sourceId === nodeId)
				
				for (const edge of outgoingEdges) {
					// Check if this edge is allowed based on decision/ifElse node output
					const isEdgeAllowed = !nodeAllowedHandles || 
						!edge.sourceHandleId || 
						nodeAllowedHandles.has(edge.sourceHandleId)
					
					this.logger.debug(`Edge ${edge.sourceId} -> ${edge.targetId} (handle: ${edge.sourceHandleId}): ${isEdgeAllowed ? 'ALLOWED' : 'BLOCKED'}`)
					
					if (isEdgeAllowed && !reachableNodes.has(edge.targetId)) {
						reachableNodes.add(edge.targetId)
						changed = true
						this.logger.debug(`Added ${edge.targetId} to reachable nodes`)
					}
				}
			}
		}

		// Mark unreachable pending tasks as skipped
		const pendingTasks = tasks.filter(t => t.status === 'pending')
		const tasksToSkip = pendingTasks.filter(t => !reachableNodes.has(t.nodeId))
		
		if (tasksToSkip.length > 0) {
			for (const task of tasksToSkip) {
				task.status = 'skipped'
				task.completedAt = new Date()
			}
			await this.taskRepo.save(tasksToSkip)
			const skippedNodeIds = tasksToSkip.map(t => t.nodeId).join(', ')
			this.logger.log(`Marked ${tasksToSkip.length} unreachable tasks as skipped in run ${runId}: nodes [${skippedNodeIds}]`)
		} else {
			this.logger.debug(`No tasks to skip in run ${runId}. Reachable nodes: [${Array.from(reachableNodes).join(', ')}]`)
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