import * as XLSX from "xlsx";

type RowData = Record<string, any>;

export function parseFile(data: ArrayBuffer): RowData[] {
  const workbook = XLSX.read(data, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  return XLSX.utils.sheet_to_json<RowData>(worksheet);
}