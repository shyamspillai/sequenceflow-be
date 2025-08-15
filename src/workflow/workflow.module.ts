import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BullModule } from '@nestjs/bullmq'
import { WorkflowService } from './workflow.service'
import { WorkflowController } from './workflow.controller'
import { ApiTemplateController } from './api-template.controller'
import { MockApiController } from './mock-api.controller'
import { Workflow } from './entities/workflow.entity'
import { WorkflowNode } from './entities/node.entity'
import { WorkflowEdge } from './entities/edge.entity'
import { WorkflowRun } from './entities/run.entity'
import { WorkflowRunLog } from './entities/runLog.entity'
import { WorkflowTask } from './entities/task.entity'
import { ApiTemplate } from './entities/api-template.entity'
import { WorkflowQueues } from './queues/workflow.queue'
import { AsyncWorkflowService } from './services/async-workflow.service'
import { TaskExecutionService } from './services/task-execution.service'
import { DependencyService } from './services/dependency.service'
import { ApiTemplateService } from './services/api-template.service'
import { WorkflowSeedService } from './services/workflow-seed.service'
import { TaskProcessor } from './processors/task.processor'
import { DependencyProcessor } from './processors/dependency.processor'

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Workflow, 
			WorkflowNode, 
			WorkflowEdge, 
			WorkflowRun, 
			WorkflowRunLog,
			WorkflowTask,
			ApiTemplate
		]),
		BullModule.forRoot({
			connection: {
				host: process.env.REDIS_HOST || 'localhost',
				port: Number(process.env.REDIS_PORT) || 6379,
				password: process.env.REDIS_PASSWORD || undefined,
			},
		}),
		BullModule.registerQueue(
			{
				name: 'workflow-tasks',
			},
			{
				name: 'workflow-dependencies',
			}
		),
	],
	controllers: [WorkflowController, ApiTemplateController, MockApiController],
	providers: [
		WorkflowService,
		AsyncWorkflowService,
		TaskExecutionService,
		DependencyService,
		ApiTemplateService,
		WorkflowSeedService,
		WorkflowQueues,
		TaskProcessor,
		DependencyProcessor,
	],
	exports: [
		WorkflowService,
		AsyncWorkflowService,
		ApiTemplateService,
		WorkflowQueues,
	],
})
export class WorkflowModule {} 