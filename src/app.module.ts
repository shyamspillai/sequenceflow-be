import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WorkflowModule } from './workflow/workflow.module'
import { Workflow } from './workflow/entities/workflow.entity'
import { WorkflowNode } from './workflow/entities/node.entity'
import { WorkflowEdge } from './workflow/entities/edge.entity'
import { WorkflowRun } from './workflow/entities/run.entity'
import { WorkflowRunLog } from './workflow/entities/runLog.entity'
import { WorkflowTask } from './workflow/entities/task.entity'

@Module({
	imports: [
		TypeOrmModule.forRoot({
			type: 'postgres',
			host: process.env.PGHOST || 'localhost',
			port: Number(process.env.PGPORT || 5432),
			username: process.env.PGUSER || 'postgres',
			password: process.env.PGPASSWORD || 'postgres',
			database: process.env.PGDATABASE || 'sequence',
			entities: [Workflow, WorkflowNode, WorkflowEdge, WorkflowRun, WorkflowRunLog, WorkflowTask],
			synchronize: true,
		}),
		WorkflowModule,
	],
})
export class AppModule {} 