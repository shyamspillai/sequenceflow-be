import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common'

@Controller('workflows/api/mock')
export class MockApiController {

	// Apollo.io Mock Endpoints
	@Post('apollo/person-enrichment')
	async apolloPersonEnrichment(@Body() body: any) {
		const { first_name, last_name, organization_name } = body
		
		// Generate realistic mock data
		const domains = ['techcorp.com', 'innovate.io', 'nexustech.com', 'digitalsolutions.com']
		const titles = ['VP of Sales', 'Marketing Director', 'Head of Business Development', 'Senior Account Executive', 'Director of Growth']
		const industries = ['Technology', 'Software', 'SaaS', 'Fintech', 'E-commerce']
		
		const mockDomain = domains[Math.floor(Math.random() * domains.length)]
		const mockTitle = titles[Math.floor(Math.random() * titles.length)]
		const mockIndustry = industries[Math.floor(Math.random() * industries.length)]
		
		return {
			person: {
				id: `apollo_${Date.now()}`,
				first_name: first_name || 'John',
				last_name: last_name || 'Doe',
				email: `${(first_name || 'john').toLowerCase()}.${(last_name || 'doe').toLowerCase()}@${mockDomain}`,
				phone: `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
				title: mockTitle,
				linkedin_url: `https://linkedin.com/in/${(first_name || 'john').toLowerCase()}-${(last_name || 'doe').toLowerCase()}`,
				organization: {
					name: organization_name || 'TechCorp Inc',
					domain: mockDomain,
					industry: mockIndustry,
					employee_count: Math.floor(Math.random() * 1000) + 50,
					annual_revenue: Math.floor(Math.random() * 50000000) + 1000000
				}
			},
			enrichment_score: Math.floor(Math.random() * 40) + 60, // 60-100
			data_sources: ['Apollo', 'LinkedIn', 'Company Website']
		}
	}

	@Get('apollo/company-search')
	async apolloCompanySearch(@Query() query: any) {
		const { industry, size, location } = query
		
		const companies = [
			{ name: 'TechCorp Inc', domain: 'techcorp.com', industry: 'Software' },
			{ name: 'InnovateLabs', domain: 'innovatelabs.com', industry: 'AI/ML' },
			{ name: 'DataFlow Systems', domain: 'dataflow.io', industry: 'Data Analytics' },
			{ name: 'CloudScale', domain: 'cloudscale.com', industry: 'Cloud Computing' },
			{ name: 'SecureNet', domain: 'securenet.com', industry: 'Cybersecurity' }
		]
		
		return {
			companies: companies.slice(0, 3).map(company => ({
				id: `apollo_company_${Date.now()}_${Math.random()}`,
				name: company.name,
				domain: company.domain,
				industry: industry || company.industry,
				employee_count: parseInt(size) || Math.floor(Math.random() * 500) + 50,
				headquarters: location || 'San Francisco, CA',
				annual_revenue: Math.floor(Math.random() * 100000000) + 5000000,
				founded_year: Math.floor(Math.random() * 20) + 2000,
				technologies: ['React', 'Node.js', 'AWS', 'Salesforce']
			})),
			total_results: 127,
			page: 1
		}
	}

	// ZoomInfo Mock Endpoints
	@Post('zoominfo/contact-enrichment')
	async zoomInfoContactEnrichment(@Body() body: any) {
		const { email, firstName, lastName } = body
		
		return {
			contact: {
				email: email || 'contact@example.com',
				firstName: firstName || 'Jane',
				lastName: lastName || 'Smith',
				phone: `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
				title: 'Senior Marketing Manager',
				company: 'Growth Dynamics',
				department: 'Marketing',
				seniority: 'Senior',
				linkedin: `https://linkedin.com/in/${(firstName || 'jane').toLowerCase()}-${(lastName || 'smith').toLowerCase()}`,
				location: 'New York, NY',
				company_size: '201-500',
				industry: 'Marketing Technology',
				technologies: ['HubSpot', 'Marketo', 'Salesforce', 'Google Analytics']
			},
			confidence_score: 0.95,
			last_updated: new Date().toISOString()
		}
	}

	// HubSpot Mock Endpoints
	@Post('hubspot/contacts')
	async hubspotCreateContact(@Body() body: any) {
		const { properties } = body
		
		return {
			id: `hubspot_${Date.now()}`,
			properties: {
				...properties,
				createdate: new Date().toISOString(),
				lastmodifieddate: new Date().toISOString(),
				hs_object_id: `contact_${Date.now()}`,
				hs_lead_score: Math.floor(Math.random() * 100)
			},
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			archived: false
		}
	}

	@Patch('hubspot/contacts/:contactId')
	async hubspotUpdateContact(@Param('contactId') contactId: string, @Body() body: any) {
		const { properties } = body
		
		return {
			id: contactId,
			properties: {
				...properties,
				lastmodifieddate: new Date().toISOString(),
				hs_object_id: contactId
			},
			updatedAt: new Date().toISOString()
		}
	}

	// Lemlist Mock Endpoints
	@Post('lemlist/campaigns/:campaignId/leads')
	async lemlistAddLead(@Param('campaignId') campaignId: string, @Body() body: any) {
		const { email, firstName, lastName, companyName } = body
		
		return {
			leadId: `lemlist_lead_${Date.now()}`,
			campaignId,
			email,
			firstName,
			lastName,
			companyName,
			status: 'added',
			scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
			sequence_step: 1,
			unsubscribed: false,
			bounced: false
		}
	}

	// Clearbit Mock Endpoints
	@Get('clearbit/companies/:domain')
	async clearbitCompanyEnrichment(@Param('domain') domain: string) {
		const industries = ['Technology', 'Software', 'E-commerce', 'Fintech', 'Healthcare']
		const locations = ['San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA', 'Boston, MA']
		
		return {
			company: {
				domain,
				name: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1) + ' Corp',
				legal_name: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1) + ' Corporation',
				category: {
					sector: 'Technology',
					industry: industries[Math.floor(Math.random() * industries.length)],
					sub_industry: 'Software'
				},
				description: 'Leading technology company providing innovative solutions.',
				metrics: {
					employees: Math.floor(Math.random() * 1000) + 100,
					employees_range: '100-500',
					annual_revenue: Math.floor(Math.random() * 50000000) + 10000000,
					funding_total: Math.floor(Math.random() * 20000000) + 5000000
				},
				location: locations[Math.floor(Math.random() * locations.length)],
				founded_year: Math.floor(Math.random() * 20) + 2000,
				website_url: `https://${domain}`,
				linkedin_url: `https://linkedin.com/company/${domain.split('.')[0]}`,
				technologies: ['React', 'AWS', 'Stripe', 'Intercom'],
				logo: `https://logo.clearbit.com/${domain}`
			},
			enriched_at: new Date().toISOString()
		}
	}

	// Outreach Mock Endpoints
	@Post('outreach/prospects')
	async outreachCreateProspect(@Body() body: any) {
		const { email, firstName, lastName, title, company } = body
		
		return {
			id: `outreach_prospect_${Date.now()}`,
			type: 'prospect',
			attributes: {
				email,
				firstName,
				lastName,
				title,
				company,
				stage: 'prospect',
				starred: false,
				tags: [],
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			},
			relationships: {
				account: {
					data: {
						type: 'account',
						id: `account_${Date.now()}`
					}
				}
			}
		}
	}

	// Salesforce Mock Endpoints  
	@Post('salesforce/leads')
	async salesforceCreateLead(@Body() body: any) {
		const { FirstName, LastName, Email, Company, Status = 'Open - Not Contacted' } = body
		
		return {
			id: `sf_lead_${Date.now()}`,
			success: true,
			attributes: {
				FirstName,
				LastName,
				Email,
				Company,
				Status,
				LeadSource: 'Web',
				CreatedDate: new Date().toISOString(),
				LastModifiedDate: new Date().toISOString()
			}
		}
	}

	// Mock Weather API (for testing)
	@Get('weather/:city')
	async mockWeatherApi(@Param('city') city: string) {
		const temps = { 
			'san francisco': 18, 'new york': 22, 'london': 15, 'tokyo': 24, 
			'sydney': 26, 'dubai': 35, 'mumbai': 32, 'singapore': 30 
		}
		
		const temp = temps[city.toLowerCase()] || 20
		
		return {
			city,
			temperature: temp,
			condition: temp > 25 ? 'sunny' : temp > 15 ? 'partly cloudy' : 'cloudy',
			humidity: Math.floor(Math.random() * 40) + 40,
			timestamp: new Date().toISOString()
		}
	}

	// Lead Scoring API
	@Post('lead-scoring/analyze')
	async analyzeLeadScore(@Body() body: any) {
		const { lead_source, company, title, email } = body
		
		// Random score with some logic
		let baseScore = Math.floor(Math.random() * 40) + 50 // 50-90
		
		// Boost score for LinkedIn leads
		if (lead_source === 'LinkedIn') {
			baseScore += Math.floor(Math.random() * 20) + 5 // +5 to +25
		}
		
		// Boost for CEO titles
		if (title && title.toLowerCase().includes('ceo')) {
			baseScore += Math.floor(Math.random() * 15) + 10 // +10 to +25
		}
		
		const finalScore = Math.min(baseScore, 100)
		
		return {
			lead_id: `lead_${Date.now()}`,
			lead_source,
			company,
			title,
			email,
			score: finalScore,
			qualification: finalScore > 75 ? 'High' : finalScore > 50 ? 'Medium' : 'Low',
			factors: {
				lead_source_score: lead_source === 'LinkedIn' ? 25 : 15,
				title_score: title && title.toLowerCase().includes('ceo') ? 20 : 10,
				engagement_score: Math.floor(Math.random() * 30) + 20
			},
			timestamp: new Date().toISOString()
		}
	}

	// AE Notification API
	@Post('notifications/ae-alert')
	async sendAENotification(@Body() body: any) {
		const { lead_id, lead_source, score, company, title } = body
		
		return {
			notification_id: `notif_${Date.now()}`,
			type: 'ae_alert',
			status: 'sent',
			message: `🚨 High-value lead detected! ${company} (${title}) from ${lead_source} - Score: ${score}`,
			ae_name: 'Sarah Johnson',
			ae_email: 'sarah.johnson@company.com',
			sent_at: new Date().toISOString(),
			channels: ['email', 'slack', 'mobile']
		}
	}

	// Email Campaign API
	@Post('email/follow-up')
	async sendFollowUpEmail(@Body() body: any) {
		const { lead_id, email, first_name, company } = body
		
		const templates = [
			'personalized_intro',
			'value_proposition',
			'case_study_relevant',
			'demo_invitation'
		]
		
		return {
			email_id: `email_${Date.now()}`,
			type: 'follow_up',
			template: templates[Math.floor(Math.random() * templates.length)],
			recipient: email,
			subject: `Following up on your interest - ${company}`,
			status: 'sent',
			delivery_time: new Date().toISOString(),
			tracking: {
				delivered: true,
				opened: Math.random() > 0.3, // 70% open rate
				clicked: Math.random() > 0.7  // 30% click rate
			}
		}
	}

	// Gifting Sequence API
	@Post('campaigns/gifting-sequence')
	async triggerGiftingSequence(@Body() body: any) {
		const { lead_id, title, company } = body
		
		const gifts = [
			{ type: 'premium_swag', value: '$50', description: 'Premium branded merchandise package' },
			{ type: 'gift_card', value: '$100', description: 'Amazon gift card' },
			{ type: 'experience', value: '$200', description: 'Executive lunch invitation' },
			{ type: 'book', value: '$30', description: 'Leadership book with personal note' }
		]
		
		const selectedGift = gifts[Math.floor(Math.random() * gifts.length)]
		
		return {
			sequence_id: `gift_seq_${Date.now()}`,
			lead_id,
			gift: selectedGift,
			status: 'initiated',
			estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
			personalization: `Congratulations on your role as ${title} at ${company}!`,
			tracking_number: `GIFT${Math.floor(Math.random() * 1000000)}`,
			approval_required: selectedGift.value.includes('200'),
			initiated_at: new Date().toISOString()
		}
	}

	// Drip Campaign API
	@Post('campaigns/drip-campaign')
	async triggerDripCampaign(@Body() body: any) {
		const { lead_id, email, company, title } = body
		
		const campaigns = [
			{ name: 'enterprise_nurture', duration_days: 30, emails: 8 },
			{ name: 'smb_conversion', duration_days: 14, emails: 5 },
			{ name: 'industry_specific', duration_days: 21, emails: 6 },
			{ name: 'product_education', duration_days: 28, emails: 7 }
		]
		
		const selectedCampaign = campaigns[Math.floor(Math.random() * campaigns.length)]
		
		return {
			campaign_id: `drip_${Date.now()}`,
			campaign_name: selectedCampaign.name,
			lead_id,
			recipient: email,
			status: 'active',
			sequence_position: 1,
			total_emails: selectedCampaign.emails,
			next_email_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
			completion_date: new Date(Date.now() + selectedCampaign.duration_days * 24 * 60 * 60 * 1000).toISOString(),
			personalization: {
				company,
				title,
				industry: 'Technology'
			},
			started_at: new Date().toISOString()
		}
	}

	// Smart Building Temperature Sensor API
	@Get('building/temperature')
	async getBuildingTemperature(@Query() query: any) {
		const { zone = 'main', floor = '1' } = query
		
		// Random temperature with some logic for different zones
		let baseTemp = 22 + (Math.random() * 16) // 22-38°C range
		
		// Make some zones hotter
		if (zone === 'server_room') {
			baseTemp += Math.random() * 8 // Servers generate heat
		} else if (zone === 'rooftop') {
			baseTemp += Math.random() * 6 // Sun exposure
		}
		
		const temperature = Math.round(baseTemp * 10) / 10 // Round to 1 decimal
		
		return {
			sensor_id: `temp_sensor_${zone}_${floor}`,
			zone,
			floor,
			temperature,
			unit: 'celsius',
			humidity: Math.floor(Math.random() * 40) + 40,
			air_quality: temperature > 30 ? 'poor' : temperature > 25 ? 'moderate' : 'good',
			last_reading: new Date().toISOString(),
			sensor_status: 'active',
			calibration_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
		}
	}

	// Temperature Sensor - Auto-trigger endpoint for workflows  
	@Get('sensors/temperature/live')
	async getLiveTemperature(@Query() query: any) {
		const { zone = 'main_building' } = query
		
		// Higher chance of hot temperatures for testing workflows
		const random = Math.random()
		let temperature: number
		
		if (random < 0.4) {
			// 40% chance: Hot temperature (30-38°C) to trigger workflows
			temperature = 30 + Math.random() * 8
		} else if (random < 0.7) {
			// 30% chance: Warm temperature (25-30°C) 
			temperature = 25 + Math.random() * 5
		} else {
			// 30% chance: Normal temperature (18-25°C)
			temperature = 18 + Math.random() * 7
		}
		
		temperature = Math.round(temperature * 10) / 10
		
		const alertLevel = temperature > 35 ? 'critical' : 
		                  temperature > 30 ? 'high' : 
		                  temperature > 25 ? 'moderate' : 'normal'
		
		return {
			id: `sensor-${Date.now()}`,
			zone,
			temperature,
			alert_level: alertLevel,
			humidity: Math.floor(Math.random() * 40) + 40,
			timestamp: new Date().toISOString(),
			requires_action: temperature > 30,
			sensor_id: `TEMP_${zone.toUpperCase()}_001`
		}
	}

	// Workflow Auto-Trigger Simulation
	@Post('triggers/temperature-alert')
	async triggerTemperatureWorkflow(@Body() body: any) {
		const { zone = 'main_building' } = body
		
		// Get current temperature
		const tempData = await this.getLiveTemperature({ zone })
		
		if (tempData.requires_action) {
			// In a real system, this would trigger the workflow execution
			// For now, we simulate the trigger response
			return {
				trigger_id: `trigger-${Date.now()}`,
				workflow_name: '🏢 Advanced Building Cooling System',
				triggered: true,
				reason: `Temperature ${tempData.temperature}°C exceeds 30°C threshold`,
				zone: tempData.zone,
				sensor_data: tempData,
				next_action: 'Starting automated cooling sequence...',
				estimated_completion: '15 minutes'
			}
		} else {
			return {
				trigger_id: `trigger-${Date.now()}`,
				workflow_name: '🏢 Advanced Building Cooling System',
				triggered: false,
				reason: `Temperature ${tempData.temperature}°C is within normal range`,
				zone: tempData.zone,
				sensor_data: tempData,
				next_action: 'No action required'
			}
		}
	}

	// AC Control API
	@Post('building/ac/control')
	async controlACUnit(@Body() body: any) {
		const { zone = 'main', action, target_temperature } = body
		
		const success = Math.random() > 0.1 // 90% success rate
		
		return {
			control_id: `ac_control_${Date.now()}`,
			zone,
			action,
			target_temperature,
			status: success ? 'success' : 'failed',
			current_mode: action === 'turn_on' ? 'cooling' : action === 'turn_off' ? 'off' : 'auto',
			power_consumption: action === 'turn_on' ? Math.floor(Math.random() * 2000) + 1500 : 0, // Watts
			estimated_time_to_target: action === 'turn_on' ? Math.floor(Math.random() * 15) + 5 : null, // 5-20 minutes
			error_message: success ? null : 'Communication timeout with AC unit',
			timestamp: new Date().toISOString()
		}
	}

	// Building Manager Notification API
	@Post('building/notifications/manager')
	async notifyBuildingManager(@Body() body: any) {
		const { zone, temperature, issue_type = 'temperature_alert' } = body
		
		return {
			notification_id: `bldg_notif_${Date.now()}`,
			type: issue_type,
			priority: temperature > 35 ? 'critical' : temperature > 30 ? 'high' : 'medium',
			message: `🌡️ Temperature alert in ${zone}: ${temperature}°C exceeds threshold`,
			manager_name: 'Mike Chen',
			manager_email: 'mike.chen@building.com',
			manager_phone: '+1-555-BLDG-MGR',
			sent_via: ['email', 'sms', 'building_app'],
			acknowledgment_required: true,
			acknowledgment_deadline: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
			escalation_contact: 'emergency@building.com',
			sent_at: new Date().toISOString()
		}
	}

	// Manager Acknowledgment Check API
	@Get('building/notifications/:notificationId/status')
	async checkManagerAcknowledgment(@Param('notificationId') notificationId: string) {
		// Random acknowledgment - 60% chance manager responds within time
		const acknowledged = Math.random() > 0.4
		const responseTime = Math.floor(Math.random() * 12) + 2 // 2-14 minutes
		
		return {
			notification_id: notificationId,
			acknowledged,
			acknowledgment_time: acknowledged ? new Date(Date.now() - responseTime * 60 * 1000).toISOString() : null,
			response_message: acknowledged ? 'Issue confirmed. On-site team dispatched.' : null,
			response_time_minutes: acknowledged ? responseTime : null,
			escalation_triggered: !acknowledged,
			status: acknowledged ? 'resolved' : 'pending_escalation'
		}
	}

	// Backup Cooling System API
	@Post('building/backup-cooling/activate')
	async activateBackupCooling(@Body() body: any) {
		const { zone, emergency_mode = false } = body
		
		const success = Math.random() > 0.05 // 95% success rate
		
		return {
			activation_id: `backup_cooling_${Date.now()}`,
			zone,
			status: success ? 'activated' : 'failed',
			system_type: 'emergency_hvac',
			capacity: '150% of normal cooling',
			estimated_cooldown_time: Math.floor(Math.random() * 10) + 10, // 10-20 minutes
			power_consumption: Math.floor(Math.random() * 3000) + 3000, // 3000-6000 Watts
			activation_reason: emergency_mode ? 'Manager non-response escalation' : 'Manual activation',
			auto_shutoff_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
			monitoring_frequency: '30 seconds',
			error_message: success ? null : 'Backup system maintenance required',
			activated_at: new Date().toISOString()
		}
	}
} 