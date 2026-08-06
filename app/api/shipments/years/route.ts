import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const excelPath = path.join(process.cwd(), "storage", "excel");
    if (!fs.existsSync(excelPath)) {
      return NextResponse.json({ success: true, years: [] });
    }

    const dirs = fs.readdirSync(excelPath, { withFileTypes: true });
    const years = dirs
      .filter((dirent) => dirent.isDirectory() && /^\d{4}$/.test(dirent.name))
      .map((dirent) => parseInt(dirent.name, 10))
      .sort((a, b) => a - b);

    return NextResponse.json({ success: true, years });
  } catch (err: any) {
    console.error("Error fetching years:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
