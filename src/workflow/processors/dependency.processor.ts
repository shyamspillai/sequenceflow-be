import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { DependencyCheckJobData } from '../queues/workflow.queue'
import { DependencyService } from '../services/dependency.service'

@Processor('workflow-dependencies')
export class DependencyProcessor extends WorkerHost {
	private readonly logger = new Logger(DependencyProcessor.name)

	constructor(private readonly dependencyService: DependencyService) {
		super()
	}

	async process(job: Job<DependencyCheckJobData>): Promise<void> {
		const { runId, completedNodeId } = job.data
		
		this.logger.log(`Processing dependency check job ${job.id}: runId=${runId}, completedNodeId=${completedNodeId}`)

		try {
			await this.dependencyService.checkAndQueueReadyTasks(runId, completedNodeId)
			this.logger.log(`Dependency check job ${job.id} completed successfully`)
		} catch (error) {
			this.logger.error(`Dependency check job ${job.id} failed:`, error)
			throw error // Re-throw to mark job as failed
		}
	}

	@OnWorkerEvent('completed')
	onCompleted(job: Job<DependencyCheckJobData>) {
		this.logger.log(`Dependency check job ${job.id} completed`)
	}

	@OnWorkerEvent('failed')
	onFailed(job: Job<DependencyCheckJobData>, error: Error) {
		this.logger.error(`Dependency check job ${job.id} failed:`, error)
	}

	@OnWorkerEvent('active')
	onActive(job: Job<DependencyCheckJobData>) {
		this.logger.log(`Dependency check job ${job.id} started processing`)
	}

	@OnWorkerEvent('stalled')
	onStalled(job: Job<DependencyCheckJobData>) {
		this.logger.warn(`Dependency check job ${job.id} stalled`)
	}
} 