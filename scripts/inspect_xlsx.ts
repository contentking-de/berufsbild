import path from "node:path";
import fs from "node:fs";
import xlsx from "xlsx";

function main() {
  const [, , fileArg] = process.argv;
  const filePath = fileArg || "V5_Final.xlsx";
  const absolute = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absolute)) {
    console.error(`Datei nicht gefunden: ${absolute}`);
    process.exit(1);
  }
  const wb = xlsx.readFile(absolute);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1 }) as any[][];
  if (!rows.length) {
    console.error("Arbeitsblatt ist leer.");
    process.exit(1);
  }
  const headers = (rows[0] ?? []).map((v) => String(v ?? "").trim());
  console.log(JSON.stringify({ sheetName, headers }, null, 2));
}

main();


