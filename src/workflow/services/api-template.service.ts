import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ApiTemplate, ApiProvider, ApiTemplateCategory } from '../entities/api-template.entity'

@Injectable()
export class ApiTemplateService implements OnApplicationBootstrap {
	private readonly logger = new Logger(ApiTemplateService.name)

	constructor(
		@InjectRepository(ApiTemplate) private readonly templateRepo: Repository<ApiTemplate>,
	) {}

	async onApplicationBootstrap() {
		await this.seedDefaultTemplates()
	}

	async findAll(): Promise<ApiTemplate[]> {
		return this.templateRepo.find({
			where: { isActive: true },
			order: { provider: 'ASC', category: 'ASC', name: 'ASC' }
		})
	}

	async findByProvider(provider: ApiProvider): Promise<ApiTemplate[]> {
		return this.templateRepo.find({
			where: { provider, isActive: true },
			order: { category: 'ASC', name: 'ASC' }
		})
	}

	async findByCategory(category: ApiTemplateCategory): Promise<ApiTemplate[]> {
		return this.templateRepo.find({
			where: { category, isActive: true },
			order: { provider: 'ASC', name: 'ASC' }
		})
	}

	async findById(id: string): Promise<ApiTemplate | null> {
		return this.templateRepo.findOne({ where: { id } })
	}

	async create(template: Partial<ApiTemplate>): Promise<ApiTemplate> {
		const newTemplate = this.templateRepo.create({
			...template,
			isCustom: true,
		})
		return this.templateRepo.save(newTemplate)
	}

	async update(id: string, updates: Partial<ApiTemplate>): Promise<ApiTemplate> {
		await this.templateRepo.update(id, updates)
		const updated = await this.templateRepo.findOne({ where: { id } })
		if (!updated) throw new Error('Template not found')
		return updated
	}

	async delete(id: string): Promise<void> {
		await this.templateRepo.update(id, { isActive: false })
	}

	async getGroupedTemplates() {
		const templates = await this.findAll()
		const grouped: Record<ApiProvider, Record<ApiTemplateCategory, ApiTemplate[]>> = {} as any

		templates.forEach(template => {
			if (!grouped[template.provider]) {
				grouped[template.provider] = {} as any
			}
			if (!grouped[template.provider][template.category]) {
				grouped[template.provider][template.category] = []
			}
			grouped[template.provider][template.category].push(template)
		})

		return grouped
	}

	private async seedDefaultTemplates() {
		const count = await this.templateRepo.count()
		if (count > 0) {
			this.logger.log('API templates already seeded')
			return
		}

		this.logger.log('Seeding default API templates...')

		const templates: Partial<ApiTemplate>[] = [
			// Apollo.io Templates
			{
				name: 'Person Enrichment',
				description: 'Enrich person data with email, phone, company info',
				provider: 'apollo',
				category: 'enrichment',
				method: 'POST',
				url: `http://${process.env.API_HOST || 'localhost'}:${process.env.API_PORT || '3000'}/workflows/api/mock/apollo/person-enrichment`,
				headers: [
					{ id: '1', key: 'Content-Type', value: 'application/json', enabled: true },
					{ id: '2', key: 'X-Apollo-API-Key', value: '{{apolloApiKey}}', enabled: true, description: 'Apollo API Key' }
				],
				bodyTemplate: '{"first_name": "{{firstName}}", "last_name": "{{lastName}}", "organization_name": "{{company}}"}',
				sampleResponse: {
					person: {
						id: "12345",
						first_name: "John",
						last_name: "Doe",
						email: "john.doe@company.com",
						phone: "+1-555-123-4567",
						title: "VP of Sales",
						organization: {
							name: "Acme Corp",
							domain: "acme.com",
							industry: "Technology"
						}
					}
				},
				tags: ['lead-enrichment', 'contact-data'],
				documentation: 'Enriches person data using Apollo.io database'
			},
			{
				name: 'Company Search',
				description: 'Search for companies by industry, size, location',
				provider: 'apollo',
				category: 'enrichment',
				method: 'GET',
				url: 'http://api-dev:3000/workflows/api/mock/apollo/company-search?industry={{industry}}&size={{companySize}}&location={{location}}',
				headers: [
					{ id: '1', key: 'X-Apollo-API-Key', value: '{{apolloApiKey}}', enabled: true }
				],
				sampleResponse: {
					companies: [
						{
							id: "67890",
							name: "TechCorp Inc",
							domain: "techcorp.com",
							industry: "Software",
							employee_count: 500,
							headquarters: "San Francisco, CA"
						}
					]
				},
				tags: ['company-research', 'prospecting']
			},

			// ZoomInfo Templates
			{
				name: 'Contact Enrichment',
				description: 'Enrich contact with ZoomInfo database',
				provider: 'zoominfo',
				category: 'enrichment',
				method: 'POST',
				url: 'http://api-dev:3000/workflows/api/mock/zoominfo/contact-enrichment',
				headers: [
					{ id: '1', key: 'Content-Type', value: 'application/json', enabled: true },
					{ id: '2', key: 'Authorization', value: 'Bearer {{zoomInfoToken}}', enabled: true }
				],
				bodyTemplate: '{"email": "{{email}}", "firstName": "{{firstName}}", "lastName": "{{lastName}}"}',
				sampleResponse: {
					contact: {
						email: "contact@example.com",
						phone: "555-0123",
						title: "Marketing Director",
						company: "Example Corp",
						linkedin: "https://linkedin.com/in/contact"
					}
				},
				tags: ['contact-enrichment', 'sales-intelligence']
			},

			// HubSpot Templates
			{
				name: 'Create Contact',
				description: 'Create a new contact in HubSpot CRM',
				provider: 'hubspot',
				category: 'crm',
				method: 'POST',
				url: 'http://api-dev:3000/workflows/api/mock/hubspot/contacts',
				headers: [
					{ id: '1', key: 'Content-Type', value: 'application/json', enabled: true },
					{ id: '2', key: 'Authorization', value: 'Bearer {{hubspotToken}}', enabled: true }
				],
				bodyTemplate: '{"properties": {"email": "{{email}}", "firstname": "{{firstName}}", "lastname": "{{lastName}}", "company": "{{company}}"}}',
				sampleResponse: {
					id: "12345",
					properties: {
						email: "new.contact@example.com",
						firstname: "New",
						lastname: "Contact",
						createdate: "2024-01-15T10:30:00.000Z"
					}
				},
				tags: ['crm', 'contact-management']
			},
			{
				name: 'Update Contact Score',
				description: 'Update lead score in HubSpot',
				provider: 'hubspot',
				category: 'lead-scoring',
				method: 'PATCH',
				url: 'http://api-dev:3000/workflows/api/mock/hubspot/contacts/{{contactId}}',
				headers: [
					{ id: '1', key: 'Content-Type', value: 'application/json', enabled: true },
					{ id: '2', key: 'Authorization', value: 'Bearer {{hubspotToken}}', enabled: true }
				],
				bodyTemplate: '{"properties": {"hs_lead_score": "{{leadScore}}", "lead_status": "{{status}}"}}',
				sampleResponse: {
					id: "12345",
					properties: {
						hs_lead_score: "85",
						lead_status: "qualified"
					}
				},
				tags: ['lead-scoring', 'crm-automation']
			},

			// Email Automation Templates
			{
				name: 'Send Email Campaign',
				description: 'Trigger email sequence in Lemlist',
				provider: 'lemlist',
				category: 'email',
				method: 'POST',
				url: 'http://api-dev:3000/workflows/api/mock/lemlist/campaigns/{{campaignId}}/leads',
				headers: [
					{ id: '1', key: 'Content-Type', value: 'application/json', enabled: true },
					{ id: '2', key: 'Authorization', value: 'Bearer {{lemlistApiKey}}', enabled: true }
				],
				bodyTemplate: '{"email": "{{email}}", "firstName": "{{firstName}}", "lastName": "{{lastName}}", "companyName": "{{company}}"}',
				sampleResponse: {
					leadId: "lead_12345",
					campaignId: "camp_67890",
					status: "added",
					scheduledAt: "2024-01-16T09:00:00.000Z"
				},
				tags: ['email-automation', 'outreach']
			},

			// Clearbit Templates
			{
				name: 'Company Enrichment',
				description: 'Enrich company data with Clearbit',
				provider: 'clearbit',
				category: 'enrichment',
				method: 'GET',
				url: 'http://api-dev:3000/workflows/api/mock/clearbit/companies/{{domain}}',
				headers: [
					{ id: '1', key: 'Authorization', value: 'Bearer {{clearbitApiKey}}', enabled: true }
				],
				sampleResponse: {
					company: {
						domain: "example.com",
						name: "Example Corp",
						category: {
							sector: "Technology",
							industry: "Software"
						},
						metrics: {
							employees: 250,
							annualRevenue: 50000000
						},
						location: "San Francisco, CA"
					}
				},
				tags: ['company-enrichment', 'firmographics']
			},

			// JSONPlaceholder (Real API for testing)
			{
				name: 'Get User Data',
				description: 'Fetch user data from JSONPlaceholder',
				provider: 'jsonplaceholder',
				category: 'data',
				method: 'GET',
				url: 'https://jsonplaceholder.typicode.com/users/{{userId}}',
				headers: [],
				sampleResponse: {
					id: 1,
					name: "Leanne Graham",
					username: "Bret",
					email: "Sincere@april.biz",
					address: {
						street: "Kulas Light",
						suite: "Apt. 556",
						city: "Gwenborough",
						zipcode: "92998-3874"
					},
					phone: "1-770-736-8031 x56442",
					website: "hildegard.org",
					company: {
						name: "Romaguera-Crona",
						catchPhrase: "Multi-layered client-server neural-net"
					}
				},
				tags: ['test-data', 'demo']
			},
			{
				name: 'Create Post',
				description: 'Create a new post (demo)',
				provider: 'jsonplaceholder',
				category: 'data',
				method: 'POST',
				url: 'https://jsonplaceholder.typicode.com/posts',
				headers: [
					{ id: '1', key: 'Content-Type', value: 'application/json', enabled: true }
				],
				bodyTemplate: '{"title": "{{title}}", "body": "{{content}}", "userId": {{userId}}}',
				sampleResponse: {
					id: 101,
					title: "New Post Title",
					body: "Post content here",
					userId: 1
				},
				tags: ['demo', 'testing']
			}
		]

		for (const template of templates) {
			await this.templateRepo.save(this.templateRepo.create(template))
		}

		this.logger.log(`Seeded ${templates.length} API templates`)
	}
} 