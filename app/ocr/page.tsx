// import type { Metadata } from "next";
import OCRPageClient from "@/components/ocr/OCRPageClient";

// export const metadata: Metadata = {
//   title: "OCR Register Scanner | TMS Transport OS",
//   description:
//     "Automated OCR register sheet scanning, review, and batch Excel shipment ingestion.",
// };

export default function OCRPage() {
  return <OCRPageClient />;
}
