import { Column, CreateDateColumn, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Workflow } from './workflow.entity'
import { WorkflowRunLog } from './runLog.entity'

export type RunStatus = 'queued' | 'running' | 'succeeded' | 'failed'

@Entity({ name: 'workflow_runs' })
export class WorkflowRun {
	@PrimaryGeneratedColumn('uuid')
	id!: string

	@Index()
	@ManyToOne(() => Workflow, workflow => workflow.id, { onDelete: 'CASCADE' })
	workflow!: Workflow

	@Column({ type: 'varchar', length: 20, default: 'queued' })
	status!: RunStatus

	@Column({ type: 'jsonb', nullable: true })
	input?: Record<string, unknown> | null

	@Column({ type: 'jsonb', nullable: true })
	result?: Record<string, unknown> | null

	@CreateDateColumn({ type: 'timestamptz' })
	startedAt!: Date

	@UpdateDateColumn({ type: 'timestamptz' })
	updatedAt!: Date

	@Column({ type: 'timestamptz', nullable: true })
	finishedAt?: Date | null

	@OneToMany(() => WorkflowRunLog, (log: WorkflowRunLog) => log.run, { cascade: ['insert', 'update'], eager: false })
	logs!: WorkflowRunLog[]
} 