import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { Logger } from '@nestjs/common'
import { AppModule } from './app.module'
import { WorkflowQueues } from './workflow/queues/workflow.queue'
import { TaskExecutionService } from './workflow/services/task-execution.service'
import { DependencyService } from './workflow/services/dependency.service'
import { Worker } from 'bullmq'

async function bootstrap() {
	const logger = new Logger('WorkflowWorker')
	
	try {
		// Create NestJS application for dependency injection
		const app = await NestFactory.createApplicationContext(AppModule, {
			logger: ['error', 'warn', 'log'],
		})

		// Get services
		const queues = app.get(WorkflowQueues)
		const taskExecutionService = app.get(TaskExecutionService)
		const dependencyService = app.get(DependencyService)

		// Redis connection config
		const redisConnection = {
			host: process.env.REDIS_HOST || 'localhost',
			port: Number(process.env.REDIS_PORT) || 6379,
			password: process.env.REDIS_PASSWORD || undefined,
		}

		// Create task worker
		const taskWorker = new Worker(
			'workflow-tasks',
			async (job) => {
				const { taskId } = job.data
				logger.log(`Processing task job ${job.id}: taskId=${taskId}`)
				await taskExecutionService.executeTask(taskId)
			},
			{
				connection: redisConnection,
				concurrency: Number(process.env.WORKER_CONCURRENCY) || 5,
				maxStalledCount: 3,
				stalledInterval: 30000,
			}
		)

		// Create dependency worker
		const dependencyWorker = new Worker(
			'workflow-dependencies',
			async (job) => {
				const { runId, completedNodeId } = job.data
				logger.log(`Processing dependency job ${job.id}: runId=${runId}, completedNodeId=${completedNodeId}`)
				await dependencyService.checkAndQueueReadyTasks(runId, completedNodeId)
			},
			{
				connection: redisConnection,
				concurrency: Number(process.env.WORKER_CONCURRENCY) || 10,
				maxStalledCount: 3,
				stalledInterval: 30000,
			}
		)

		// Worker event handlers
		taskWorker.on('completed', (job) => {
			logger.log(`Task job ${job.id} completed`)
		})

		taskWorker.on('failed', (job, error) => {
			logger.error(`Task job ${job?.id} failed:`, error)
		})

		taskWorker.on('stalled', (jobId) => {
			logger.warn(`Task job ${jobId} stalled`)
		})

		dependencyWorker.on('completed', (job) => {
			logger.log(`Dependency job ${job.id} completed`)
		})

		dependencyWorker.on('failed', (job, error) => {
			logger.error(`Dependency job ${job?.id} failed:`, error)
		})

		dependencyWorker.on('stalled', (jobId) => {
			logger.warn(`Dependency job ${jobId} stalled`)
		})

		// Graceful shutdown
		const gracefulShutdown = async () => {
			logger.log('Shutting down workers gracefully...')
			await taskWorker.close()
			await dependencyWorker.close()
			await app.close()
			logger.log('Workers shut down successfully')
			process.exit(0)
		}

		process.on('SIGTERM', gracefulShutdown)
		process.on('SIGINT', gracefulShutdown)

		logger.log(`Workflow worker started with concurrency: ${taskWorker.opts.concurrency} (tasks), ${dependencyWorker.opts.concurrency} (dependencies)`)
		logger.log('Worker is ready to process jobs...')

	} catch (error) {
		logger.error('Failed to start worker:', error)
		process.exit(1)
	}
}

bootstrap() 