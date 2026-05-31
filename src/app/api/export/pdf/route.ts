import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { authenticateServerRequest } from '@/lib/auth-utils';
import { logMetric } from '@/lib/monitoring';
import { db } from '@/lib/firebase-admin';
import { hasServerDemoPreviewAccess, readServerDemoPreviewProfile } from '@/lib/server/session-auth';

export const runtime = 'nodejs';

type LooseRecord = Record<string, unknown>;

function asRecord(value: unknown): LooseRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as LooseRecord)
    : null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function stringifyField(value: unknown, fallback = 'N/A'): string {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return fallback;
}

function formatUnknownDate(value: unknown, fallback = 'Unknown'): string {
  if (!value) {
    return fallback;
  }

  if (value instanceof Date) {
    return value.toLocaleDateString();
  }

  if (typeof value === 'object' && value !== null) {
    const maybeTimestamp = value as {
      toDate?: () => Date;
      seconds?: number;
    };

    if (typeof maybeTimestamp.toDate === 'function') {
      return maybeTimestamp.toDate().toLocaleDateString();
    }

    if (typeof maybeTimestamp.seconds === 'number') {
      return new Date(maybeTimestamp.seconds * 1000).toLocaleDateString();
    }
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString();
    }
  }

  return fallback;
}

function slugifyFileSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'summary';
}

export async function POST(request: NextRequest) {
  try {
    const {
      caseId,
      type = 'case-report',
      summaryLines = [],
      timeframe,
      generatedAt,
      title,
      description,
      columns = [],
      rows = [],
    } = await request.json();
    const auth = await authenticateServerRequest(request);
    const previewAccess = await hasServerDemoPreviewAccess();
    const previewProfile = previewAccess ? await readServerDemoPreviewProfile() : null;
    const previewCanExportSummary =
      (type === 'report-summary' || type === 'structured-report') &&
      Boolean(previewProfile && (previewProfile.role === 'barangay' || previewProfile.role === 'developer'));

    if (!auth && !previewCanExportSummary) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let buffer: Buffer;

    if (type === 'report-summary') {
      buffer = Buffer.from(await generateReportSummaryPdfBytes(summaryLines, timeframe, generatedAt));
    } else if (type === 'structured-report') {
      buffer = Buffer.from(
        await generateStructuredReportPdfBytes({
          title,
          description,
          timeframe,
          generatedAt,
          columns,
          rows,
        })
      );
    } else {
      if (!caseId) {
        return NextResponse.json(
          { error: 'Missing caseId' },
          { status: 400 }
        );
      }

      const caseRef = await db
        .collection('sms-cases')
        .doc(caseId)
        .get();

      if (!caseRef.exists) {
        return NextResponse.json(
          { error: 'Case not found' },
          { status: 404 }
        );
      }

      const caseData = (caseRef.data() ?? {}) as LooseRecord;

      if (type === 'analytics') {
        buffer = Buffer.from(await generateAnalyticsReportPdfBytes(caseData));
      } else {
        buffer = Buffer.from(await generateCaseReportPdfBytes(caseData, caseId));
      }
    }

    logMetric('pdf_generated', 1, 'count', {
      type,
      caseId,
      userId: auth?.uid ?? 'demo-preview',
    });

    const fileName =
      type === 'report-summary'
        ? `lingkod-ani-report-summary-${slugifyFileSegment(stringifyField(timeframe, 'summary'))}.pdf`
        : type === 'structured-report'
          ? `lingkod-ani-${slugifyFileSegment(stringifyField(title, 'structured-report'))}.pdf`
        : type === 'analytics'
          ? 'lingkod-ani-analytics-report.pdf'
          : `case-${caseId}.pdf`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    logMetric('pdf_generation_error', 1, 'count', {
      error: String(error),
    });

    return NextResponse.json(
      { error: 'PDF generation failed' },
      { status: 500 }
    );
  }
}

async function generateCaseReportPdfBytes(caseData: LooseRecord, caseId: string) {
  const aiInterpretation = asRecord(caseData.aiInterpretation);
  const resolution = asRecord(caseData.resolution);
  const recommendations = asStringArray(aiInterpretation?.recommendations);
  const lines = [
    "Case Information",
    `Status: ${stringifyField(caseData.status, 'Unknown')}`,
    `Farmer: ${stringifyField(caseData.farmerName, 'Unknown')}`,
    `Phone: ${stringifyField(caseData.farmerPhone, 'N/A')}`,
    `Created: ${formatUnknownDate(caseData.createdAt)}`,
    "",
    "Message Content",
    stringifyField(caseData.messageContent, 'No message content'),
  ];

  if (aiInterpretation) {
    lines.push(
      "",
      "AI Interpretation",
      `Risk Level: ${stringifyField(aiInterpretation.riskLevel, 'Unknown')}`,
      `Interpretation: ${stringifyField(aiInterpretation.interpretation, 'N/A')}`
    );

    if (recommendations.length > 0) {
      lines.push("", "Recommendations", ...recommendations.map((item) => `- ${item}`));
    }
  }

  if (resolution) {
    lines.push(
      "",
      "Resolution",
      `Resolution Type: ${stringifyField(resolution.type, 'N/A')}`,
      `Notes: ${stringifyField(resolution.notes, 'N/A')}`,
      `Resolved At: ${formatUnknownDate(resolution.resolvedAt, 'N/A')}`
    );
  }

  return generateSimpleNarrativePdfBytes({
    title: "CASE REPORT",
    subtitle: `Case ID: ${caseId}`,
    lines,
    footer: "Lingkod-Ani autogenerated case report",
  });
}

async function generateAnalyticsReportPdfBytes(stats: LooseRecord) {
  return generateSimpleNarrativePdfBytes({
    title: "ANALYTICS REPORT",
    subtitle: "Generated Report",
    lines: [
      "Summary Statistics",
      `Total Cases: ${stringifyField(stats.totalCases, '0')}`,
      `Resolved Cases: ${stringifyField(stats.resolvedCases, '0')}`,
      `Average Resolution Time: ${stringifyField(stats.avgResolutionTime, 'N/A')} hours`,
    ],
    footer: "Lingkod-Ani autogenerated analytics report",
  });
}

async function generateReportSummaryPdfBytes(summaryLines: unknown, timeframe: unknown, generatedAt: unknown) {
  const normalizedLines = Array.isArray(summaryLines)
    ? summaryLines.filter((line): line is string => typeof line === 'string' && line.trim().length > 0)
    : [];

  const pdfDocument = await PDFDocument.create();
  const page = pdfDocument.addPage([612, 792]);
  const titleFont = await pdfDocument.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await pdfDocument.embedFont(StandardFonts.Helvetica);
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();
  const left = 50;
  const right = pageWidth - 50;
  let cursorY = pageHeight - 60;

  const drawWrappedText = (text: string, options?: { size?: number; font?: typeof bodyFont; color?: ReturnType<typeof rgb>; lineGap?: number }) => {
    const size = options?.size ?? 11;
    const font = options?.font ?? bodyFont;
    const color = options?.color ?? rgb(0.07, 0.1, 0.16);
    const lineGap = options?.lineGap ?? 5;
    const maxWidth = right - left;
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      const candidateWidth = font.widthOfTextAtSize(candidate, size);
      if (candidateWidth <= maxWidth) {
        currentLine = candidate;
        continue;
      }

      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    for (const line of lines) {
      page.drawText(line, {
        x: left,
        y: cursorY,
        size,
        font,
        color,
      });
      cursorY -= size + lineGap;
    }
  };

  page.drawText('LINGKOD-ANI REPORT SUMMARY', {
    x: left,
    y: cursorY,
    size: 20,
    font: titleFont,
    color: rgb(0.08, 0.28, 0.14),
  });
  cursorY -= 30;

  drawWrappedText(`Timeframe: ${stringifyField(timeframe, 'N/A')}`, { size: 11 });
  drawWrappedText(`Generated At: ${stringifyField(generatedAt, new Date().toISOString())}`, { size: 11 });
  cursorY -= 8;

  page.drawLine({
    start: { x: left, y: cursorY },
    end: { x: right, y: cursorY },
    thickness: 1,
    color: rgb(0.8, 0.84, 0.89),
  });
  cursorY -= 22;

  drawWrappedText('Operational Summary', {
    size: 14,
    font: titleFont,
    color: rgb(0.07, 0.1, 0.16),
  });
  cursorY -= 4;

  for (const line of normalizedLines) {
    drawWrappedText(line, { size: 11 });
    cursorY -= 2;
  }

  page.drawText('Lingkod-Ani autogenerated report export', {
    x: left,
    y: 24,
    size: 9,
    font: bodyFont,
    color: rgb(0.42, 0.47, 0.54),
  });

  return pdfDocument.save();
}

async function generateSimpleNarrativePdfBytes(input: {
  title: string;
  subtitle?: string;
  lines: string[];
  footer: string;
}) {
  const pdfDocument = await PDFDocument.create();
  const pageSize: [number, number] = [612, 792];
  const titleFont = await pdfDocument.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await pdfDocument.embedFont(StandardFonts.Helvetica);
  const left = 50;
  const right = pageSize[0] - 50;
  const bottomMargin = 42;
  let page = pdfDocument.addPage(pageSize);
  let cursorY = page.getHeight() - 60;

  const ensureSpace = (requiredHeight: number) => {
    if (cursorY - requiredHeight > bottomMargin) {
      return;
    }

    page = pdfDocument.addPage(pageSize);
    cursorY = page.getHeight() - 60;
  };

  const drawWrappedText = (
    text: string,
    options?: { size?: number; font?: typeof bodyFont; color?: ReturnType<typeof rgb>; lineGap?: number }
  ) => {
    const size = options?.size ?? 11;
    const font = options?.font ?? bodyFont;
    const color = options?.color ?? rgb(0.07, 0.1, 0.16);
    const lineGap = options?.lineGap ?? 5;
    const maxWidth = right - left;
    const paragraphs = text.split(/\n+/);

    for (const paragraph of paragraphs) {
      const words = paragraph.split(/\s+/).filter(Boolean);
      if (words.length === 0) {
        cursorY -= size + lineGap;
        continue;
      }

      let currentLine = "";
      const lines: string[] = [];

      for (const word of words) {
        const candidate = currentLine ? `${currentLine} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
          currentLine = candidate;
          continue;
        }

        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }

      if (currentLine) {
        lines.push(currentLine);
      }

      ensureSpace(lines.length * (size + lineGap));

      for (const line of lines) {
        page.drawText(line, {
          x: left,
          y: cursorY,
          size,
          font,
          color,
        });
        cursorY -= size + lineGap;
      }
    }
  };

  page.drawText(input.title, {
    x: left,
    y: cursorY,
    size: 18,
    font: titleFont,
    color: rgb(0.08, 0.28, 0.14),
  });
  cursorY -= 28;

  if (input.subtitle) {
    drawWrappedText(input.subtitle, { size: 11, font: titleFont, color: rgb(0.07, 0.1, 0.16) });
    cursorY -= 4;
  }

  page.drawLine({
    start: { x: left, y: cursorY },
    end: { x: right, y: cursorY },
    thickness: 1,
    color: rgb(0.8, 0.84, 0.89),
  });
  cursorY -= 20;

  for (const line of input.lines) {
    if (line.trim().length === 0) {
      cursorY -= 6;
      continue;
    }

    const isSection = !line.includes(":") && !line.startsWith("- ");
    drawWrappedText(line, {
      size: isSection ? 12 : 10,
      font: isSection ? titleFont : bodyFont,
      color: rgb(0.07, 0.1, 0.16),
      lineGap: isSection ? 5 : 4,
    });
  }

  page.drawText(input.footer, {
    x: left,
    y: 24,
    size: 9,
    font: bodyFont,
    color: rgb(0.42, 0.47, 0.54),
  });

  return pdfDocument.save();
}

async function generateStructuredReportPdfBytes(input: {
  title: unknown;
  description: unknown;
  timeframe: unknown;
  generatedAt: unknown;
  columns: unknown;
  rows: unknown;
}) {
  const pdfDocument = await PDFDocument.create();
  const titleFont = await pdfDocument.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await pdfDocument.embedFont(StandardFonts.Helvetica);
  const pageSize: [number, number] = [612, 792];
  const left = 40;
  const right = pageSize[0] - 40;
  const bottomMargin = 42;

  const normalizedColumns = Array.isArray(input.columns)
    ? input.columns.filter((column): column is string => typeof column === "string" && column.trim().length > 0)
    : [];
  const normalizedRows = Array.isArray(input.rows)
    ? input.rows
        .filter((row): row is unknown[] => Array.isArray(row))
        .map((row) => row.map((cell) => stringifyField(cell, "")))
    : [];

  let page = pdfDocument.addPage(pageSize);
  let cursorY = page.getHeight() - 56;

  const drawWrappedText = (
    text: string,
    options?: { size?: number; font?: typeof bodyFont; color?: ReturnType<typeof rgb>; lineGap?: number; indent?: number }
  ) => {
    const size = options?.size ?? 10;
    const font = options?.font ?? bodyFont;
    const color = options?.color ?? rgb(0.07, 0.1, 0.16);
    const lineGap = options?.lineGap ?? 4;
    const indent = options?.indent ?? 0;
    const maxWidth = right - left - indent;
    const paragraphs = text.split(/\n+/);

    for (const paragraph of paragraphs) {
      const words = paragraph.split(/\s+/).filter(Boolean);
      if (words.length === 0) {
        cursorY -= size + lineGap;
        continue;
      }

      let currentLine = "";
      const lines: string[] = [];
      for (const word of words) {
        const candidate = currentLine ? `${currentLine} ${word}` : word;
        const width = font.widthOfTextAtSize(candidate, size);
        if (width <= maxWidth) {
          currentLine = candidate;
          continue;
        }
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }

      if (currentLine) {
        lines.push(currentLine);
      }

      for (const line of lines) {
        if (cursorY <= bottomMargin) {
          page = pdfDocument.addPage(pageSize);
          cursorY = page.getHeight() - 56;
        }

        page.drawText(line, {
          x: left + indent,
          y: cursorY,
          size,
          font,
          color,
        });
        cursorY -= size + lineGap;
      }
    }
  };

  page.drawText(stringifyField(input.title, "Lingkod-Ani Structured Report").toUpperCase(), {
    x: left,
    y: cursorY,
    size: 18,
    font: titleFont,
    color: rgb(0.08, 0.28, 0.14),
  });
  cursorY -= 28;

  drawWrappedText(`Timeframe: ${stringifyField(input.timeframe, "N/A")}`, { size: 11 });
  drawWrappedText(`Generated At: ${stringifyField(input.generatedAt, new Date().toISOString())}`, { size: 11 });
  cursorY -= 6;

  drawWrappedText(stringifyField(input.description, "Filtered Lingkod-Ani export."), { size: 10 });
  cursorY -= 8;

  page.drawLine({
    start: { x: left, y: cursorY },
    end: { x: right, y: cursorY },
    thickness: 1,
    color: rgb(0.8, 0.84, 0.89),
  });
  cursorY -= 18;

  if (normalizedColumns.length > 0) {
    drawWrappedText(`Columns: ${normalizedColumns.join(" | ")}`, {
      size: 10,
      font: titleFont,
      color: rgb(0.07, 0.1, 0.16),
    });
    cursorY -= 6;
  }

  if (normalizedRows.length === 0) {
    drawWrappedText("No rows matched the selected export filter.", { size: 11 });
  } else {
    normalizedRows.forEach((row, index) => {
      drawWrappedText(`${index + 1}. ${row.join(" | ")}`, { size: 10 });
      cursorY -= 4;
    });
  }

  page.drawText("Lingkod-Ani structured export", {
    x: left,
    y: 24,
    size: 9,
    font: bodyFont,
    color: rgb(0.42, 0.47, 0.54),
  });

  return pdfDocument.save();
}
