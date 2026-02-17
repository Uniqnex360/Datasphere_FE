// ExcelHelper.ts
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

interface ExportOptions {
  data: any[]; // array of objects (your template)
  fileName: string;
  dropdowns?: Record<string, string[]>; // columnName => dropdown options
}

export const exportToExcel = async ({ data, fileName, dropdowns }: ExportOptions) => {
  // 1️⃣ Safety check
  if (!data || !Array.isArray(data) || data.length === 0 || !data[0]) {
    console.error("No data to export");
    return;
  }

  // 2️⃣ Create workbook & sheet
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sheet1");

  // 3️⃣ Add headers
  const headers = Object.keys(data[0]);
  sheet.addRow(headers);

  // 4️⃣ Add data rows
  data.forEach((row) => {
    const rowData = headers.map((h) => row[h] ?? "");
    sheet.addRow(rowData);
  });

  // 5️⃣ Add dropdowns (if provided)
  if (dropdowns) {
    headers.forEach((header, colIndex) => {
      const options = dropdowns[header];
      if (options) {
        for (let rowIndex = 2; rowIndex <= data.length + 1; rowIndex++) {
          sheet.getCell(rowIndex, colIndex + 1).dataValidation = {
            type: "list",
            allowBlank: true,
            formulae: [`"${options.join(",")}"`],
            showErrorMessage: true,
            errorTitle: "Invalid Option",
            error: `Please select a value from the dropdown`,
          };
        }
      }
    });
  }

  // 6️⃣ Generate Excel file and trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/octet-stream" });
  saveAs(blob, fileName);
};
