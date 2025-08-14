import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Workflow } from './workflow.entity'

export type JSONSchema = Record<string, unknown>

export type BaseNode = {
	id: string
	type: string
	name: string
	inputSchema: JSONSchema
	outputSchema: JSONSchema
	config: Record<string, unknown>
	validationLogic?: Record<string, unknown>
	connections: string[]
}

@Entity({ name: 'workflow_nodes' })
export class WorkflowNode {
	@PrimaryGeneratedColumn('uuid')
	id!: string

	@Index()
	@ManyToOne(() => Workflow, workflow => workflow.nodes, { onDelete: 'CASCADE' })
	workflow!: Workflow

	// frontend persisted node id
	@Column({ type: 'varchar', length: 255 })
	persistedId!: string

	@Column({ type: 'varchar', length: 255 })
	name!: string

	@Column({ type: 'varchar', length: 64 })
	type!: string

	@Column({ type: 'jsonb', default: {} })
	inputSchema!: JSONSchema

	@Column({ type: 'jsonb', default: {} })
	outputSchema!: JSONSchema

	@Column({ type: 'jsonb', default: {} })
	config!: Record<string, unknown>

	@Column({ type: 'jsonb', nullable: true })
	validationLogic?: Record<string, unknown> | null

	@Column({ type: 'jsonb', default: [] })
	connections!: string[]

	// base.id from the frontend
	@Column({ type: 'varchar' })
	baseId!: string

	@Column({ type: 'double precision' })
	x!: number

	@Column({ type: 'double precision' })
	y!: number
} 