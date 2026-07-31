import string
from typing import List
from .models import OCRRow


def safe_str(s: str) -> str:
    """Sanitize string for safe printing in cp1252/Windows terminals."""
    return "".join(c if ord(c) < 128 else '?' for c in s)


class RowFilter:
    """Filters out header metadata, footers, and noise rows from the grouped OCR rows."""

    def _get_header_y_limit(self, rows: List[OCRRow]) -> float:
        """Find the maximum y_max of header elements in the top 35% of the page.

        Adds a vertical buffer of 50px to filter out routing/branch headers.
        """
        all_y_max = [item.box.y_max for r in rows for item in r.items]
        page_height = max(all_y_max) if all_y_max else 1000.0
        header_height_threshold = page_height * 0.35

        header_keywords = [
            "date", "vehicle", "branch", "invoice number", "inv no", 
            "vehicle no", "total", "grand total", "signature", "checked by", 
            "prepared by", "office copy", "lorry", "driver", "bill no", 
            "consignee copy", "loading", "unloading", "challan"
        ]

        header_y_limit = 0.0
        for row in rows:
            if row.y_min < header_height_threshold:
                row_text_lower = " ".join(item.text for item in row.items).lower()
                if any(kw in row_text_lower for kw in header_keywords):
                    header_y_limit = max(header_y_limit, row.y_max + 50.0)

        return header_y_limit

    def _get_noise_reason(self, row: OCRRow) -> str:
        """Check if a row is garbage/noise and return the reason. Empty string if valid."""
        cleaned = [item.text.strip() for item in row.items if item.text.strip()]

        if len(cleaned) <= 1:
            return "contains 1 or fewer valid items"

        # Check if all items are numeric or noise
        all_numbers_or_noise = True
        for text in cleaned:
            is_numeric = text.isdigit() or text.replace('.', '', 1).isdigit()
            is_noise = all(
                c in string.punctuation or c.isspace() or not c.isalnum()
                for c in text
            )
            if not (is_numeric or is_noise or text in ('"', "'", '`', '“', '”')):
                all_numbers_or_noise = False
                break

        if all_numbers_or_noise:
            return "contains only numbers, symbols, or punctuation"

        # Check for single-character garbage
        valid_items_count = 0
        for text in cleaned:
            if text in ('"', "'", '`', '“', '”'):
                valid_items_count += 1
                continue

            is_noise = all(
                c in string.punctuation or c.isspace() or not c.isalnum()
                for c in text
            )
            if is_noise:
                continue

            if len(text) == 1:
                # Accept single digits or words 'I'/'A'
                if not (text.isdigit() or text.lower() in ("i", "a")):
                    continue

            valid_items_count += 1

        if valid_items_count <= 1:
            return "contains only single-character noise or symbols"

        return ""

    def filter_rows(self, rows: List[OCRRow]) -> List[OCRRow]:
        """Filter out header, footer, and noise rows, printing detailed debug logs."""
        print("\n--- Preprocessing Stage: Row Filtering Debug ---")
        print(f"Initial rows from Row Grouper: {len(rows)}")
        
        header_y_limit = self._get_header_y_limit(rows)
        print(f"Detected Header Y boundary limit (including buffer): {header_y_limit:.1f}")
        
        filtered_rows = []
        for idx, row in enumerate(rows, start=1):
            row_y_center = (row.y_min + row.y_max) / 2.0
            row_text = " | ".join(item.text for item in row.items)
            
            # Check header boundary filter
            if row_y_center < header_y_limit:
                print(f"[REMOVED] Row {idx:02d}: Above header boundary (y_center={row_y_center:.1f} < limit={header_y_limit:.1f}) | Text: '{safe_str(row_text)}'")
                continue
                
            # Check noise filters
            noise_reason = self._get_noise_reason(row)
            if noise_reason:
                print(f"[REMOVED] Row {idx:02d}: Noise row ({noise_reason}) | Text: '{safe_str(row_text)}'")
                continue
                
            # Keep row
            filtered_rows.append(row)
            
        print(f"Rows remaining after Header & Noise Filters: {len(filtered_rows)}")
        print("------------------------------------------------\n")
        return filtered_rows
