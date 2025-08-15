// Quick test for template function
function getByPath(obj, path) {
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

function interpolateTemplate(template, data) {
	if (!template) return ''
	return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, expr) => {
		const key = String(expr).trim()
		const val = getByPath(data, key)
		return val === undefined || val === null ? '' : String(val)
	})
}

// Test data structure (similar to API response)
const testPayload = {
	status: 200,
	statusText: "OK",
	data: {
		companies: [
			{
				name: "TechCorp Inc",
				domain: "techcorp.com",
				industry: "Software",
				employee_count: 250
			},
			{
				name: "InnovateLabs",
				domain: "innovatelabs.com",
				industry: "AI/ML"
			}
		],
		total_results: 127
	},
	success: true
}

// Test templates
const templates = [
	"See the Data {{data.companies[0].name}}",
	"Company: {{data.companies[0].name}} - {{data.companies[0].industry}}",
	"Status: {{status}} {{statusText}}",
	"Success: {{success}}",
	"Total: {{data.total_results}}",
	"Second company: {{data.companies[1].name}}"
]

console.log("Testing template interpolation with array indexing:")
console.log("=".repeat(50))

templates.forEach((template, i) => {
	const result = interpolateTemplate(template, testPayload)
	console.log(`${i + 1}. Template: "${template}"`)
	console.log(`   Result:   "${result}"`)
	console.log()
})

// Test individual path lookups
console.log("Testing individual path lookups:")
console.log("=".repeat(30))
const paths = [
	"data.companies[0].name",
	"data.companies[0].industry", 
	"data.companies[1].name",
	"status",
	"data.total_results"
]

paths.forEach(path => {
	const result = getByPath(testPayload, path)
	console.log(`${path} → ${result}`)
}) 