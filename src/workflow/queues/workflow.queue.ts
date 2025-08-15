import { Queue } from 'bullmq'
import { Injectable } from '@nestjs/common'

export interface TaskJobData {
	taskId: string
	runId: string
	nodeId: string
	nodeType: string
	input?: Record<string, unknown>
	workflowId: string
}

export interface DependencyCheckJobData {
	runId: string
	completedNodeId: string
}

@Injectable()
export class WorkflowQueues {
	// Main task execution queue
	readonly taskQueue: Queue<TaskJobData>
	
	// Queue for checking and triggering dependent tasks
	readonly dependencyQueue: Queue<DependencyCheckJobData>

	constructor() {
		const redisConnection = {
			host: process.env.REDIS_HOST || 'localhost',
			port: Number(process.env.REDIS_PORT) || 6379,
			password: process.env.REDIS_PASSWORD || undefined,
		}

		this.taskQueue = new Queue('workflow-tasks', {
			connection: redisConnection,
			defaultJobOptions: {
				removeOnComplete: 100, // Keep last 100 completed jobs
				removeOnFail: 50,     // Keep last 50 failed jobs
				attempts: 3,          // Retry failed tasks up to 3 times
				backoff: {
					type: 'exponential',
					delay: 2000,
				},
			},
		})

		this.dependencyQueue = new Queue('workflow-dependencies', {
			connection: redisConnection,
			defaultJobOptions: {
				removeOnComplete: 50,
				removeOnFail: 25,
				attempts: 2,
				backoff: {
					type: 'exponential',
					delay: 1000,
				},
			},
		})
	}

	async addTaskJob(data: TaskJobData, options?: { delay?: number; priority?: number }) {
		return this.taskQueue.add('execute-task', data, {
			priority: options?.priority || 0,
			delay: options?.delay || 0,
		})
	}

	async addDependencyCheckJob(data: DependencyCheckJobData, options?: { delay?: number }) {
		return this.dependencyQueue.add('check-dependencies', data, {
			delay: options?.delay || 0,
		})
	}

	async close() {
		await this.taskQueue.close()
		await this.dependencyQueue.close()
	}
} 