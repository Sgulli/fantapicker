export const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const XLSX_ACCEPT = `.xlsx,${XLSX_MIME}`;

export function isXlsx(filename: string, mimetype: string): boolean {
  return filename.toLowerCase().endsWith(".xlsx") || mimetype === XLSX_MIME;
}
