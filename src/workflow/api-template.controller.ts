import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common'
import { ApiTemplateService } from './services/api-template.service'
import { ApiTemplate, ApiProvider, ApiTemplateCategory } from './entities/api-template.entity'

@Controller('api-templates')
export class ApiTemplateController {
	constructor(private readonly templateService: ApiTemplateService) {}

	@Get()
	async findAll(@Query('provider') provider?: ApiProvider, @Query('category') category?: ApiTemplateCategory) {
		if (provider) {
			return this.templateService.findByProvider(provider)
		}
		if (category) {
			return this.templateService.findByCategory(category)
		}
		return this.templateService.findAll()
	}

	@Get('grouped')
	async getGroupedTemplates() {
		return this.templateService.getGroupedTemplates()
	}

	@Get(':id')
	async findById(@Param('id') id: string) {
		const template = await this.templateService.findById(id)
		if (!template) {
			throw new Error('Template not found')
		}
		return template
	}

	@Post()
	async create(@Body() template: Partial<ApiTemplate>) {
		return this.templateService.create(template)
	}

	@Put(':id')
	async update(@Param('id') id: string, @Body() updates: Partial<ApiTemplate>) {
		return this.templateService.update(id, updates)
	}

	@Delete(':id')
	async delete(@Param('id') id: string) {
		await this.templateService.delete(id)
		return { success: true }
	}
} 