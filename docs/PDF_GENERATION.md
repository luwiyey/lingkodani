# PDF Generation Implementation Guide

**Date**: May 7, 2026  
**Purpose**: Implement true server-side PDF generation for reports, exports, and documents  
**Current Status**: Browser print behavior (to be replaced)  
**Target**: Full PDF download functionality

## Overview

Replace browser print functionality with server-side PDF generation using **pdfkit** + **html2pdf**.

### Why Server-Side PDF?

✅ **Advantages**:
- Consistent formatting across browsers
- Automated batch PDF generation
- Email-friendly PDF exports
- Better branding/headers/footers
- Can be generated without user interaction
- API-accessible (programmatic generation)

❌ **Browser Print Issues**:
- Inconsistent print margins/headers
- Requires manual user action
- Not API-accessible
- Dependent on browser/OS
- Hard to automate

---

## Installation

Add PDF generation libraries:

```bash
npm install pdfkit html2pdf express-async-errors
npm install --save-dev @types/pdfkit
```

Or if using HTML-to-PDF with Puppeteer:

```bash
npm install puppeteer html-pdf-node
npm install --save-dev @types/puppeteer
```

---

## Implementation Option 1: PDFKit (Recommended for Custom PDFs)

### Setup

```typescript
// src/lib/pdf-generator.ts
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

export interface PDFOptions {
  title: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  fontSize?: number;
}

export class PDFGenerator {
  private doc: PDFDocument;
  private chunks: Buffer[] = [];

  constructor(options: PDFOptions = { title: 'Document' }) {
    this.doc = new PDFDocument({
      info: {
        Title: options.title,
        Author: options.author || 'Lingkod-Ani',
        Subject: options.subject,
        Keywords: options.keywords?.join(','),
      },
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50,
      },
    });

    // Collect chunks
    this.doc.on('data', (chunk) => {
      this.chunks.push(chunk);
    });
  }

  header(title: string, subtitle?: string) {
    this.doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text(title, { align: 'left' });

    if (subtitle) {
      this.doc
        .fontSize(12)
        .font('Helvetica')
        .text(subtitle, { align: 'left', lineGap: 5 });
    }

    this.doc.moveTo(50, this.doc.y + 10).lineTo(550, this.doc.y + 10).stroke();
    this.doc.moveDown();
  }

  section(title: string) {
    this.doc.moveDown(0.5);
    this.doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text(title);
    this.doc.moveDown(0.3);
  }

  paragraph(text: string, options = {}) {
    this.doc
      .fontSize(11)
      .font('Helvetica')
      .text(text, {
        align: 'left',
        lineGap: 4,
        ...options,
      });
  }

  table(headers: string[], rows: string[][], options = {}) {
    const colWidth = (500 / headers.length);
    const rowHeight = 25;

    // Headers
    this.doc.font('Helvetica-Bold').fontSize(10);
    let x = 50;
    headers.forEach((header) => {
      this.doc.text(header, x, this.doc.y, {
        width: colWidth,
        align: 'left',
      });
      x += colWidth;
    });

    this.doc.moveDown(1.5);

    // Rows
    this.doc.font('Helvetica').fontSize(10);
    rows.forEach((row) => {
      x = 50;
      row.forEach((cell, idx) => {
        this.doc.text(cell, x, this.doc.y, {
          width: colWidth,
          align: 'left',
        });
        x += colWidth;
      });
      this.doc.moveDown(1.5);
    });
  }

  footer() {
    const pageCount = this.doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      this.doc.switchToPage(i);
      this.doc
        .fontSize(10)
        .text(
          `Page ${i + 1} of ${pageCount}`,
          50,
          this.doc.page.height - 30,
          { align: 'center' }
        );
    }
  }

  async getBuffer(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      this.doc.on('end', () => {
        resolve(Buffer.concat(this.chunks));
      });
      this.doc.on('error', reject);
      this.doc.end();
    });
  }
}
```

### Usage: Case Report PDF

```typescript
// src/app/api/sms-cases/[id]/export-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PDFGenerator } from '@/lib/pdf-generator';
import { authenticateServerRequest } from '@/lib/auth-server';
import { db } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate
    const session = await authenticateServerRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch case details
    const caseDoc = await db
      .collection('sms-cases')
      .doc(params.id)
      .get();

    if (!caseDoc.exists) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const caseData = caseDoc.data()!;

    // Generate PDF
    const pdf = new PDFGenerator({
      title: `Case Report - ${caseData.caseId}`,
      subject: 'SMS Case Report',
      author: session.email,
    });

    pdf.header(`Case Report: ${caseData.caseId}`, caseData.farmerPhone);
    
    pdf.section('Case Details');
    pdf.paragraph(`Created: ${new Date(caseData.createdAt).toLocaleString()}`);
    pdf.paragraph(`Status: ${caseData.status}`);
    pdf.paragraph(`Risk Level: ${caseData.riskLevel}`);

    pdf.section('Farmer Information');
    pdf.paragraph(`Phone: ${caseData.farmerPhone}`);
    pdf.paragraph(`Location: ${caseData.farmerLocation}`);

    pdf.section('Case Description');
    pdf.paragraph(caseData.messageContent);

    pdf.section('AI Assessment');
    if (caseData.aiInterpretation) {
      pdf.paragraph(`Interpretation: ${caseData.aiInterpretation.summary}`);
      pdf.paragraph(`Recommendation: ${caseData.aiInterpretation.recommendation}`);
    }

    pdf.section('Outcomes');
    if (caseData.resolution) {
      pdf.paragraph(`Resolution: ${caseData.resolution}`);
      pdf.paragraph(`Date Resolved: ${new Date(caseData.resolvedAt).toLocaleString()}`);
    }

    pdf.footer();

    const buffer = await pdf.getBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="case-${caseData.caseId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'PDF generation failed' },
      { status: 500 }
    );
  }
}
```

---

## Implementation Option 2: HTML to PDF (Puppeteer)

For complex HTML layouts, use Puppeteer:

```typescript
// src/lib/html-to-pdf.ts
import puppeteer, { Browser, Page } from 'puppeteer';

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: 'new',
    });
  }
  return browser;
}

export async function htmlToPdf(
  html: string,
  filename: string
): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '20mm',
        right: '20mm',
      },
      printBackground: true,
    });

    return pdf as Buffer;
  } finally {
    await page.close();
  }
}
```

### Usage: Dashboard Report

```typescript
// src/app/api/reports/dashboard-pdf/route.ts
import { htmlToPdf } from '@/lib/html-to-pdf';

export async function POST(request: NextRequest) {
  const { reportData } = await request.json();

  // Generate HTML from React component
  const html = `
    <html>
      <body style="font-family: Arial; padding: 20px;">
        <h1>${reportData.title}</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <table border="1" cellpadding="10">
          <tr>
            <th>Metric</th>
            <th>Value</th>
          </tr>
          ${reportData.metrics.map((m: any) => `
            <tr>
              <td>${m.label}</td>
              <td>${m.value}</td>
            </tr>
          `).join('')}
        </table>
      </body>
    </html>
  `;

  const pdf = await htmlToPdf(html, 'dashboard-report.pdf');

  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="dashboard-report.pdf"',
    },
  });
}
```

---

## Client-Side PDF Download

```typescript
// src/hooks/usePdfDownload.ts
import { useState } from 'react';

export function usePdfDownload() {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadPdf = async (
    endpoint: string,
    filename: string,
    data?: Record<string, any>
  ) => {
    setDownloading(true);
    setError(null);

    try {
      const response = await fetch(endpoint, {
        method: data ? 'POST' : 'GET',
        headers: data ? { 'Content-Type': 'application/json' } : {},
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  return { downloadPdf, downloading, error };
}
```

### UI Component

```typescript
// src/components/PdfDownloadButton.tsx
'use client';

import { usePdfDownload } from '@/hooks/usePdfDownload';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

export function PdfDownloadButton({
  endpoint,
  filename,
  variant = 'default',
}: {
  endpoint: string;
  filename: string;
  variant?: string;
}) {
  const { downloadPdf, downloading, error } = usePdfDownload();

  return (
    <div>
      <Button
        onClick={() => downloadPdf(endpoint, filename)}
        disabled={downloading}
        variant={variant as any}
      >
        <FileText className="w-4 h-4 mr-2" />
        {downloading ? 'Generating...' : 'Download PDF'}
      </Button>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
```

---

## PDF Report Templates

### Case Summary Report

```typescript
export async function generateCaseSummaryPdf(
  caseId: string,
  session: any
): Promise<Buffer> {
  const caseDoc = await db.collection('sms-cases').doc(caseId).get();
  const caseData = caseDoc.data()!;

  const pdf = new PDFGenerator({
    title: `Case Summary - ${caseId}`,
  });

  pdf.header('SMS Case Summary Report');
  
  // Key metrics
  pdf.section('Overview');
  pdf.table(
    ['Field', 'Value'],
    [
      ['Case ID', caseData.caseId],
      ['Status', caseData.status],
      ['Risk Level', caseData.riskLevel],
      ['Created', new Date(caseData.createdAt).toLocaleDateString()],
    ]
  );

  // Farmer details
  pdf.section('Farmer Details');
  pdf.paragraph(`Phone: ${caseData.farmerPhone}`);
  pdf.paragraph(`Location: ${caseData.farmerLocation}`);

  // Message history
  pdf.section('Message History');
  const messages = caseData.messages || [];
  pdf.table(
    ['Date', 'Type', 'Message'],
    messages.map((m: any) => [
      new Date(m.timestamp).toLocaleDateString(),
      m.type,
      m.content.substring(0, 50) + '...',
    ])
  );

  pdf.footer();
  return pdf.getBuffer();
}
```

---

## Testing PDF Generation

```bash
# Test case report PDF download
curl -H "Authorization: Bearer $ID_TOKEN" \
  https://localhost:3000/api/sms-cases/case123/export-pdf \
  -o case-report.pdf
```

---

## Next Steps

- [ ] Install PDF libraries: `npm install pdfkit`
- [ ] Create PDF generator service
- [ ] Implement case report PDF endpoint
- [ ] Add PDF download buttons to UI
- [ ] Test PDF generation locally
- [ ] Deploy to production
- [ ] Remove browser print functionality

**Status**: Ready for implementation
