from typing import List, Dict
from .models import OCRRow, OCRItem


class ColumnMapper:
    """Assigns OCRItems in a row into the deterministic 5 table columns using X-coordinates and heuristic rules."""

    def __init__(self):
        # Known centroids for the 5 columns:
        # Col 1: From Company
        # Col 2: Customer Company Invoice Number
        # Col 3: To Company
        # Col 4: Package Type (covers payment status/package type)
        # Col 5: Quantity
        self.centroids = [180.0, 350.0, 540.0, 705.0, 810.0]

    def map_row(self, row: OCRRow) -> List[str]:
        """Map each item in the row to its closest column centroid with heuristic overrides."""
        col_items: Dict[int, List[OCRItem]] = {i: [] for i in range(1, 6)}
        
        # Sort items horizontally (left-to-right) by x_min
        sorted_items = sorted(row.items, key=lambda item: item.box.x_min)

        # Keyword sets for classification overrides
        pkg_keywords = ["box", "bag", "cov", "boy", "bo2", "bx", "pk", "pkg", "cartoon", "crt", "drum", "poly", "bndl", "bor", "can", "mould", "bundle", "cover"]
        pay_keywords = ["bnd", "1p", "ndc", "paid", "to pay", "billing", "bndc", "cen"]

        for idx, item in enumerate(sorted_items):
            x = item.box.x_center
            text_clean = item.text.strip()
            text_lower = text_clean.lower()

            # Find closest centroid (1-based index)
            col_idx = min(range(5), key=lambda i: abs(self.centroids[i] - x)) + 1

            # Rule 1: If it is the last item and is numeric, it belongs in Column 5 (Quantity)
            is_last = (idx == len(sorted_items) - 1)
            is_numeric = text_clean.isdigit() or text_clean.replace('.', '', 1).isdigit()
            if is_last and is_numeric and col_idx < 5:
                col_idx = 5

            # Rule 2: If it is the first item, it belongs in Column 1 (From Company)
            # Except when it is a repeat quote or a clean invoice number
            if idx == 0 and col_idx > 1:
                is_repeat_quote = all(c in ('"', "'", '`', '“', '”') for c in text_clean)
                if not (is_repeat_quote or (is_numeric and len(text_clean) >= 3)):
                    col_idx = 1

            # Rule 3: Package type or payment status keyword overrides mapping to Column 4
            # (In the new 5-column system, Column 4 is Package Type, which encompasses package type and payment status)
            is_pkg_or_pay = any(kw in text_lower for kw in pkg_keywords) or any(kw in text_lower for kw in pay_keywords)
            if is_pkg_or_pay and col_idx != 4:
                # If it's not quantity (or if it is quantity but matches keyword, though quantity is usually just numeric)
                if col_idx in (3, 5) and not is_numeric:
                    col_idx = 4

            col_items[col_idx].append(item)

        # Build final strings for the 5 columns
        columns = []
        for col_idx in range(1, 6):
            items_in_col = col_items[col_idx]
            if items_in_col:
                # Sort items in the same column by x_min to keep reading order left-to-right
                sorted_col_items = sorted(items_in_col, key=lambda item: item.box.x_min)
                columns.append(" ".join(item.text for item in sorted_col_items))
            else:
                columns.append("")

        return columns

    def post_process_rows(self, rows: List[List[str]]) -> List[List[str]]:
        """Applies deterministic cleanup rules to fix merged fields and normalize ditto marks."""
        processed_rows = []
        previous_row_values = [""] * 5

        for r_idx, row in enumerate(rows):
            # Create a copy to avoid mutating original list
            cols = list(row)

            # Rule 1: Invoice Number Extraction (Split Rule)
            # If Column 1 ends with a numeric token (length >= 2) and Column 2 is empty, split it
            col1 = cols[0].strip()
            col2 = cols[1].strip()
            if col1 and not col2:
                tokens = col1.split()
                if len(tokens) > 1:
                    last_token = tokens[-1]
                    if last_token.isdigit() and len(last_token) >= 2:
                        cols[0] = " ".join(tokens[:-1])
                        cols[1] = last_token

            # Rule 2: Trailing Single Character & Quote Stripping
            # Clean up trailing noise in From/To Company columns (but don't touch cells that are only quote marks)
            for col_idx in (0, 2):
                val = cols[col_idx].strip()
                if val:
                    is_only_quotes = all(c in ('"', "'", '`', '“', '”', '’') for c in val)
                    if not is_only_quotes:
                        val = val.rstrip('"`\'“”’')
                        tokens = val.split()
                        if len(tokens) > 1:
                            last_token = tokens[-1]
                            if len(last_token) == 1 and not last_token.isdigit():
                                val = " ".join(tokens[:-1])
                        cols[col_idx] = val.strip()

            # Rule 3: Contextual Ditto Mark Normalization
            # Normalize a single character to `"` ONLY when:
            # - The token is exactly one character.
            # - It appears in the From Company (index 0) or To Company (index 2) column.
            # - The previous row contains a valid value for that same column.
            # - The OCR token is a common ditto misread (punctuation or lowercase letter).
            for col_idx in (0, 2):
                val = cols[col_idx].strip()
                if len(val) == 1:
                    has_prev_value = bool(previous_row_values[col_idx].strip())
                    is_common_misread = (
                        val in ('"', "'", '`', '“', '”', '’', '-', '.', ',') or 
                        (val.islower() and val.isalpha())
                    )
                    if has_prev_value and is_common_misread:
                        cols[col_idx] = '"'

            # Track previous row values to allow context-sensitive ditto detection for the next row
            for col_idx in range(5):
                val = cols[col_idx].strip()
                if val == '"':
                    # Ditto mark: logical value remains the previous row's value
                    pass
                elif val != "":
                    # New valid value: update tracker
                    previous_row_values[col_idx] = val

            processed_rows.append(cols)

        return processed_rows

    def map_rows(self, rows: List[OCRRow]) -> List[List[str]]:
        """Map a list of OCRRows to a 2D list of mapped string values with post-processing."""
        mapped = [self.map_row(row) for row in rows]
        return self.post_process_rows(mapped)
