import type { Registration } from '@prisma/client';
import { stringify } from 'csv-stringify/sync';
import ExcelJS from 'exceljs';

const FIXED_KEYS = ['naam', 'voornaam', 'email', 'telefoon', 'instelling', 'functie', 'createdAt'] as const;

function getExtraKeys(registrations: Registration[]): string[] {
  const keys = new Set<string>();
  for (const r of registrations) {
    if (r.extraData && typeof r.extraData === 'object' && !Array.isArray(r.extraData)) {
      Object.keys(r.extraData as object).forEach((k) => keys.add(k));
    }
  }
  return Array.from(keys);
}

function toRow(r: Registration, extraKeys: string[]): Record<string, string> {
  const extra = (r.extraData ?? {}) as Record<string, string>;
  const row: Record<string, string> = {
    naam: r.naam,
    voornaam: r.voornaam,
    email: r.email,
    telefoon: r.telefoon,
    instelling: r.instelling,
    functie: r.functie,
    createdAt: r.createdAt.toISOString(),
  };
  for (const k of extraKeys) {
    row[k] = extra[k] ?? '';
  }
  return row;
}

export async function buildCsvBuffer(registrations: Registration[]): Promise<Buffer> {
  const extraKeys = getExtraKeys(registrations);
  const rows = registrations.map((r) => toRow(r, extraKeys));
  const csv = stringify(rows, { header: true, columns: [...FIXED_KEYS, ...extraKeys] });
  return Buffer.from(csv, 'utf-8');
}

export async function buildExcelBuffer(registrations: Registration[]): Promise<Buffer> {
  const extraKeys = getExtraKeys(registrations);
  const allColumns = [...FIXED_KEYS, ...extraKeys];

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Inschrijvingen');
  sheet.columns = allColumns.map((key) => ({ header: key, key, width: 22 }));

  for (const r of registrations) {
    const row = toRow(r, extraKeys);
    sheet.addRow(row);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
