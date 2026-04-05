import { type FeedbackDisplay } from '../data/schema'
import { formatDate, getCategoryLabel } from '../data/data'

function safe(value: string | undefined): string {
  return `"${(value || '').replace(/"/g, '""')}"`
}

function downloadFile(filename: string, content: BlobPart, mime: string) {
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

/**
 * Export feedbacks to CSV
 */
export function exportToCsv(feedbacks: FeedbackDisplay[]) {
  const header = [
    'Teacher Name',
    'Teacher Email',
    'Rating',
    'Category',
    'Feedback Text',
    'Date',
  ]

  const lines = feedbacks.map((feedback) => {
    return [
      safe(feedback.teacherName),
      safe(feedback.teacherEmail),
      feedback.rating.toString(),
      safe(getCategoryLabel(feedback.category)),
      safe(feedback.feedbackText),
      formatDate(feedback.createdAt),
    ].join(',')
  })

  const csv = [header.join(','), ...lines].join('\n')
  downloadFile('teacher-feedback.csv', csv, 'text/csv;charset=utf-8;')
}

/**
 * Export feedbacks to PDF
 */
export function exportToPdf(feedbacks: FeedbackDisplay[]) {
  const tableRows = feedbacks
    .map((feedback) => {
      const date = formatDate(feedback.createdAt)
      const stars = '★'.repeat(feedback.rating) + '☆'.repeat(5 - feedback.rating)
      return `
        <tr>
          <td>${safe(feedback.teacherName || 'Unknown')}</td>
          <td>${safe(feedback.teacherEmail || '')}</td>
          <td>${stars} (${feedback.rating})</td>
          <td>${getCategoryLabel(feedback.category)}</td>
          <td style="max-width: 300px; word-wrap: break-word;">${safe(feedback.feedbackText)}</td>
          <td>${date}</td>
        </tr>`
    })
    .join('')

  const html = `
    <html>
      <head>
        <title>Teacher Feedback Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 16px; }
          h1 { font-size: 18px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
          th { background: #f5f5f5; font-weight: bold; }
          td { vertical-align: top; }
        </style>
      </head>
      <body>
        <h1>Teacher Feedback Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              <th>Teacher Name</th>
              <th>Email</th>
              <th>Rating</th>
              <th>Category</th>
              <th>Feedback</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
    </html>`

  const printWindow = window.open('', '_blank')
  if (!printWindow) return
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}

