/**
 * Safely exports an array of tabular records to a downloadable CSV in the browser.
 */
export function exportToCsv<T extends Record<string, unknown>>(
	filename: string,
	headers: Array<{ key: keyof T | string; label: string }>,
	data: T[]
): void {
	if (!data || data.length === 0) {
		alert('No records available to export for the current filters.')
		return
	}

	const escapeCell = (val: unknown): string => {
		if (val == null) return '""'
		const str = String(val).replace(/"/g, '""')
		return `"${str}"`
	}

	const headerRow = headers.map((h) => escapeCell(h.label)).join(',')
	const rows = data.map((row) =>
		headers
			.map((h) => {
				const val = row[h.key as keyof T]
				return escapeCell(val)
			})
			.join(',')
	)

	const csvContent = [headerRow, ...rows].join('\r\n')
	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
	const url = URL.createObjectURL(blob)
	const link = document.createElement('a')
	link.setAttribute('href', url)
	link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`)
	document.body.appendChild(link)
	link.click()
	document.body.removeChild(link)
	URL.revokeObjectURL(url)
}
