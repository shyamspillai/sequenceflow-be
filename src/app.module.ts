import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WorkflowModule } from './workflow/workflow.module'
import { Workflow } from './workflow/entities/workflow.entity'
import { WorkflowNode } from './workflow/entities/node.entity'
import { WorkflowEdge } from './workflow/entities/edge.entity'

@Module({
	imports: [
		TypeOrmModule.forRoot({
			type: 'postgres',
			host: process.env.PGHOST || 'localhost',
			port: Number(process.env.PGPORT || 5432),
			username: process.env.PGUSER || 'postgres',
			password: process.env.PGPASSWORD || 'postgres',
			database: process.env.PGDATABASE || 'sequence',
			entities: [Workflow, WorkflowNode, WorkflowEdge],
			synchronize: true,
		}),
		WorkflowModule,
	],
})
export class AppModule {} 