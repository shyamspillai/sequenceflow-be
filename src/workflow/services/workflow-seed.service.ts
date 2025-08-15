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
			await this.createAdvancedCoolingWorkflow()

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
						}
					]
				},
				inputSchema: {},
				outputSchema: {
					type: 'object',
					properties: {
						city: { type: 'string' }
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
					template: '🔥 HOT WEATHER ALERT for {{city}}!\n\n🌡️ Current: {{data.temperature}}°C\n⚠️ This is above the threshold of 25°C\n💧 Humidity: {{data.humidity}}%\n☁️ Condition: {{data.condition}}\n\nStay cool and hydrated!'
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
					template: '✅ Normal weather in {{city}}\n\n🌡️ Temperature: {{data.temperature}}°C (threshold: 25°C)\n☁️ Condition: {{data.condition}}\n💧 Humidity: {{data.humidity}}%\n\nEnjoy your day!'
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
						}
					]
				},
				inputSchema: {},
				outputSchema: {
					type: 'object',
					properties: {
						zone: { type: 'string' }
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
					template: '🚨 TEMPERATURE ALERT!\n\n🌡️ Current: {{data.temperature}}°C\n🎯 Threshold: 30°C\n🏢 Zone: {{zone}}\n💧 Humidity: {{data.humidity}}%\n🌬️ Air Quality: {{data.air_quality}}\n\n⚠️ Action Required: Activate cooling system immediately!'
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
					template: '✅ Building Temperature Normal\n\n🌡️ Current: {{data.temperature}}°C\n🎯 Threshold: 30°C\n🏢 Zone: {{zone}}\n💧 Humidity: {{data.humidity}}%\n🌬️ Air Quality: {{data.air_quality}}\n\nNo action required - all systems operating normally.'
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

	private async createAdvancedCoolingWorkflow() {
		const workflow = new Workflow()
		workflow.name = '🏢 Advanced Building Cooling System'

		// Define nodes (6 nodes total):
		// 1. Temperature Sensor (API Call - auto-triggered)
		// 2. AC Control (API Call) 
		// 3. Wait Node (5 minutes = 10 seconds for testing)
		// 4. Temperature Re-check (API Call - check temp after cooling)
		// 5. Temperature Decision (IfElse - is temp still high?)
		// 6. Manager Notification or Success Notification (split paths)

		const nodes: Partial<WorkflowNode>[] = [
			{
				persistedId: 'temp-sensor',
				baseId: 'temp-sensor', 
				name: 'Temperature Sensor',
				type: 'apiCall',
				x: 100,
				y: 100,
				config: {
					method: 'GET',
					url: 'http://api-dev:3000/workflows/api/mock/sensors/temperature/live',
					queryParams: [
						{ key: 'zone', value: 'main_building' }
					],
					headers: [],
					body: {}
				},
				inputSchema: {},
				outputSchema: {
					type: 'object',
					properties: {
						id: { type: 'string' },
						zone: { type: 'string' },
						temperature: { type: 'number' },
						alert_level: { type: 'string' },
						humidity: { type: 'number' },
						timestamp: { type: 'string' },
						requires_action: { type: 'boolean' },
						sensor_id: { type: 'string' }
					}
				},
				connections: ['ac-control']
			},
			{
				persistedId: 'ac-control',
				baseId: 'ac-control',
				name: 'Turn On AC Unit',
				type: 'apiCall',
				x: 350,
				y: 100,
				config: {
					method: 'POST',
					url: 'http://api-dev:3000/workflows/api/mock/building/ac/control',
					queryParams: [],
					headers: [{ key: 'Content-Type', value: 'application/json' }],
					body: {
						zone: '{{data.zone}}',
						action: 'turn_on',
						target_temperature: 22
					}
				},
				inputSchema: {},
				outputSchema: {
					type: 'object',
					properties: {
						control_id: { type: 'string' },
						zone: { type: 'string' },
						success: { type: 'boolean' },
						action: { type: 'string' },
						target_temperature: { type: 'number' },
						estimated_cooling_time: { type: 'number' },
						status_message: { type: 'string' }
					}
				},
				connections: ['wait-cooling']
			},
			{
				persistedId: 'wait-cooling',
				baseId: 'wait-cooling',
				name: 'Wait for Cooling',
				type: 'delay',
				x: 600,
				y: 100,
				config: {
					delayValue: 10, // 10 seconds (represents 5 minutes)
					delayType: 'seconds'
				},
				inputSchema: {},
				outputSchema: {},
				connections: ['temp-recheck-api']
			},
			{
				persistedId: 'temp-recheck-api',
				baseId: 'temp-recheck-api',
				name: 'Re-check Temperature',
				type: 'apiCall',
				x: 850,
				y: 100,
				config: {
					method: 'GET',
					url: 'http://api-dev:3000/workflows/api/mock/sensors/temperature/live',
					queryParams: [
						{ key: 'zone', value: 'main_building' }
					],
					headers: [],
					body: {}
				},
				inputSchema: {},
				outputSchema: {
					type: 'object',
					properties: {
						id: { type: 'string' },
						zone: { type: 'string' },
						temperature: { type: 'number' },
						alert_level: { type: 'string' },
						humidity: { type: 'number' },
						timestamp: { type: 'string' },
						requires_action: { type: 'boolean' },
						sensor_id: { type: 'string' }
					}
				},
				connections: ['temp-decision']
			},
			{
				persistedId: 'temp-decision',
				baseId: 'temp-decision',
				name: 'Temperature Still High?',
				type: 'ifElse',
				x: 1100,
				y: 100,
				config: {
					condition: {
						name: 'Temperature Still Above 30°C',
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
						trueText: 'Still Hot',
						falseText: 'Cooled Down'
					}
				},
				inputSchema: {},
				outputSchema: {},
				connections: ['manager-alert', 'cooling-success']
			},
			{
				persistedId: 'manager-alert',
				baseId: 'manager-alert',
				name: 'Alert Building Manager',
				type: 'notification',
				x: 1000,
				y: 300,
				config: {
					template: '🚨 URGENT: Cooling System Alert!\n\n🌡️ Temperature: {{data.temperature}}°C\n🎯 Zone: {{data.zone}}\n❄️ AC has been running for 5 minutes but temperature remains above 30°C\n\n⚠️ Manager acknowledgment required within 10 minutes\n🆔 Sensor: {{data.sensor_id}}\n⏰ Alert Time: {{data.timestamp}}\n\nPlease respond immediately or backup cooling will activate automatically.'
				},
				inputSchema: {},
				outputSchema: {},
				connections: []
			},
			{
				persistedId: 'cooling-success',
				baseId: 'cooling-success',
				name: 'Cooling Successful',
				type: 'notification',
				x: 1300,
				y: 300,
				config: {
					template: '✅ Building Temperature Normalized\n\n🌡️ Current: {{data.temperature}}°C\n🎯 Zone: {{data.zone}}\n❄️ AC system successfully cooled the area\n🆔 Sensor: {{data.sensor_id}}\n⏰ Time: {{data.timestamp}}\n\n🎉 Normal operations resumed!'
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
			{ sourceId: 'temp-sensor', targetId: 'ac-control', sourceHandle: 'out', targetHandle: 'in' },
			{ sourceId: 'ac-control', targetId: 'wait-cooling', sourceHandle: 'out', targetHandle: 'in' },
			{ sourceId: 'wait-cooling', targetId: 'temp-recheck-api', sourceHandle: 'out', targetHandle: 'in' },
			{ sourceId: 'temp-recheck-api', targetId: 'temp-decision', sourceHandle: 'out', targetHandle: 'in' },
			{ sourceId: 'temp-decision', targetId: 'manager-alert', sourceHandle: 'out-true', targetHandle: 'in' },
			{ sourceId: 'temp-decision', targetId: 'cooling-success', sourceHandle: 'out-false', targetHandle: 'in' }
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