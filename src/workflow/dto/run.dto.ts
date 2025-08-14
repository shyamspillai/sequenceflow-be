import { IsArray, IsDate, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class WorkflowRunLogDto {
	@IsString()
	id!: string

	@IsString()
	type!: 'info' | 'error' | 'node-output' | 'system'

	@IsOptional()
	@IsString()
	nodePersistedId?: string

	@IsString()
	message!: string

	@IsOptional()
	data?: Record<string, unknown>

	@Type(() => Number)
	@IsInt()
	timestamp!: number
}

export class WorkflowRunSummaryDto {
	@IsString()
	id!: string

	@IsString()
	status!: 'queued' | 'running' | 'succeeded' | 'failed'

	@Type(() => Number)
	@IsInt()
	startedAt!: number

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	finishedAt?: number
}

export class WorkflowRunDetailDto extends WorkflowRunSummaryDto {
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => WorkflowRunLogDto)
	logs!: WorkflowRunLogDto[]
}

export class ExecuteResponseDto {
	@IsString()
	runId!: string

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => WorkflowRunLogDto)
	logs!: WorkflowRunLogDto[]
} 