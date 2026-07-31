import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Set up project storage path for images
    const storageImagesDir = path.join(process.cwd(), "storage", "images");
    if (!fs.existsSync(storageImagesDir)) {
      fs.mkdirSync(storageImagesDir, { recursive: true });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a unique filename
    const uniqueFilename = `${Date.now()}-${file.name}`;
    const filePath = path.join(storageImagesDir, uniqueFilename);

    fs.writeFileSync(filePath, buffer);
    console.log(`Saved uploaded image to storage architecture: ${filePath}`);

    return NextResponse.json({
      success: true,
      filename: uniqueFilename,
    });
  } catch (error: any) {
    console.error("Upload handler error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
