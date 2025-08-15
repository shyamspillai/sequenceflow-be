import { executeWorkflow } from './runner'
import type { PersistedWorkflowDto } from '../dto/workflow.dto'

// Simple assertion function
function expect(actual: any) {
	return {
		toHaveLength(expected: number) {
			if (actual.length !== expected) {
				throw new Error(`Expected length ${expected}, got ${actual.length}`)
			}
		},
		toBe(expected: any) {
			if (actual !== expected) {
				throw new Error(`Expected ${expected}, got ${actual}`)
			}
		},
		toContain(expected: string) {
			if (!actual.includes(expected)) {
				throw new Error(`Expected "${actual}" to contain "${expected}"`)
			}
		}
	}
}

async function runTests() {
	console.log('🧪 Running If-Else Node Tests...\n')

	// Test 1: Condition evaluates to true
	console.log('Test 1: Should evaluate condition to true and take true branch')
	try {
		const workflow: PersistedWorkflowDto = {
			id: 'test-workflow',
			name: 'If-Else Test Workflow',
			createdAt: Date.now(),
			updatedAt: Date.now(),
			nodes: [
				{
					id: 'input-1',
					base: {
						id: 'input-1',
						type: 'inputText',
						name: 'Input',
						inputSchema: {},
						outputSchema: {
							type: 'object',
							properties: {
								temperature: { type: 'number' },
								city: { type: 'string' }
							}
						},
						config: {
							fields: [
								{ key: 'temperature', label: 'Temperature', kind: 'number' },
								{ key: 'city', label: 'City', kind: 'text' }
							]
						},
						connections: ['ifelse-1']
					},
					position: { x: 100, y: 100 }
				},
				{
					id: 'ifelse-1',
					base: {
						id: 'ifelse-1',
						type: 'ifElse',
						name: 'Temperature Check',
						inputSchema: {
							type: 'object',
							properties: {
								temperature: { type: 'number' },
								city: { type: 'string' }
							}
						},
						outputSchema: {},
						config: {
							condition: {
								id: 'condition-1',
								name: 'High Temperature',
								predicates: [
									{
										id: 'predicate-1',
										targetField: 'temperature',
										validationLogic: { '>': [{ var: 'value' }, 25] }
									}
								],
								combiner: 'all'
							},
							trueLabel: 'Hot Weather',
							falseLabel: 'Cool Weather'
						},
						connections: ['notification-hot', 'notification-cool']
					},
					position: { x: 300, y: 100 }
				},
				{
					id: 'notification-hot',
					base: {
						id: 'notification-hot',
						type: 'notification',
						name: 'Hot Weather Alert',
						inputSchema: {
							type: 'object',
							properties: {
								temperature: { type: 'number' },
								city: { type: 'string' }
							}
						},
						outputSchema: {},
						config: {
							template: 'It\'s hot in {{city}}! Temperature: {{temperature}}°C'
						},
						connections: []
					},
					position: { x: 500, y: 50 }
				},
				{
					id: 'notification-cool',
					base: {
						id: 'notification-cool',
						type: 'notification',
						name: 'Cool Weather Alert',
						inputSchema: {
							type: 'object',
							properties: {
								temperature: { type: 'number' },
								city: { type: 'string' }
							}
						},
						outputSchema: {},
						config: {
							template: 'It\'s cool in {{city}}. Temperature: {{temperature}}°C'
						},
						connections: []
					},
					position: { x: 500, y: 150 }
				}
			],
			edges: [
				{
					id: 'edge-1',
					sourceId: 'input-1',
					targetId: 'ifelse-1',
					sourceHandleId: 'out',
					targetHandleId: 'in'
				},
				{
					id: 'edge-2',
					sourceId: 'ifelse-1',
					targetId: 'notification-hot',
					sourceHandleId: 'out-true',
					targetHandleId: 'in'
				},
				{
					id: 'edge-3',
					sourceId: 'ifelse-1',
					targetId: 'notification-cool',
					sourceHandleId: 'out-false',
					targetHandleId: 'in'
				}
			]
		}

		const result = await executeWorkflow(workflow, { temperature: 30, city: 'Miami' })

		expect(result.logs).toHaveLength(3)
		expect(result.logs[0].kind).toBe('input')
		expect(result.logs[0].content).toContain('Miami')
		expect(result.logs[1].kind).toBe('decision')
		expect(result.logs[1].content).toContain('Hot Weather')
		expect(result.logs[2].kind).toBe('notification')
		expect(result.logs[2].content).toContain('It\'s hot in Miami')

		console.log('✅ Test 1 passed\n')
	} catch (error) {
		console.log('❌ Test 1 failed:', error.message)
		console.log('')
	}

	// Test 2: Condition evaluates to false
	console.log('Test 2: Should evaluate condition to false and take false branch')
	try {
		const workflow: PersistedWorkflowDto = {
			id: 'test-workflow',
			name: 'If-Else Test Workflow',
			createdAt: Date.now(),
			updatedAt: Date.now(),
			nodes: [
				{
					id: 'input-1',
					base: {
						id: 'input-1',
						type: 'inputText',
						name: 'Input',
						inputSchema: {},
						outputSchema: {
							type: 'object',
							properties: {
								temperature: { type: 'number' },
								city: { type: 'string' }
							}
						},
						config: {
							fields: [
								{ key: 'temperature', label: 'Temperature', kind: 'number' },
								{ key: 'city', label: 'City', kind: 'text' }
							]
						},
						connections: ['ifelse-1']
					},
					position: { x: 100, y: 100 }
				},
				{
					id: 'ifelse-1',
					base: {
						id: 'ifelse-1',
						type: 'ifElse',
						name: 'Temperature Check',
						inputSchema: {
							type: 'object',
							properties: {
								temperature: { type: 'number' },
								city: { type: 'string' }
							}
						},
						outputSchema: {},
						config: {
							condition: {
								id: 'condition-1',
								name: 'High Temperature',
								predicates: [
									{
										id: 'predicate-1',
										targetField: 'temperature',
										validationLogic: { '>': [{ var: 'value' }, 25] }
									}
								],
								combiner: 'all'
							},
							trueLabel: 'Hot Weather',
							falseLabel: 'Cool Weather'
						},
						connections: ['notification-hot', 'notification-cool']
					},
					position: { x: 300, y: 100 }
				},
				{
					id: 'notification-cool',
					base: {
						id: 'notification-cool',
						type: 'notification',
						name: 'Cool Weather Alert',
						inputSchema: {
							type: 'object',
							properties: {
								temperature: { type: 'number' },
								city: { type: 'string' }
							}
						},
						outputSchema: {},
						config: {
							template: 'It\'s cool in {{city}}. Temperature: {{temperature}}°C'
						},
						connections: []
					},
					position: { x: 500, y: 150 }
				}
			],
			edges: [
				{
					id: 'edge-1',
					sourceId: 'input-1',
					targetId: 'ifelse-1',
					sourceHandleId: 'out',
					targetHandleId: 'in'
				},
				{
					id: 'edge-3',
					sourceId: 'ifelse-1',
					targetId: 'notification-cool',
					sourceHandleId: 'out-false',
					targetHandleId: 'in'
				}
			]
		}

		const result = await executeWorkflow(workflow, { temperature: 15, city: 'Seattle' })

		expect(result.logs).toHaveLength(3)
		expect(result.logs[0].kind).toBe('input')
		expect(result.logs[0].content).toContain('Seattle')
		expect(result.logs[1].kind).toBe('decision')
		expect(result.logs[1].content).toContain('Cool Weather')
		expect(result.logs[2].kind).toBe('notification')
		expect(result.logs[2].content).toContain('It\'s cool in Seattle')

		console.log('✅ Test 2 passed\n')
	} catch (error) {
		console.log('❌ Test 2 failed:', error.message)
		console.log('')
	}

	// Test 3: Multiple predicates with "all" combiner
	console.log('Test 3: Should handle multiple predicates with "all" combiner')
	try {
		const workflow: PersistedWorkflowDto = {
			id: 'test-workflow',
			name: 'Multi-Predicate If-Else Test',
			createdAt: Date.now(),
			updatedAt: Date.now(),
			nodes: [
				{
					id: 'input-1',
					base: {
						id: 'input-1',
						type: 'inputText',
						name: 'Input',
						inputSchema: {},
						outputSchema: {
							type: 'object',
							properties: {
								temperature: { type: 'number' },
								humidity: { type: 'number' },
								city: { type: 'string' }
							}
						},
						config: {
							fields: [
								{ key: 'temperature', label: 'Temperature', kind: 'number' },
								{ key: 'humidity', label: 'Humidity', kind: 'number' },
								{ key: 'city', label: 'City', kind: 'text' }
							]
						},
						connections: ['ifelse-1']
					},
					position: { x: 100, y: 100 }
				},
				{
					id: 'ifelse-1',
					base: {
						id: 'ifelse-1',
						type: 'ifElse',
						name: 'Weather Comfort Check',
						inputSchema: {
							type: 'object',
							properties: {
								temperature: { type: 'number' },
								humidity: { type: 'number' },
								city: { type: 'string' }
							}
						},
						outputSchema: {},
						config: {
							condition: {
								id: 'condition-1',
								name: 'Comfortable Weather',
								predicates: [
									{
										id: 'predicate-1',
										targetField: 'temperature',
										validationLogic: { 'and': [{ '>=': [{ var: 'value' }, 20] }, { '<=': [{ var: 'value' }, 25] }] }
									},
									{
										id: 'predicate-2',
										targetField: 'humidity',
										validationLogic: { '<=': [{ var: 'value' }, 60] }
									}
								],
								combiner: 'all'
							},
							trueLabel: 'Comfortable',
							falseLabel: 'Uncomfortable'
						},
						connections: ['notification-comfortable', 'notification-uncomfortable']
					},
					position: { x: 300, y: 100 }
				},
				{
					id: 'notification-comfortable',
					base: {
						id: 'notification-comfortable',
						type: 'notification',
						name: 'Comfortable Weather',
						inputSchema: {
							type: 'object',
							properties: {
								temperature: { type: 'number' },
								humidity: { type: 'number' },
								city: { type: 'string' }
							}
						},
						outputSchema: {},
						config: {
							template: 'Perfect weather in {{city}}! {{temperature}}°C, {{humidity}}% humidity'
						},
						connections: []
					},
					position: { x: 500, y: 50 }
				},
				{
					id: 'notification-uncomfortable',
					base: {
						id: 'notification-uncomfortable',
						type: 'notification',
						name: 'Uncomfortable Weather',
						inputSchema: {
							type: 'object',
							properties: {
								temperature: { type: 'number' },
								humidity: { type: 'number' },
								city: { type: 'string' }
							}
						},
						outputSchema: {},
						config: {
							template: 'Not ideal weather in {{city}}. {{temperature}}°C, {{humidity}}% humidity'
						},
						connections: []
					},
					position: { x: 500, y: 150 }
				}
			],
			edges: [
				{
					id: 'edge-1',
					sourceId: 'input-1',
					targetId: 'ifelse-1',
					sourceHandleId: 'out',
					targetHandleId: 'in'
				},
				{
					id: 'edge-2',
					sourceId: 'ifelse-1',
					targetId: 'notification-comfortable',
					sourceHandleId: 'out-true',
					targetHandleId: 'in'
				},
				{
					id: 'edge-3',
					sourceId: 'ifelse-1',
					targetId: 'notification-uncomfortable',
					sourceHandleId: 'out-false',
					targetHandleId: 'in'
				}
			]
		}

		// Test case where both conditions are met (comfortable weather)
		const result1 = await executeWorkflow(workflow, { temperature: 22, humidity: 45, city: 'San Diego' })
		expect(result1.logs[1].content).toContain('Comfortable')
		expect(result1.logs[2].content).toContain('Perfect weather in San Diego')

		// Test case where temperature is good but humidity is too high (uncomfortable)
		const result2 = await executeWorkflow(workflow, { temperature: 23, humidity: 80, city: 'Miami' })
		expect(result2.logs[1].content).toContain('Uncomfortable')
		expect(result2.logs[2].content).toContain('Not ideal weather in Miami')

		console.log('✅ Test 3 passed\n')
	} catch (error) {
		console.log('❌ Test 3 failed:', error.message)
		console.log('')
	}

	// Test 4: Empty predicates
	console.log('Test 4: Should handle empty predicates gracefully')
	try {
		const workflow: PersistedWorkflowDto = {
			id: 'test-workflow',
			name: 'Empty Predicates Test',
			createdAt: Date.now(),
			updatedAt: Date.now(),
			nodes: [
				{
					id: 'input-1',
					base: {
						id: 'input-1',
						type: 'inputText',
						name: 'Input',
						inputSchema: {},
						outputSchema: {
							type: 'object',
							properties: {
								value: { type: 'string' }
							}
						},
						config: {
							fields: [
								{ key: 'value', label: 'Value', kind: 'text' }
							]
						},
						connections: ['ifelse-1']
					},
					position: { x: 100, y: 100 }
				},
				{
					id: 'ifelse-1',
					base: {
						id: 'ifelse-1',
						type: 'ifElse',
						name: 'Empty Condition',
						inputSchema: {
							type: 'object',
							properties: {
								value: { type: 'string' }
							}
						},
						outputSchema: {},
						config: {
							condition: {
								id: 'condition-1',
								name: 'Empty Condition',
								predicates: [],
								combiner: 'all'
							},
							trueLabel: 'True',
							falseLabel: 'False'
						},
						connections: ['notification-false']
					},
					position: { x: 300, y: 100 }
				},
				{
					id: 'notification-false',
					base: {
						id: 'notification-false',
						type: 'notification',
						name: 'False Branch',
						inputSchema: {},
						outputSchema: {},
						config: {
							template: 'No conditions to evaluate - taking false branch'
						},
						connections: []
					},
					position: { x: 500, y: 150 }
				}
			],
			edges: [
				{
					id: 'edge-1',
					sourceId: 'input-1',
					targetId: 'ifelse-1',
					sourceHandleId: 'out',
					targetHandleId: 'in'
				},
				{
					id: 'edge-3',
					sourceId: 'ifelse-1',
					targetId: 'notification-false',
					sourceHandleId: 'out-false',
					targetHandleId: 'in'
				}
			]
		}

		const result = await executeWorkflow(workflow, { value: 'test' })
		expect(result.logs[1].content).toContain('False')
		expect(result.logs[2].content).toContain('No conditions to evaluate')

		console.log('✅ Test 4 passed\n')
	} catch (error) {
		console.log('❌ Test 4 failed:', error.message)
		console.log('')
	}

	console.log('🎉 All If-Else Node tests completed!')
}

// Run the tests
runTests().catch(console.error) 