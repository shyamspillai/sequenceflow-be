import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Workflow } from './workflow.entity'

@Entity({ name: 'workflow_edges' })
export class WorkflowEdge {
	@PrimaryGeneratedColumn('uuid')
	id!: string

	@Index()
	@ManyToOne(() => Workflow, workflow => workflow.edges, { onDelete: 'CASCADE' })
	workflow!: Workflow

	@Column({ type: 'varchar' })
	sourceId!: string

	@Column({ type: 'varchar' })
	targetId!: string

	@Column({ type: 'varchar', nullable: true })
	sourceHandleId?: string | null

	@Column({ type: 'varchar', nullable: true })
	targetHandleId?: string | null
} 