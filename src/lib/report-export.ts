type ReportRowValue = string | number | boolean | null | undefined;

type PrintableReportOptions = {
  title: string;
  timeframe: string;
  description?: string;
  rows: Array<Record<string, ReportRowValue>>;
};

const OMITTED_PRINT_KEYS = new Set(['fill', 'color', 'stroke', 'icon']);

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stringifyCell(value: ReportRowValue) {
  if (value === null || value === undefined) {
    return '—';
  }

  if (typeof value === 'boolean') {
    return value ? 'Oo' : 'Hindi';
  }

  return String(value);
}

export function sanitizePrintableRows(
  rows: Array<Record<string, ReportRowValue>>
) {
  return rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).filter(([key]) => !OMITTED_PRINT_KEYS.has(key))
    ) as Record<string, ReportRowValue>
  );
}

export function openPrintableReport(options: PrintableReportOptions) {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=960,height=720');

  if (!printWindow) {
    window.alert('Pinagbawalan ng browser ang bagong window. Payagan muna ang pop-ups para sa site na ito.');
    return {
      ok: false as const,
      message: 'Pinagbawalan ng browser ang bagong window. Payagan muna ang pop-ups para sa site na ito.',
    };
  }

  const rows = options.rows;
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  const tableHeaderHtml = headers
    .map((header) => `<th>${escapeHtml(header)}</th>`)
    .join('');
  const tableRowsHtml = rows.length > 0
    ? rows
        .map((row) => (
          `<tr>${headers
            .map((header) => `<td>${escapeHtml(stringifyCell(row[header]))}</td>`)
            .join('')}</tr>`
        ))
        .join('')
    : '<tr><td colspan="99">Wala pang sapat na data para sa napiling ulat.</td></tr>';

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${escapeHtml(options.title)}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 32px;
            color: #111827;
            line-height: 1.5;
          }
          h1 {
            font-size: 24px;
            margin: 0 0 12px;
          }
          .meta {
            margin-bottom: 8px;
            color: #4b5563;
            font-size: 14px;
          }
          .description {
            margin-bottom: 20px;
            font-size: 14px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
            font-size: 13px;
          }
          th, td {
            border: 1px solid #d1d5db;
            padding: 10px 12px;
            text-align: left;
            vertical-align: top;
          }
          th {
            background: #f3f4f6;
            font-weight: 600;
          }
          @media print {
            body {
              padding: 24px;
            }
          }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(options.title)}</h1>
        <div class="meta">Timeframe: ${escapeHtml(options.timeframe)}</div>
        ${options.description ? `<div class="description">${escapeHtml(options.description)}</div>` : ''}
        <table>
          <thead>
            <tr>${tableHeaderHtml}</tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => {
    printWindow.print();
  }, 250);

  return { ok: true as const };
}
