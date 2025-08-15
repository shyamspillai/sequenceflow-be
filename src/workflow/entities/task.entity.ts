import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { WorkflowRun } from './run.entity'

export type TaskStatus = 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'skipped'

@Entity({ name: 'workflow_tasks' })
export class WorkflowTask {
	@PrimaryGeneratedColumn('uuid')
	id!: string

	@Index()
	@ManyToOne(() => WorkflowRun, run => run.tasks, { onDelete: 'CASCADE' })
	run!: WorkflowRun

	// The node ID from the workflow definition
	@Column({ type: 'varchar' })
	nodeId!: string

	// The node type (inputText, decision, apiCall, etc.)
	@Column({ type: 'varchar' })
	nodeType!: string

	// Current execution status
	@Column({ type: 'varchar', length: 20, default: 'pending' })
	status!: TaskStatus

	// Input payload for this task
	@Column({ type: 'jsonb', nullable: true })
	input?: Record<string, unknown> | null

	// Output payload from this task
	@Column({ type: 'jsonb', nullable: true })
	output?: Record<string, unknown> | null

	// Error details if failed
	@Column({ type: 'text', nullable: true })
	error?: string | null

	// BullMQ job ID for tracking
	@Column({ type: 'varchar', nullable: true })
	jobId?: string | null

	// Dependencies - node IDs that must complete before this task can run
	@Column({ type: 'jsonb', default: [] })
	dependencies!: string[]

	// Allowed source handles (for decision nodes)
	@Column({ type: 'jsonb', nullable: true })
	allowedSourceHandles?: string[] | null

	@CreateDateColumn({ type: 'timestamptz' })
	createdAt!: Date

	@UpdateDateColumn({ type: 'timestamptz' })
	updatedAt!: Date

	@Column({ type: 'timestamptz', nullable: true })
	startedAt?: Date | null

	@Column({ type: 'timestamptz', nullable: true })
	completedAt?: Date | null
} 