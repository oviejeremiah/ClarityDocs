// pdf-parse's CJS/ESM interop is unreliable with `import` — require() sidesteps it.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse') as (
  buffer: Buffer,
) => Promise<{ text: string; numpages: number }>;
import { Injectable, Logger } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as mammoth from 'mammoth';
import { parse } from 'csv-parse/sync';

@Injectable()
export class DocumentConverterService {
  private readonly logger = new Logger(DocumentConverterService.name);

  async csvToText(filePath: string): Promise<string> {
    try {
      const { readFileSync } = await import('fs');
      const content = readFileSync(filePath, 'utf-8');
      const records = parse(content, {
        skip_empty_lines: true,
        trim: true,
      });

      if (records.length === 0) return 'Empty CSV file';

      const headers = records[0];
      const rows = records.slice(1);

      const lines: string[] = [];
      lines.push(`CSV Document with ${rows.length} records`);
      lines.push(`Columns: ${headers.join(', ')}`);
      lines.push('');

      rows.slice(0, 100).forEach((row, i) => {
        const rowData = headers
          .map((h, idx) => `${h}: ${row[idx] ?? ''}`)
          .join(' | ');
        lines.push(`Row ${i + 1}: ${rowData}`);
      });

      if (rows.length > 100) {
        lines.push(`... and ${rows.length - 100} more rows`);
      }

      this.logger.log(
        `Converted CSV: ${rows.length} rows, ${headers.length} columns`,
      );
      return lines.join('\n');
    } catch (error) {
      this.logger.error(`CSV conversion failed: ${String(error)}`);
      throw error;
    }
  }

  xlsxToText(filePath: string): string {
    try {
      const workbook = XLSX.readFile(filePath);
      const lines: string[] = [];

      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, {
          defval: '',
        });

        if (data.length === 0) return;

        lines.push(`Sheet: ${sheetName}`);
        const headers = data[0] as string[];
        lines.push(`Columns: ${headers.join(', ')}`);

        data.slice(1, 101).forEach((row, i) => {
          const rowArr = row as (string | number | boolean | null)[];
          const rowData = headers
            .map((h, idx) => `${h}: ${rowArr[idx] ?? ''}`)
            .join(' | ');
          lines.push(`Row ${i + 1}: ${rowData}`);
        });
        lines.push('');
      });

      this.logger.log(`Converted XLSX: ${workbook.SheetNames.length} sheets`);
      return lines.join('\n');
    } catch (error) {
      this.logger.error(`XLSX conversion failed: ${String(error)}`);
      throw error;
    }
  }

  async docxToText(filePath: string): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      this.logger.log(`Converted DOCX: ${result.value.length} characters`);
      return result.value;
    } catch (error) {
      this.logger.error(`DOCX conversion failed: ${String(error)}`);
      throw error;
    }
  }

  async pdfToText(filePath: string): Promise<string> {
    try {
      const { readFileSync } = await import('fs');
      const buffer = readFileSync(filePath);
      const data = await pdfParse(buffer);
      const text = data.text?.trim() ?? '';
      this.logger.log(
        `Converted PDF: ${data.numpages} pages, ${text.length} characters extracted`,
      );
      return text;
    } catch (error) {
      this.logger.error(`PDF text extraction failed: ${String(error)}`);
      throw error;
    }
  }

  async convertToText(
    filePath: string,
    mimeType: string,
  ): Promise<string | null> {
    switch (mimeType) {
      case 'application/pdf':
        return this.pdfToText(filePath);
      case 'text/csv':
      case 'application/vnd.ms-excel':
        return this.csvToText(filePath);
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return this.xlsxToText(filePath);
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        return this.docxToText(filePath);
      case 'text/plain':
        return this.readTextFile(filePath);
      default:
        return null;
    }
  }

  private async readTextFile(filePath: string): Promise<string> {
    const { readFileSync } = await import('fs');
    return readFileSync(filePath, 'utf-8');
  }
}
