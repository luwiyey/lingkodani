import * as XLSX from "xlsx";

const SPREADSHEET_EXTENSIONS = new Set(["xls", "xlsx"]);

export function isSpreadsheetExtension(extension: string) {
  return SPREADSHEET_EXTENSIONS.has(extension.toLowerCase());
}

export async function readSpreadsheetAsCsv(file: File) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const [firstSheetName] = workbook.SheetNames;

  if (!firstSheetName) {
    throw new Error("Walang worksheet na nakita sa Excel file.");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const csv = XLSX.utils.sheet_to_csv(worksheet);

  if (!csv.trim()) {
    throw new Error("Walang mabasang laman sa unang worksheet ng Excel file.");
  }

  return csv;
}
