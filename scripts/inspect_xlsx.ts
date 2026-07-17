import path from "node:path";
import fs from "node:fs";
import ExcelJS from "exceljs";

async function main() {
  const [, , fileArg] = process.argv;
  const filePath = fileArg || "V5_Final.xlsx";
  const absolute = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absolute)) {
    console.error(`Datei nicht gefunden: ${absolute}`);
    process.exit(1);
  }
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(absolute);
  const ws = workbook.worksheets[0];
  if (!ws || ws.rowCount === 0) {
    console.error("Arbeitsblatt ist leer.");
    process.exit(1);
  }
  const headers: string[] = [];
  ws.getRow(1).eachCell((cell) => {
    headers.push(String(cell.text ?? "").trim());
  });
  console.log(JSON.stringify({ sheetName: ws.name, headers }, null, 2));
}

main();


