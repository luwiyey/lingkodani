import PDFDocument from 'pdfkit';

export interface PDFOptions {
  title: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  fontSize?: number;
}

type PDFTextOptions = NonNullable<Parameters<InstanceType<typeof PDFDocument>['text']>[1]>;

export class PDFGenerator {
  private doc: InstanceType<typeof PDFDocument>;
  private chunks: Buffer[] = [];

  constructor(options: PDFOptions = { title: 'Document' }) {
    const info = Object.fromEntries(
      Object.entries({
        Title: options.title,
        Author: options.author || 'Lingkod-Ani',
        Subject: options.subject,
        Keywords: options.keywords?.join(','),
      }).filter(([, value]) => value !== undefined && value !== null && value !== '')
    );

    this.doc = new PDFDocument({
      info,
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50,
      },
    });

    // Collect chunks
    this.doc.on('data', (chunk: Buffer) => {
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

  paragraph(text: string, options: Partial<PDFTextOptions> = {}) {
    this.doc
      .fontSize(11)
      .font('Helvetica')
      .text(text, {
        align: 'left',
        lineGap: 4,
        ...options,
      });
  }

  table(headers: string[], rows: string[][]) {
    const colWidth = 500 / headers.length;

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
      row.forEach((cell) => {
        this.doc.text(cell, x, this.doc.y, {
          width: colWidth,
          align: 'left',
        });
        x += colWidth;
      });
      this.doc.moveDown(1.5);
    });
  }

  newPage() {
    this.doc.addPage();
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
