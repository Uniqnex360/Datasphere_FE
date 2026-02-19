import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

interface ExportOptions {
  data: any[];
  fileName: string;
  columns: { header: string; key: string }[]; // NEW: specify headers & keys
  dropdowns?: Record<string, string[]>;
}

// 🔹 Updated function
export const exportToExcel = async ({
  data,
  fileName,
  columns,
  dropdowns,
}: ExportOptions) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.error("No data to export");
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sheet1");

  // 1️⃣ Add header row
  const headerRow = sheet.addRow(columns.map((c) => c.header));
  headerRow.font = { bold: true };

  // 2️⃣ Add data rows
  data.forEach((row) => {
    const rowData = columns.map((col) => {
      const value = row[col.key];
      return value && typeof value === "object"
        ? JSON.stringify(value)
        : (value ?? "");
    });
    sheet.addRow(rowData);
  });

  // 3️⃣ Add dropdowns
  if (dropdowns) {
    columns.forEach((col, colIndex) => {
      const options = dropdowns[col.key];
      if (options && options.length) {
        for (let rowIndex = 2; rowIndex <= data.length + 1; rowIndex++) {
          sheet.getCell(rowIndex, colIndex + 1).dataValidation = {
            type: "list",
            allowBlank: true,
            formulae: [`"${options.join(",")}"`],
            showErrorMessage: true,
            errorTitle: "Invalid Option",
            error: "Please select a value from the dropdown",
          };
        }
      }
    });
  }

  // 4️⃣ Auto width columns
  sheet.columns.forEach((col) => {
    let maxLength = 10;
    col.eachCell({ includeEmpty: true }, (cell) => {
      const cellValue = cell.value ? cell.value.toString() : "";
      maxLength = Math.max(maxLength, cellValue.length + 2);
    });
    col.width = maxLength;
  });

  // 5️⃣ Freeze header row
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  // 6️⃣ Generate file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, fileName);
};
