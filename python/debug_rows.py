from paddleocr import PaddleOCR
import sys
from ocr import PaddleOCRParser, RowGrouper

def safe_str(s: str) -> str:
    return "".join(c if ord(c) < 128 else '?' for c in s)

def main():
    # Initialize PaddleOCR
    ocr = PaddleOCR(
        use_doc_orientation_classify=False,
        use_doc_unwarping=False,
        use_textline_orientation=False,
        lang="en",
    )

    image_path = "python/input/sample.jpg"
    result = ocr.predict(image_path)
    page = result[0]

    # Parse items
    ocr_items = PaddleOCRParser.parse_page(page)

    # Group items
    grouper = RowGrouper(overlap_threshold=0.5)
    rows = grouper.group_items(ocr_items)

    print("=========================================================")
    print("                OCR ITEM ROW GROUPING DEBUG              ")
    print("=========================================================")
    for row_idx, row in enumerate(rows, start=1):
        print(f"\n--- Row {row_idx:02d} (y_min: {row.y_min:.1f}, y_max: {row.y_max:.1f}) ---")
        for item in row.items:
            clean_text = safe_str(item.text)
            print(f"  Text: {clean_text:<25} | Box: [{item.box.x_min:.1f}, {item.box.y_min:.1f}, {item.box.x_max:.1f}, {item.box.y_max:.1f}] | Y Center: {item.box.y_center:.1f}")
    print("=========================================================")

if __name__ == "__main__":
    main()
