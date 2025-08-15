import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { TaskJobData } from '../queues/workflow.queue'
import { TaskExecutionService } from '../services/task-execution.service'

@Processor('workflow-tasks')
export class TaskProcessor extends WorkerHost {
	private readonly logger = new Logger(TaskProcessor.name)

	constructor(private readonly taskExecutionService: TaskExecutionService) {
		super()
	}

	async process(job: Job<TaskJobData>): Promise<void> {
		const { taskId, runId, nodeId, nodeType } = job.data
		
		this.logger.log(`Processing task job ${job.id}: taskId=${taskId}, nodeId=${nodeId}, type=${nodeType}`)

		try {
			await this.taskExecutionService.executeTask(taskId)
			this.logger.log(`Task job ${job.id} completed successfully`)
		} catch (error) {
			this.logger.error(`Task job ${job.id} failed:`, error)
			throw error // Re-throw to mark job as failed
		}
	}

	@OnWorkerEvent('completed')
	onCompleted(job: Job<TaskJobData>) {
		this.logger.log(`Task job ${job.id} completed`)
	}

	@OnWorkerEvent('failed')
	onFailed(job: Job<TaskJobData>, error: Error) {
		this.logger.error(`Task job ${job.id} failed:`, error)
	}

	@OnWorkerEvent('active')
	onActive(job: Job<TaskJobData>) {
		this.logger.log(`Task job ${job.id} started processing`)
	}

	@OnWorkerEvent('stalled')
	onStalled(job: Job<TaskJobData>) {
		this.logger.warn(`Task job ${job.id} stalled`)
	}
} 