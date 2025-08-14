import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { WorkflowRun } from './run.entity'

export type RunLogType = 'info' | 'error' | 'node-output' | 'system'

@Entity({ name: 'workflow_run_logs' })
export class WorkflowRunLog {
	@PrimaryGeneratedColumn('uuid')
	id!: string

	@Index()
	@ManyToOne(() => WorkflowRun, run => run.logs, { onDelete: 'CASCADE' })
	run!: WorkflowRun

	// workflow-level log has null nodePersistedId
	@Column({ type: 'varchar', length: 255, nullable: true })
	nodePersistedId?: string | null

	@Column({ type: 'varchar', length: 20 })
	type!: RunLogType

	@Column({ type: 'text' })
	message!: string

	@Column({ type: 'jsonb', nullable: true })
	data?: Record<string, unknown> | null

	@CreateDateColumn({ type: 'timestamptz' })
	timestamp!: Date
} 