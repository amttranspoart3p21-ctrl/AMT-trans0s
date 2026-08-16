import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import fs from "fs";

export async function POST(request: Request) {
  return new Promise<NextResponse>((resolve) => {
    let filename = "sample.jpg";

    const processOCR = (resolvedFilename: string) => {
      let pythonPath = path.join(process.cwd(), "python", "venv", "Scripts", "python.exe");
      if (!fs.existsSync(pythonPath)) {
        // Fallback to system python if venv does not exist
        pythonPath = "python";
      }
      const scriptPath = path.join(process.cwd(), "python", "main.py");
      
      const storageDir = path.join(process.cwd(), "storage", "images");
      const imagePath = path.join(storageDir, resolvedFilename);

      // Safety fallback: if target image doesn't exist in storage but exists in python/input, copy it over
      if (!fs.existsSync(imagePath)) {
        const fallbackSrc = path.join(process.cwd(), "python", "input", resolvedFilename);
        if (fs.existsSync(fallbackSrc)) {
          if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
          }
          fs.copyFileSync(fallbackSrc, imagePath);
          console.log(`Copied fallback image from python/input to storage/images: ${resolvedFilename}`);
        } else {
          resolve(
            NextResponse.json(
              { error: `Target image file '${resolvedFilename}' was not found in storage.` },
              { status: 400 }
            )
          );
          return;
        }
      }

      console.log(`Executing python pipeline: "${pythonPath}" "${scriptPath}" "${imagePath}"`);

      exec(`"${pythonPath}" "${scriptPath}" "${imagePath}"`, (error, stdout, stderr) => {
        if (error) {
          console.error("Exec error:", error);
          console.error("Stderr:", stderr);
          resolve(
            NextResponse.json(
              { error: `OCR pipeline execution failed: ${error.message}` },
              { status: 500 }
            )
          );
          return;
        }

        // Find the JSON response block in stdout
        const markerStart = "FINAL PREVIEW JSON RESPONSE";
        const startIdx = stdout.indexOf(markerStart);
        if (startIdx === -1) {
          console.error("Could not find marker in output:", stdout);
          resolve(
            NextResponse.json(
              { error: "Could not locate JSON response marker in OCR execution logs." },
              { status: 500 }
            )
          );
          return;
        }

        const jsonStart = stdout.indexOf("{", startIdx);
        const jsonEnd = stdout.lastIndexOf("}");
        if (jsonStart === -1 || jsonEnd === -1) {
          resolve(
            NextResponse.json(
              { error: "OCR output completed but JSON formatting was missing or corrupted." },
              { status: 500 }
            )
          );
          return;
        }

        const jsonStr = stdout.substring(jsonStart, jsonEnd + 1);
        try {
          const data = JSON.parse(jsonStr);
          resolve(NextResponse.json(data));
        } catch (parseError: any) {
          console.error("JSON parsing error:", parseError);
          console.error("Corrupted JSON block:", jsonStr);
          resolve(
            NextResponse.json(
              { error: `Failed to parse structured JSON from OCR: ${parseError.message}` },
              { status: 500 }
            )
          );
          return;
        }
      });
    };

    // Attempt to read JSON body
    request.json()
      .then((body) => {
        if (body && body.filename) {
          filename = body.filename;
        }
        processOCR(filename);
      })
      .catch(() => {
        // Fallback if no body or empty body
        processOCR(filename);
      });
  });
}
