/**
 * Lightweight GS1 Application Identifier parser for QR / DataMatrix codes.
 *
 * Supports the AIs most commonly found on retail product codes:
 *   (01) GTIN        - 14 digit
 *   (10) BATCH/LOT   - variable length up to 20 chars
 *   (17) EXPIRY      - YYMMDD
 *   (11) PROD DATE   - YYMMDD
 *   (21) SERIAL      - variable length up to 20 chars
 *
 * Accepts codes with parentheses (`(01)12345…`) and raw FNC1-delimited
 * codes (`\u001D` or `]` as group separator).
 */

export interface GS1Data {
  gtin?: string;
  batchLot?: string;
  expiryDate?: string;
  productionDate?: string;
  serialNumber?: string;
  raw: string;
}

const FNC1_CHARS = /[\u001D\u001E]/g;

function parseYYMMDD(s: string): string | undefined {
  if (s.length !== 6 || !/^\d{6}$/.test(s)) return undefined;
  const yy = s.slice(0, 2);
  const mm = s.slice(2, 4);
  const dd = s.slice(4, 6);
  const mi = Number(mm);
  const di = Number(dd);
  if (mi < 1 || mi > 12 || di < 0 || di > 31) return undefined;
  const yyNum = Number(yy);
  const century = yyNum >= 50 ? 19 : 20;
  return `${century}${yy}-${mm}-${dd === '00' ? '01' : dd}`;
}

export function parseGS1(raw: string): GS1Data {
  if (!raw) return { raw: '' };
  const result: GS1Data = { raw };
  const paren = raw.replace(FNC1_CHARS, '');

  if (/\(\d{2,4}\)/.test(paren)) {
    const gtin = paren.match(/\(01\)(\d{14})/);
    if (gtin) result.gtin = gtin[1];
    const batch = paren.match(/\(10\)([^()]+?)(?=\(|$)/);
    if (batch) result.batchLot = batch[1].trim();
    const exp = paren.match(/\(17\)(\d{6})/);
    if (exp) result.expiryDate = parseYYMMDD(exp[1]);
    const prod = paren.match(/\(11\)(\d{6})/);
    if (prod) result.productionDate = parseYYMMDD(prod[1]);
    const serial = paren.match(/\(21\)([^()]+?)(?=\(|$)/);
    if (serial) result.serialNumber = serial[1].trim();
    return result;
  }

  // Raw FNC1-delimited path. Walk through known AIs.
  let i = 0;
  const groupSep = raw.indexOf('\u001D') >= 0 ? '\u001D' : '';
  while (i < raw.length) {
    const ai2 = raw.slice(i, i + 2);
    const ai4 = raw.slice(i, i + 4);

    if (ai2 === '01' && raw.length >= i + 16) {
      result.gtin = raw.slice(i + 2, i + 16);
      i += 16;
      continue;
    }
    if (ai2 === '17' && raw.length >= i + 8) {
      result.expiryDate = parseYYMMDD(raw.slice(i + 2, i + 8));
      i += 8;
      continue;
    }
    if (ai2 === '11' && raw.length >= i + 8) {
      result.productionDate = parseYYMMDD(raw.slice(i + 2, i + 8));
      i += 8;
      continue;
    }
    if (ai2 === '10' || ai2 === '21') {
      const rest = raw.slice(i + 2);
      const end = groupSep ? rest.indexOf(groupSep) : -1;
      const value = (end === -1 ? rest : rest.slice(0, end)).slice(0, 20).trim();
      if (ai2 === '10') result.batchLot = value;
      else result.serialNumber = value;
      i += 2 + value.length + (end === -1 ? 0 : 1);
      continue;
    }
    // Unknown AI — bail out, leave raw.
    void ai4;
    break;
  }

  return result;
}

export function isGS1Payload(raw: string): boolean {
  if (!raw) return false;
  return /\(01\)\d{14}/.test(raw) || /\(10\)|\(17\)|\(21\)/.test(raw) || /^\d{16,}/.test(raw.replace(FNC1_CHARS, ''));
}

export function isExpired(expiryDate?: string | null): boolean {
  if (!expiryDate) return false;
  const d = new Date(expiryDate);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
}

export function isExpiringSoon(expiryDate?: string | null, days = 30): boolean {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  if (Number.isNaN(expiry.getTime())) return false;
  const now = Date.now();
  const soon = now + days * 24 * 60 * 60 * 1000;
  return expiry.getTime() >= now && expiry.getTime() < soon;
}

export function formatGS1Date(iso?: string | null): string {
  if (!iso) return 'Not available';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Not available';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}
