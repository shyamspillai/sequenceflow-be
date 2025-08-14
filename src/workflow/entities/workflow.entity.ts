import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { WorkflowNode } from './node.entity'
import { WorkflowEdge } from './edge.entity'

@Entity({ name: 'workflows' })
export class Workflow {
	@PrimaryGeneratedColumn('uuid')
	id!: string

	@Column({ type: 'varchar', length: 255 })
	name!: string

	@OneToMany(() => WorkflowNode, node => node.workflow, { cascade: ['insert', 'update'], eager: true, orphanedRowAction: 'delete' })
	nodes!: WorkflowNode[]

	@OneToMany(() => WorkflowEdge, edge => edge.workflow, { cascade: ['insert', 'update'], eager: true, orphanedRowAction: 'delete' })
	edges!: WorkflowEdge[]

	@CreateDateColumn({ type: 'timestamptz' })
	createdAt!: Date

	@UpdateDateColumn({ type: 'timestamptz' })
	updatedAt!: Date
} 