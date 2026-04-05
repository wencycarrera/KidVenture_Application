export function formatSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0m'
  const mins = Math.floor(seconds / 60)
  const hrs = Math.floor(mins / 60)
  const remainingMins = mins % 60
  if (hrs > 0) return `${hrs}h ${remainingMins}m`
  return `${Math.max(1, remainingMins)}m`
}

export function downloadFile(filename: string, content: BlobPart, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}





