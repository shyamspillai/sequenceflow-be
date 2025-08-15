import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { randomUUID } from 'crypto'
import { Workflow } from '../entities/workflow.entity'
import { WorkflowNode } from '../entities/node.entity'
import { WorkflowEdge } from '../entities/edge.entity'

@Injectable()
export class WorkflowSeedService implements OnApplicationBootstrap {
	private readonly logger = new Logger(WorkflowSeedService.name)

	constructor(
		@InjectRepository(Workflow)
		private readonly workflowRepo: Repository<Workflow>,
	) {}

	async onApplicationBootstrap() {
		await this.seedSampleWorkflows()
	}

	private async seedSampleWorkflows() {
		try {
			// Check if workflows already exist
			const existingCount = await this.workflowRepo.count()
			if (existingCount > 0) {
				this.logger.log(`Found ${existingCount} existing workflows, skipping seed`)
				return
			}

			this.logger.log('🌱 Seeding sample workflows...')

			// Create simple, practical workflows (3-4 nodes max)
			await this.createSimpleWeatherAlert()
			await this.createPersonEnrichmentFlow()
			await this.createSimpleNotificationFlow()
			await this.createConditionalApiFlow()
			await this.createLinkedInLeadQualificationFlow()
			await this.createSmartBuildingCoolingFlow()

			this.logger.log('✅ Sample workflows seeded successfully!')
		} catch (error) {
			this.logger.error('❌ Failed to seed workflows:', error)
		}
	}

	private async createSimpleWeatherAlert() {
		const workflow = new Workflow()
		workflow.name = '🌤️ Simple Weather Alert'

		// Nodes (3 nodes total)
		const nodes: Partial<WorkflowNode>[] = [
			{
				persistedId: 'input-city',
				baseId: 'input-city',
				name: 'City Input',
				type: 'inputText',
				x: 100,
				y: 100,
				config: {
					fields: [
						{ 
							id: randomUUID(), 
							key: 'city', 
							label: 'City Name', 
							inputKind: 'text',
							placeholder: 'e.g. London, New York, Dubai',
							defaultValue: '',
							validationLogic: null,
							validationConfig: null
						},
						{ 
							id: randomUUID(), 
							key: 'user_email', 
							label: 'Your Email', 
							inputKind: 'text',
							placeholder: 'your@email.com',
							defaultValue: '',
							validationLogic: null,
							validationConfig: null
						}
					]
				},
				inputSchema: {},
				outputSchema: {
					type: 'object',
					properties: {
						city: { type: 'string' },
						user_email: { type: 'string' }
					}
				},
				connections: ['weather-api']
			},
			{
				persistedId: 'weather-api',
				baseId: 'weather-api',
				name: 'Get Weather',
				type: 'apiCall',
				x: 350,
				y: 100,
				config: {
					method: 'GET',
					url: 'http://localhost:3000/workflows/api/test-weather?city={{city}}',
					headers: [],
					expectedStatusCodes: [200],
					timeoutMs: 5000
				},
				inputSchema: {},
				outputSchema: {
					type: 'object',
					properties: {
						status: { type: 'number' },
						statusText: { type: 'string' },
						data: { 
							type: 'object',
							properties: {
								city: { type: 'string' },
								temperature: { type: 'number' },
								condition: { type: 'string' },
								humidity: { type: 'number' },
								timestamp: { type: 'string' }
							}
						},
						headers: { type: 'object' },
						success: { type: 'boolean' },
						error: { type: 'string' }
					}
				},
				connections: ['weather-notification']
			},
			{
				persistedId: 'weather-notification',
				baseId: 'weather-notification',
				name: 'Weather Report',
				type: 'notification',
				x: 600,
				y: 100,
				config: {
					template: '🌤️ Weather Report for {{data.city}}\n\n🌡️ Temperature: {{data.temperature}}°C\n💧 Humidity: {{data.humidity}}%\n☁️ Condition: {{data.condition}}\n\nHave a great day!'
				},
				inputSchema: {},
				outputSchema: {},
				connections: []
			}
		]

		const edges = [
			{ sourceId: 'input-city', targetId: 'weather-api', sourceHandleId: null, targetHandleId: null },
			{ sourceId: 'weather-api', targetId: 'weather-notification', sourceHandleId: null, targetHandleId: null }
		]

		await this.saveWorkflow(workflow, nodes, edges)
	}

	private async createPersonEnrichmentFlow() {
		const workflow = new Workflow()
		workflow.name = '👤 Person Enrichment'

		// Nodes (3 nodes total) 
		const nodes: Partial<WorkflowNode>[] = [
			{
				persistedId: 'input-person',
				baseId: 'input-person',
				name: 'Person Details',
				type: 'inputText',
				x: 100,
				y: 100,
				config: {
					fields: [
						{ 
							id: randomUUID(), 
							key: 'firstName', 
							label: 'First Name', 
							inputKind: 'text',
							placeholder: 'e.g. John',
							defaultValue: '',
							validationLogic: null,
							validationConfig: null
						},
						{ 
							id: randomUUID(), 
							key: 'lastName', 
							label: 'Last Name', 
							inputKind: 'text',
							placeholder: 'e.g. Doe',
							defaultValue: '',
							validationLogic: null,
							validationConfig: null
						},
						{ 
							id: randomUUID(), 
							key: 'company', 
							label: 'Company', 
							inputKind: 'text',
							placeholder: 'e.g. Acme Corp',
							defaultValue: '',
							validationLogic: null,
							validationConfig: null
						}
					]
				},
				inputSchema: {},
				outputSchema: {
					type: 'object',
					properties: {
						firstName: { type: 'string' },
						lastName: { type: 'string' },
						company: { type: 'string' }
					}
				},
				connections: ['enrichment-api']
			},
			{
				persistedId: 'enrichment-api',
				baseId: 'enrichment-api',
				name: 'Enrich Person Data',
				type: 'apiCall',
				x: 350,
				y: 100,
				config: {
					method: 'POST',
					url: 'http://localhost:3000/workflows/api/mock/apollo/person-enrichment',
					headers: [
						{ key: 'Content-Type', value: 'application/json', enabled: true }
					],
					bodyTemplate: '{"first_name": "{{firstName}}", "last_name": "{{lastName}}", "organization_name": "{{company}}"}',
					expectedStatusCodes: [200],
					timeoutMs: 5000
				},
				inputSchema: {},
				outputSchema: {
					type: 'object',
					properties: {
						status: { type: 'number' },
						statusText: { type: 'string' },
						data: { 
							type: 'object',
							properties: {
								person: {
									type: 'object',
									properties: {
										email: { type: 'string' },
										phone: { type: 'string' },
										organization: {
											type: 'object',
											properties: {
												name: { type: 'string' },
												industry: { type: 'string' }
											}
										}
									}
								},
								enrichment_score: { type: 'number' }
							}
						},
						headers: { type: 'object' },
						success: { type: 'boolean' },
						error: { type: 'string' }
					}
				},
				connections: ['enrichment-result']
			},
			{
				persistedId: 'enrichment-result',
				baseId: 'enrichment-result',
				name: 'Enrichment Summary',
				type: 'notification',
				x: 600,
				y: 100,
				config: {
					template: '👤 Person Enrichment Complete\n\n✅ Found: {{data.person.first_name}} {{data.person.last_name}}\n📧 Email: {{data.person.email}}\n📱 Phone: {{data.person.phone}}\n💼 Title: {{data.person.title}}\n🏢 Company: {{data.person.organization.name}}\n🌐 Domain: {{data.person.organization.domain}}\n📊 Score: {{data.enrichment_score}}%'
				},
				inputSchema: {},
				outputSchema: {},
				connections: []
			}
		]

		const edges = [
			{ sourceId: 'input-person', targetId: 'enrichment-api', sourceHandleId: null, targetHandleId: null },
			{ sourceId: 'enrichment-api', targetId: 'enrichment-result', sourceHandleId: null, targetHandleId: null }
		]

		await this.saveWorkflow(workflow, nodes, edges)
	}

	private async createSimpleNotificationFlow() {
		const workflow = new Workflow()
		workflow.name = '📧 Simple Notification'

		// Nodes (3 nodes total with delay)
		const nodes: Partial<WorkflowNode>[] = [
			{
				persistedId: 'input-message',
				baseId: 'input-message',
				name: 'Message Input',
				type: 'inputText',
				x: 100,
				y: 100,
				config: {
					fields: [
						{ 
							id: randomUUID(), 
							key: 'recipient', 
							label: 'Recipient Name', 
							inputKind: 'text',
							placeholder: 'e.g. John Smith',
							defaultValue: '',
							validationLogic: null,
							validationConfig: null
						},
						{ 
							id: randomUUID(), 
							key: 'message', 
							label: 'Message', 
							inputKind: 'text',
							placeholder: 'Enter your message here...',
							defaultValue: '',
							validationLogic: null,
							validationConfig: null
						},
						{ 
							id: randomUUID(), 
							key: 'priority', 
							label: 'Priority', 
							inputKind: 'text',
							placeholder: 'high, medium, low',
							defaultValue: 'medium',
							validationLogic: null,
							validationConfig: null
						}
					]
				},
				inputSchema: {},
				outputSchema: {
					type: 'object',
					properties: {
						recipient: { type: 'string' },
						message: { type: 'string' },
						priority: { type: 'string' }
					}
				},
				connections: ['delay-node']
			},
			{
				persistedId: 'delay-node',
				baseId: 'delay-node',
				name: 'Processing Delay',
				type: 'delay',
				x: 350,
				y: 100,
				config: {
					delayType: 'seconds',
					delayValue: 5
				},
				inputSchema: {},
				outputSchema: {},
				connections: ['send-notification']
			},
			{
				persistedId: 'send-notification',
				baseId: 'send-notification',
				name: 'Send Message',
				type: 'notification',
				x: 600,
				y: 100,
				config: {
					template: '📧 Message for {{recipient}}\n\n🔹 Priority: {{priority}}\n📝 Message:\n{{message}}\n\n✅ Delivered successfully!'
				},
				inputSchema: {},
				outputSchema: {},
				connections: []
			}
		]

		const edges = [
			{ sourceId: 'input-message', targetId: 'delay-node', sourceHandleId: null, targetHandleId: null },
			{ sourceId: 'delay-node', targetId: 'send-notification', sourceHandleId: null, targetHandleId: null }
		]

		await this.saveWorkflow(workflow, nodes, edges)
	}

	private async createConditionalApiFlow() {
		const workflow = new Workflow()
		workflow.name = '🔀 Temperature Alert System'

		// Nodes (4 nodes total with ifElse)
		const nodes: Partial<WorkflowNode>[] = [
			{
				persistedId: 'input-location',
				baseId: 'input-location',
				name: 'Location Input',
				type: 'inputText',
				x: 100,
				y: 100,
				config: {
					fields: [
						{ 
							id: randomUUID(), 
							key: 'city', 
							label: 'City', 
							inputKind: 'text',
							placeholder: 'e.g. London, Dubai, Tokyo',
							defaultValue: '',
							validationLogic: null,
							validationConfig: null
						},
						{ 
							id: randomUUID(), 
							key: 'threshold', 
							label: 'Hot Temperature Alert (°C)', 
							inputKind: 'number',
							placeholder: '25',
							defaultValue: 25,
							validationLogic: null,
							validationConfig: null
						}
					]
				},
				inputSchema: {},
				outputSchema: {
					type: 'object',
					properties: {
						city: { type: 'string' },
						threshold: { type: 'number' }
					}
				},
				connections: ['weather-check']
			},
			{
				persistedId: 'weather-check',
				baseId: 'weather-check',
				name: 'Get Current Weather',
				type: 'apiCall',
				x: 300,
				y: 100,
				config: {
					method: 'GET',
					url: 'http://localhost:3000/workflows/api/test-weather?city={{city}}',
					headers: [],
					expectedStatusCodes: [200],
					timeoutMs: 5000
				},
				inputSchema: {},
				outputSchema: {
					type: 'object',
					properties: {
						status: { type: 'number' },
						statusText: { type: 'string' },
						data: { 
							type: 'object',
							properties: {
								city: { type: 'string' },
								temperature: { type: 'number' },
								condition: { type: 'string' },
								humidity: { type: 'number' },
								timestamp: { type: 'string' }
							}
						},
						headers: { type: 'object' },
						success: { type: 'boolean' },
						error: { type: 'string' }
					}
				},
				connections: ['temperature-decision']
			},
			{
				persistedId: 'temperature-decision',
				baseId: 'temperature-decision',
				name: 'Hot Weather Check',
				type: 'ifElse',
				x: 500,
				y: 100,
				config: {
					condition: {
						id: 'hot-check',
						name: 'Temperature Check',
						predicates: [{
							id: 'pred-1',
							targetField: 'data.temperature',
							validationLogic: { '>': [{ var: 'value' }, 25] },
							validationConfig: {
								kind: 'number',
								combiner: 'all',
								rules: [{
									type: 'gt',
									value: 25
								}]
							}
						}],
						combiner: 'all'
					},
					trueLabel: 'Hot Weather',
					falseLabel: 'Normal Weather'
				},
				inputSchema: {},
				outputSchema: {},
				connections: ['hot-alert', 'normal-alert']
			},
			{
				persistedId: 'hot-alert',
				baseId: 'hot-alert',
				name: 'Hot Weather Alert',
				type: 'notification',
				x: 400,
				y: 250,
				config: {
					template: '🔥 HOT WEATHER ALERT for {{data.city}}!\n\n🌡️ Current: {{data.temperature}}°C\n⚠️ This is above your threshold of {{threshold}}°C\n💧 Humidity: {{data.humidity}}%\n☁️ Condition: {{data.condition}}\n\nStay cool and hydrated!'
				},
				inputSchema: {},
				outputSchema: {},
				connections: []
			},
			{
				persistedId: 'normal-alert',
				baseId: 'normal-alert',
				name: 'Normal Weather Update',
				type: 'notification',
				x: 600,
				y: 250,
				config: {
					template: '✅ Normal weather in {{data.city}}\n\n🌡️ Temperature: {{data.temperature}}°C (threshold: {{threshold}}°C)\n☁️ Condition: {{data.condition}}\n💧 Humidity: {{data.humidity}}%\n\nEnjoy your day!'
				},
				inputSchema: {},
				outputSchema: {},
				connections: []
			}
		]

		const edges = [
			{ sourceId: 'input-location', targetId: 'weather-check', sourceHandleId: null, targetHandleId: null },
			{ sourceId: 'weather-check', targetId: 'temperature-decision', sourceHandleId: null, targetHandleId: null },
			{ sourceId: 'temperature-decision', targetId: 'hot-alert', sourceHandleId: 'out-true', targetHandleId: null },
			{ sourceId: 'temperature-decision', targetId: 'normal-alert', sourceHandleId: 'out-false', targetHandleId: null }
		]

		await this.saveWorkflow(workflow, nodes, edges)
	}

	private async saveWorkflow(workflow: Workflow, nodes: Partial<WorkflowNode>[], edges: { sourceId: string; targetId: string; sourceHandleId: string | null; targetHandleId: string | null }[]) {
		// Create and save nodes
		workflow.nodes = nodes.map(nodeData => {
			const node = new WorkflowNode()
			Object.assign(node, nodeData)
			node.workflow = workflow
			return node
		})

		// Create and save edges
		workflow.edges = edges.map(edgeData => {
			const edge = new WorkflowEdge()
			edge.workflow = workflow
			edge.sourceId = edgeData.sourceId
			edge.targetId = edgeData.targetId
			edge.sourceHandleId = edgeData.sourceHandleId
			edge.targetHandleId = edgeData.targetHandleId
			return edge
		})

		await this.workflowRepo.save(workflow)
		this.logger.log(`✅ Created workflow: "${workflow.name}"`)
	}

	// LinkedIn Lead Qualification Workflow
	private async createLinkedInLeadQualificationFlow() {
		const workflow = new Workflow()
		workflow.name = '🎯 LinkedIn Lead Qualification'

		// Nodes (4 nodes total - simplified)
		const nodes: Partial<WorkflowNode>[] = [
			{
				persistedId: 'lead-input',
				baseId: 'lead-input',
				name: 'Lead Information',
				type: 'inputText',
				x: 100,
				y: 100,
				config: {
					fields: [
						{
							id: randomUUID(),
							key: 'lead_source',
							label: 'Lead Source',
							inputKind: 'text',
							defaultValue: 'LinkedIn'
						},
						{
							id: randomUUID(),
							key: 'company',
							label: 'Company',
							inputKind: 'text',
							defaultValue: 'TechCorp Inc'
						},
						{
							id: randomUUID(),
							key: 'title',
							label: 'Job Title',
							inputKind: 'text',
							defaultValue: 'CEO'
						},
						{
							id: randomUUID(),
							key: 'email',
							label: 'Email',
							inputKind: 'text',
							defaultValue: 'ceo@techcorp.com'
						}
					]
				},
				inputSchema: {},
				outputSchema: {
					type: 'object',
					properties: {
						lead_source: { type: 'string' },
						company: { type: 'string' },
						title: { type: 'string' },
						email: { type: 'string' }
					}
				},
				connections: ['lead-scoring']
			},
			{
				persistedId: 'lead-scoring',
				baseId: 'lead-scoring',
				name: 'Analyze Lead Score',
				type: 'apiCall',
				x: 300,
				y: 100,
				config: {
					url: 'http://localhost:3000/workflows/api/mock/lead-scoring/analyze',
					method: 'POST',
					bodyTemplate: '{"lead_source": "{{lead_source}}", "company": "{{company}}", "title": "{{title}}", "email": "{{email}}"}',
					headers: [
						{ key: 'Content-Type', value: 'application/json', enabled: true }
					]
				},
				inputSchema: {},
				outputSchema: {
					type: 'object',
					properties: {
						status: { type: 'number' },
						statusText: { type: 'string' },
						data: {
							type: 'object',
							properties: {
								lead_id: { type: 'string' },
								lead_source: { type: 'string' },
								company: { type: 'string' },
								title: { type: 'string' },
								email: { type: 'string' },
								score: { type: 'number' },
								qualification: { type: 'string' }
							}
						},
						headers: { type: 'object' },
						success: { type: 'boolean' },
						error: { type: 'string' }
					}
				},
				connections: ['score-decision']
			},
			{
				persistedId: 'score-decision',
				baseId: 'score-decision',
				name: 'High Score Check',
				type: 'ifElse',
				x: 500,
				y: 100,
				config: {
					condition: {
						id: 'high-score-check',
						name: 'High Score and LinkedIn Source',
						predicates: [{
							id: 'pred-1',
							targetField: 'data.score',
							validationLogic: { '>': [{ var: 'value' }, 75] },
							validationConfig: {
								kind: 'number',
								combiner: 'all',
								rules: [{
									type: 'gt',
									value: 75
								}]
							}
						}],
						combiner: 'all'
					},
					trueLabel: 'High Value',
					falseLabel: 'Low Value'
				},
				inputSchema: {},
				outputSchema: {},
				connections: ['qualified-notification', 'unqualified-notification']
			},
			{
				persistedId: 'qualified-notification',
				baseId: 'qualified-notification',
				name: 'Qualified Lead Alert',
				type: 'notification',
				x: 350,
				y: 250,
				config: {
					template: '🎯 HIGH VALUE LEAD DETECTED!\n\n🏢 Company: {{data.company}}\n👤 Contact: {{data.title}}\n📧 Email: {{email}}\n📊 Score: {{data.score}}/100\n📍 Source: {{data.lead_source}}\n\n✅ Action: Notify sales team immediately!'
				},
				inputSchema: {},
				outputSchema: {},
				connections: []
			},
			{
				persistedId: 'unqualified-notification',
				baseId: 'unqualified-notification',
				name: 'Unqualified Lead',
				type: 'notification',
				x: 650,
				y: 250,
				config: {
					template: '📋 Lead Score Below Threshold\n\n🏢 Company: {{data.company}}\n👤 Contact: {{data.title}}\n📊 Score: {{data.score}}/100\n📍 Source: {{data.lead_source}}\n\n💡 Recommendation: Add to nurture campaign for future follow-up.'
				},
				inputSchema: {},
				outputSchema: {},
				connections: []
			}
		]

		// Create workflow nodes
		workflow.nodes = nodes.map((nodeData, index) => {
			const node = new WorkflowNode()
			Object.assign(node, nodeData)
			return node
		})

		// Create edges
		const edgeData = [
			{ sourceId: 'lead-input', targetId: 'lead-scoring', sourceHandle: 'out', targetHandle: 'in' },
			{ sourceId: 'lead-scoring', targetId: 'score-decision', sourceHandle: 'out', targetHandle: 'in' },
			{ sourceId: 'score-decision', targetId: 'qualified-notification', sourceHandle: 'out-true', targetHandle: 'in' },
			{ sourceId: 'score-decision', targetId: 'unqualified-notification', sourceHandle: 'out-false', targetHandle: 'in' }
		]

		workflow.edges = edgeData.map((edgeData, index) => {
			const edge = new WorkflowEdge()
			edge.sourceId = edgeData.sourceId
			edge.targetId = edgeData.targetId
			edge.sourceHandleId = edgeData.sourceHandle
			edge.targetHandleId = edgeData.targetHandle
			return edge
		})

		await this.workflowRepo.save(workflow)
		this.logger.log(`✅ Created workflow: "${workflow.name}"`)
	}

	// Smart Building Cooling System Workflow
	private async createSmartBuildingCoolingFlow() {
		const workflow = new Workflow()
		workflow.name = '🏢 Smart Building Cooling System'

		// Nodes (4 nodes total - simplified)
		const nodes: Partial<WorkflowNode>[] = [
			{
				persistedId: 'building-input',
				baseId: 'building-input',
				name: 'Building Configuration',
				type: 'inputText',
				x: 100,
				y: 100,
				config: {
					fields: [
						{
							id: randomUUID(),
							key: 'zone',
							label: 'Zone',
							inputKind: 'text',
							defaultValue: 'server_room'
						},
						{
							id: randomUUID(),
							key: 'temperature_threshold',
							label: 'Temperature Threshold (°C)',
							inputKind: 'number',
							defaultValue: '30'
						}
					]
				},
				inputSchema: {},
				outputSchema: {
					type: 'object',
					properties: {
						zone: { type: 'string' },
						temperature_threshold: { type: 'number' }
					}
				},
				connections: ['temperature-sensor']
			},
			{
				persistedId: 'temperature-sensor',
				baseId: 'temperature-sensor',
				name: 'Check Temperature',
				type: 'apiCall',
				x: 300,
				y: 100,
				config: {
					url: 'http://localhost:3000/workflows/api/mock/building/temperature?zone={{zone}}&floor=3',
					method: 'GET',
					headers: []
				},
				inputSchema: {},
				outputSchema: {
					type: 'object',
					properties: {
						status: { type: 'number' },
						statusText: { type: 'string' },
						data: {
							type: 'object',
							properties: {
								sensor_id: { type: 'string' },
								zone: { type: 'string' },
								floor: { type: 'string' },
								temperature: { type: 'number' },
								unit: { type: 'string' },
								humidity: { type: 'number' },
								air_quality: { type: 'string' }
							}
						},
						headers: { type: 'object' },
						success: { type: 'boolean' },
						error: { type: 'string' }
					}
				},
				connections: ['temperature-check']
			},
			{
				persistedId: 'temperature-check',
				baseId: 'temperature-check',
				name: 'Temperature Threshold Check',
				type: 'ifElse',
				x: 500,
				y: 100,
				config: {
					condition: {
						id: 'temp-threshold-check',
						name: 'Temperature Above Threshold',
						predicates: [{
							id: 'pred-1',
							targetField: 'data.temperature',
							validationLogic: { '>': [{ var: 'value' }, 30] },
							validationConfig: {
								kind: 'number',
								combiner: 'all',
								rules: [{
									type: 'gt',
									value: 30
								}]
							}
						}],
						combiner: 'all'
					},
					trueLabel: 'Too Hot',
					falseLabel: 'Normal'
				},
				inputSchema: {},
				outputSchema: {},
				connections: ['hot-alert', 'normal-notification']
			},
			{
				persistedId: 'hot-alert',
				baseId: 'hot-alert',
				name: 'Temperature Alert',
				type: 'notification',
				x: 350,
				y: 250,
				config: {
					template: '🚨 TEMPERATURE ALERT!\n\n🌡️ Current: {{data.temperature}}°C\n🎯 Threshold: {{temperature_threshold}}°C\n🏢 Zone: {{data.zone}}\n💧 Humidity: {{data.humidity}}%\n🌬️ Air Quality: {{data.air_quality}}\n\n⚠️ Action Required: Activate cooling system immediately!'
				},
				inputSchema: {},
				outputSchema: {},
				connections: []
			},
			{
				persistedId: 'normal-notification',
				baseId: 'normal-notification',
				name: 'Normal Temperature',
				type: 'notification',
				x: 650,
				y: 250,
				config: {
					template: '✅ Building Temperature Normal\n\n🌡️ Current: {{data.temperature}}°C\n🎯 Threshold: {{temperature_threshold}}°C\n🏢 Zone: {{data.zone}}\n💧 Humidity: {{data.humidity}}%\n🌬️ Air Quality: {{data.air_quality}}\n\nNo action required - all systems operating normally.'
				},
				inputSchema: {},
				outputSchema: {},
				connections: []
			}
		]

		// Create workflow nodes
		workflow.nodes = nodes.map((nodeData, index) => {
			const node = new WorkflowNode()
			Object.assign(node, nodeData)
			return node
		})

		// Create edges
		const edgeData = [
			{ sourceId: 'building-input', targetId: 'temperature-sensor', sourceHandle: 'out', targetHandle: 'in' },
			{ sourceId: 'temperature-sensor', targetId: 'temperature-check', sourceHandle: 'out', targetHandle: 'in' },
			{ sourceId: 'temperature-check', targetId: 'hot-alert', sourceHandle: 'out-true', targetHandle: 'in' },
			{ sourceId: 'temperature-check', targetId: 'normal-notification', sourceHandle: 'out-false', targetHandle: 'in' }
		]

		workflow.edges = edgeData.map((edgeData, index) => {
			const edge = new WorkflowEdge()
			edge.sourceId = edgeData.sourceId
			edge.targetId = edgeData.targetId
			edge.sourceHandleId = edgeData.sourceHandle
			edge.targetHandleId = edgeData.targetHandle
			return edge
		})

		await this.workflowRepo.save(workflow)
		this.logger.log(`✅ Created workflow: "${workflow.name}"`)
	}
}