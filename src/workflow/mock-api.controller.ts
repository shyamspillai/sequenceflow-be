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
} 