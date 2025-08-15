import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

export type ApiTemplateCategory = 'enrichment' | 'email' | 'lead-scoring' | 'crm' | 'notification' | 'data' | 'custom'

export type ApiProvider = 'apollo' | 'zoominfo' | 'hubspot' | 'salesforce' | 'clearbit' | 'lemlist' | 'outreach' | 'custom' | 'jsonplaceholder' | 'mock'

export interface ApiHeader {
	id: string
	key: string
	value: string
	enabled: boolean
	description?: string
}

export interface ApiParameter {
	id: string
	key: string
	value: string
	description?: string
	required?: boolean
}

@Entity({ name: 'api_templates' })
export class ApiTemplate {
	@PrimaryGeneratedColumn('uuid')
	id!: string

	@Column({ type: 'varchar', length: 200 })
	name!: string

	@Column({ type: 'text', nullable: true })
	description?: string

	@Index()
	@Column({ type: 'varchar', length: 50 })
	provider!: ApiProvider

	@Index()
	@Column({ type: 'varchar', length: 50 })
	category!: ApiTemplateCategory

	@Column({ type: 'varchar', length: 10 })
	method!: HttpMethod

	@Column({ type: 'text' })
	url!: string

	@Column({ type: 'jsonb', default: [] })
	headers!: ApiHeader[]

	@Column({ type: 'text', nullable: true })
	bodyTemplate?: string

	@Column({ type: 'jsonb', default: [] })
	parameters!: ApiParameter[]

	@Column({ type: 'int', default: 10000 })
	timeoutMs!: number

	@Column({ type: 'jsonb', default: [200, 201, 202, 204] })
	expectedStatusCodes!: number[]

	@Column({ type: 'jsonb', nullable: true })
	sampleResponse?: any

	@Column({ type: 'text', nullable: true })
	documentation?: string

	@Column({ type: 'jsonb', default: [] })
	tags!: string[]

	@Column({ type: 'boolean', default: true })
	isActive!: boolean

	@Column({ type: 'boolean', default: false })
	isCustom!: boolean

	@CreateDateColumn({ type: 'timestamptz' })
	createdAt!: Date

	@UpdateDateColumn({ type: 'timestamptz' })
	updatedAt!: Date
} 