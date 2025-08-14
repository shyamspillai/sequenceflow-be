import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WorkflowService } from './workflow.service'
import { WorkflowController } from './workflow.controller'
import { Workflow } from './entities/workflow.entity'
import { WorkflowNode } from './entities/node.entity'
import { WorkflowEdge } from './entities/edge.entity'

@Module({
	imports: [TypeOrmModule.forFeature([Workflow, WorkflowNode, WorkflowEdge])],
	controllers: [WorkflowController],
	providers: [WorkflowService],
})
export class WorkflowModule {} 