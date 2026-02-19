import { env } from '../../config/env.js';
import { ValidationError, PayloadTooLargeError } from '../../shared/errors.js';

export interface ParsedRecord {
  saleDate: string;
  productName: string;
  amount: number;
}

export interface RejectedLine {
  line: number;
  reason: string;
  raw: string;
}

export interface ParseResult {
  records: ParsedRecord[];
  rejected: RejectedLine[];
}

/** Sanitiza texto contra XSS */
function sanitize(str: string): string {
  return str.replace(/[<>"'&]/g, (ch) => {
    const map: Record<string, string> = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;' };
    return map[ch] || ch;
  });
}

/** Faz parsing de CSV de vendas com validação rigorosa */
export function parseCSV(text: string): ParseResult {
  const lines = text.trim().split('\n').map((l) => l.trim()).filter(Boolean);

  if (lines.length < 2) {
    throw new ValidationError('CSV vazio ou sem dados. Necessário header + pelo menos 1 linha.');
  }

  if (lines.length - 1 > env.MAX_CSV_LINES) {
    throw new PayloadTooLargeError(`Máximo de ${env.MAX_CSV_LINES} linhas por upload.`);
  }

  const delimiter = lines[0].includes(';') ? ';' : ',';
  const headerLine = lines[0].toLowerCase();
  const hasHeader =
    headerLine.includes('data') || headerLine.includes('date') ||
    headerLine.includes('produto') || headerLine.includes('product');

  const dataLines = hasHeader ? lines.slice(1) : lines;
  const records: ParsedRecord[] = [];
  const rejected: RejectedLine[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < dataLines.length; i++) {
    const raw = dataLines[i];
    const lineNum = hasHeader ? i + 2 : i + 1;
    const parts = raw.split(delimiter).map((p) => p.trim());

    if (parts.length < 3) {
      rejected.push({ line: lineNum, reason: 'Menos de 3 campos', raw });
      continue;
    }

    const [rawDate, rawProduct, rawValue] = parts;

    // Normalize date
    let saleDate = rawDate;
    const brMatch = rawDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (brMatch) {
      saleDate = `${brMatch[3]}-${brMatch[2].padStart(2, '0')}-${brMatch[1].padStart(2, '0')}`;
    }

    const dateObj = new Date(saleDate + 'T00:00:00');
    if (isNaN(dateObj.getTime())) {
      rejected.push({ line: lineNum, reason: 'Data inválida', raw });
      continue;
    }

    // Product
    const productName = sanitize(rawProduct.trim());
    if (!productName || productName.length > 255) {
      rejected.push({ line: lineNum, reason: 'Produto vazio ou muito longo', raw });
      continue;
    }

    // Amount
    const amount = parseFloat(rawValue.replace(',', '.'));
    if (isNaN(amount) || amount <= 0 || amount > 99999999.99) {
      rejected.push({ line: lineNum, reason: 'Valor inválido (deve ser positivo, máx 99.999.999,99)', raw });
      continue;
    }

    // Dedup within batch
    const key = `${saleDate}|${productName}|${amount}`;
    if (seen.has(key)) {
      rejected.push({ line: lineNum, reason: 'Linha duplicada no mesmo upload', raw });
      continue;
    }
    seen.add(key);

    records.push({
      saleDate,
      productName,
      amount: Math.round(amount * 100) / 100,
    });
  }

  return { records, rejected };
}
