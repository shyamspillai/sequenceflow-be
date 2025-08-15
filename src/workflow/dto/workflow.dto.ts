import { Type } from 'class-transformer'
import { IsArray, IsInt, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator'

export class PersistedEdgeDto {
	@IsString()
	id!: string

	@IsString()
	sourceId!: string

	@IsString()
	targetId!: string

	@IsOptional()
	@IsString()
	sourceHandleId?: string

	@IsOptional()
	@IsString()
	targetHandleId?: string
}

export class PersistedNodePositionDto {
	@Type(() => Number)
	@IsNumber()
	x!: number

	@Type(() => Number)
	@IsNumber()
	y!: number
}

export class WorkflowNodeBaseDto {
	@IsString()
	id!: string

	@IsString()
	type!: string

	@IsString()
	name!: string

	@IsObject()
	inputSchema!: Record<string, unknown>

	@IsObject()
	outputSchema!: Record<string, unknown>

	@IsObject()
	config!: Record<string, unknown>

	@IsOptional()
	@IsObject()
	validationLogic?: Record<string, unknown>

	@IsArray()
	connections!: string[]
}

export class PersistedNodeDto {
	@IsString()
	id!: string

	@ValidateNested()
	@Type(() => WorkflowNodeBaseDto)
	base!: WorkflowNodeBaseDto

	@ValidateNested()
	@Type(() => PersistedNodePositionDto)
	position!: PersistedNodePositionDto
}

export class PersistedWorkflowDto {
	@IsString()
	id!: string

	@IsString()
	name!: string

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => PersistedNodeDto)
	nodes!: PersistedNodeDto[]

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => PersistedEdgeDto)
	edges!: PersistedEdgeDto[]

	@IsInt()
	createdAt!: number

	@IsInt()
	updatedAt!: number
}

export class WorkflowSummaryDto {
	@IsString()
	id!: string

	@IsString()
	name!: string

	@IsInt()
	updatedAt!: number
}

export class CreateWorkflowPayloadDto {
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => PersistedNodeDto)
	nodes!: PersistedNodeDto[]

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => PersistedEdgeDto)
	edges!: PersistedEdgeDto[]
}

export class CreateWorkflowInputDto {
	@IsString()
	@IsNotEmpty()
	name!: string

	@ValidateNested()
	@Type(() => CreateWorkflowPayloadDto)
	workflow!: CreateWorkflowPayloadDto
}

export class UpdateWorkflowInputDto {
	@IsOptional()
	@IsString()
	id?: string

	@IsString()
	@IsNotEmpty()
	name!: string

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => PersistedNodeDto)
	nodes?: PersistedNodeDto[]

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => PersistedEdgeDto)
	edges?: PersistedEdgeDto[]

	@IsOptional()
	@IsInt()
	createdAt?: number

	@IsOptional()
	@IsInt()
	updatedAt?: number

	@IsOptional()
	@ValidateNested()
	@Type(() => CreateWorkflowPayloadDto)
	workflow?: CreateWorkflowPayloadDto
} 