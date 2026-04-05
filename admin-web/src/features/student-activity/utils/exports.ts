import { StudentActivityRow } from '../types'
import { downloadFile, formatSeconds } from './formatters'

type ExportOptions = {
  classNameById?: Record<string, string>
}

export function exportToCsv(rows: StudentActivityRow[], options: ExportOptions = {}) {
  const { classNameById = {} } = options
  const header = [
    'Student',
    'Class',
    'Average Score',
    'Completion Rate',
    'Activities',
    'Total Time (mins)',
    'Attempts',
    'Stars',
    'Last Activity',
  ]

  const lines = rows.map((row) => {
    const last = row.lastActivity
      ? new Date(row.lastActivity).toISOString()
      : ''
    const minutes = Math.round(row.totalTimeSpent / 60)
    const classLabel = classNameById[row.classID ?? ''] ?? row.classID ?? ''
    return [
      safe(row.studentName),
      safe(classLabel),
      row.averageScore.toFixed(1),
      row.completionRate.toFixed(0),
      row.activityCount.toString(),
      minutes.toString(),
      row.attempts.toString(),
      row.starsEarned.toString(),
      last,
    ].join(',')
  })

  const csv = [header.join(','), ...lines].join('\n')
  downloadFile('student-activity.csv', csv, 'text/csv;charset=utf-8;')
}

export function exportToPdf(rows: StudentActivityRow[], options: ExportOptions = {}) {
  const { classNameById = {} } = options
  const tableRows = rows
    .map((row) => {
      const last = row.lastActivity
        ? new Date(row.lastActivity).toLocaleString()
        : '—'
      const classLabel = classNameById[row.classID ?? ''] ?? row.classID ?? ''
      return `
        <tr>
          <td>${safe(row.studentName)}</td>
          <td>${safe(classLabel)}</td>
          <td>${row.averageScore.toFixed(1)}%</td>
          <td>${row.completionRate.toFixed(0)}%</td>
          <td>${row.activityCount}</td>
          <td>${formatSeconds(row.totalTimeSpent)}</td>
          <td>${row.attempts}</td>
          <td>${row.starsEarned}</td>
          <td>${last}</td>
        </tr>`
    })
    .join('')

  const html = `
    <html>
      <head>
        <title>Student Activity Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 16px; }
          h1 { font-size: 18px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
          th { background: #f5f5f5; }
        </style>
      </head>
      <body>
        <h1>Student Activity Report</h1>
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Class</th>
              <th>Avg Score</th>
              <th>Completion</th>
              <th>Activities</th>
              <th>Total Time</th>
              <th>Attempts</th>
              <th>Stars</th>
              <th>Last Activity</th>
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

function safe(value: string) {
  return `"${(value || '').replace(/"/g, '""')}"`
}


