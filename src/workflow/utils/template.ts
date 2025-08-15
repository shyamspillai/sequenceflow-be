export function getByPath(obj: any, path: string): any {
	if (!obj || !path) return undefined
	
	// Handle array indexing by converting path like "data.companies[0].name" to ["data", "companies", "0", "name"]
	const normalizedPath = path.replace(/\[(\d+)\]/g, '.$1') // Convert [0] to .0
	const parts = normalizedPath.split('.')
	
	let cur = obj
	for (const p of parts) {
		if (cur && (Object.prototype.hasOwnProperty.call(cur, p) || Array.isArray(cur))) {
			cur = cur[p]
		} else {
			return undefined
		}
	}
	return cur
}

export function interpolateTemplate(template: string, data: Record<string, any>): string {
	if (!template) return ''
	return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, expr: string) => {
		const key = String(expr).trim()
		const val = getByPath(data, key)
		return val === undefined || val === null ? '' : String(val)
	})
} 