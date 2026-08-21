import re
from typing import List, Dict
from .models import OCRRow, OCRItem


def normalize_quantity_token(text_clean: str) -> str:
    clean = text_clean.strip()
    if not clean:
        return clean
    # Single vertical strokes, dashes, or common OCR misreads for handwritten "1" in Qty column
    if clean in ('I', 'i', 'l', '|', '!', 'L', '-', '—', '_', '/', '\\', 't', 'r', '.', ',', '~', '?', 'v', 'V', '1'):
        return '1'
    res = clean
    for char in ('I', 'i', 'l', '|', '!', 'L'):
        res = re.sub(r'(?<=[\d*xX×\s])' + re.escape(char) + r'(?=[\d*xX×\s]|$)', '1', res)
        res = re.sub(r'^' + re.escape(char) + r'(?=[\d*xX×\s])', '1', res)
    return res


def evaluate_quantity_expression(qty_str: str) -> str:
    """Evaluates quantity expressions like '10 x 1', '25 x 4', '1 x 5', '1' into integer string ('10', '100', '5', '1')."""
    clean = qty_str.strip()
    if not clean:
        return "1"
    norm = normalize_quantity_token(clean)

    # 1. Multiplication expressions: "10 x 1", "25 x 4", "1 x 5", "8 x 1", "1x20", "2*5", "10 × 1"
    if re.match(r'^\d+(?:\s*[xX*×]\s*\d+)+$', norm):
        numbers = [int(n) for n in re.findall(r'\d+', norm)]
        if numbers and all(n > 0 for n in numbers):
            product = 1
            for n in numbers:
                product *= n
            return str(product)

    # 2. Pure integer quantity: "18", "5", "1", "11", "7", etc.
    if norm.isdigit():
        val = int(norm)
        if val > 0:
            return str(val)

    # 3. Single stroke misreads that became a non-digit symbol (e.g. "-", "—", "_", "/", "\", "t", "r")
    if norm in ('-', '—', '_', '/', '\\', 't', 'r', '|', 'l', 'I', '!', 'i', 'L', '.', ',', '~', '?', 'v', 'V'):
        return "1"

    # 4. Decimal format: "10.0" -> "10"
    try:
        fval = float(norm)
        if fval > 0 and fval.is_integer():
            return str(int(fval))
    except ValueError:
        pass

    return norm if norm else "1"


class ColumnMapper:
    """Assigns OCRItems in a row into the deterministic 5 table columns using X-coordinates and heuristic rules."""

    def __init__(self, page_width: float = 900.0):
        # Base reference centroids for 900px wide reference image:
        # Col 1: From Company (~180px)
        # Col 2: Customer Company Invoice Number (~350px)
        # Col 3: To Company (~540px)
        # Col 4: Package Type (~705px)
        # Col 5: Quantity (~810px)
        self.default_centroids = [180.0, 350.0, 540.0, 705.0, 810.0]
        self.relative_ratios = [c / 900.0 for c in self.default_centroids]
        self.centroids = list(self.default_centroids)

    def update_centroids_for_width(self, width: float):
        """Dynamically scale column centroids based on actual detected document width."""
        if width > 100:
            self.centroids = [r * width for r in self.relative_ratios]

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

            # Normalize common OCR/handwriting misreads for quantity ('I', 'l', '|', '!', 'L' -> '1')
            norm_qty_text = normalize_quantity_token(text_clean)

            # Find closest centroid (1-based index)
            col_idx = min(range(5), key=lambda i: abs(self.centroids[i] - x)) + 1

            # Rule 1: If it is the last item and is numeric (or single stroke quantity token), it belongs in Column 5 (Quantity)
            is_last = (idx == len(sorted_items) - 1)
            is_numeric = (
                norm_qty_text.isdigit() or 
                norm_qty_text.replace('.', '', 1).isdigit() or 
                bool(re.match(r'^\d+(?:\s*[xX*×]\s*\d+)*$', norm_qty_text)) or
                norm_qty_text in ('1', '-', '—', '_', '|', 'l', 'I', '!', '/', '\\', 't', 'r', 'i', 'L')
            )
            if is_last and is_numeric and col_idx < 5:
                col_idx = 5

            # Rule 2: If it is the first item, it belongs in Column 1 (From Company)
            # Except when it is a repeat quote or a clean invoice number
            if idx == 0 and col_idx > 1:
                is_repeat_quote = all(c in ('"', "'", '`', '“', '”') for c in text_clean)
                if not (is_repeat_quote or (is_numeric and len(text_clean) >= 3)):
                    col_idx = 1

            # Rule 3: Package type or payment status keyword overrides mapping to Column 4
            is_pkg_or_pay = any(kw in text_lower for kw in pkg_keywords) or any(kw in text_lower for kw in pay_keywords)
            if is_pkg_or_pay and col_idx != 4:
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
                col_text = " ".join(item.text for item in sorted_col_items)
                if col_idx == 5:
                    col_text = evaluate_quantity_expression(col_text)
                columns.append(col_text)
            else:
                columns.append("")

        return columns

    def post_process_rows(self, rows: List[List[str]]) -> List[List[str]]:
        """Applies deterministic cleanup rules to fix merged fields, column shifts, and normalize ditto marks."""
        processed_rows = []
        previous_row_values = [""] * 5

        pkg_keywords = ["box", "bag", "cov", "boy", "bo2", "bx", "pk", "pkg", "cartoon", "crt", "drum", "poly", "bndl", "bor", "can", "mould", "bundle", "cover"]

        for r_idx, row in enumerate(rows):
            cols = list(row)

            col1 = cols[0].strip()
            col2 = cols[1].strip()
            col3 = cols[2].strip()
            col4 = cols[3].strip()
            col5 = cols[4].strip()

            # Rule 1: Invoice Number & To Company Column Separation in Column 2
            # If Column 2 has "123 City Shoes", "1284 Leap Step", "W/O P2 Footwear", etc.,
            # extract the invoice number to Column 2 and push the company name to Column 3.
            if col2:
                # Pattern A: Invoice token at start followed by company text (e.g. "123 City Shoes", "W/O P2 Footwear")
                inv_match = re.match(r'^(?P<inv>\d+|[Ww]/[Oo])\s+(?P<to_comp>.+)$', col2)
                if inv_match:
                    col2 = inv_match.group("inv").strip()
                    extracted_to = inv_match.group("to_comp").strip()
                    col3 = f"{extracted_to} {col3}".strip() if col3 else extracted_to

                # Pattern B: Pure alphabetic text in Col 2 (no digits or W/O) -> belongs in Col 3 (To Company)
                elif not (re.search(r'\d+', col2) or re.search(r'[Ww]/[Oo]', col2)):
                    if not col3:
                        col3 = col2
                    else:
                        col3 = f"{col2} {col3}".strip()
                    col2 = ""

            # Rule 2: Invoice Number Extraction from Column 1 (From Company)
            # If Column 1 ends with an invoice number (e.g. "Sana Corp 123") and Column 2 is empty, split it
            if col1 and not col2:
                col1_inv_match = re.match(r'^(?P<from_comp>.+?)\s+(?P<inv>\d{2,}|[Ww]/[Oo])$', col1)
                if col1_inv_match:
                    col1 = col1_inv_match.group("from_comp").strip()
                    col2 = col1_inv_match.group("inv").strip()

            # Rule 3: Package Type Separation between Column 3 and Column 4
            # If Column 3 ends with a package type keyword (e.g. "City Shoes Carton") and Column 4 is empty
            if col3 and not col4:
                tokens = col3.split()
                if len(tokens) > 1:
                    last_token_lower = tokens[-1].lower()
                    if any(kw in last_token_lower for kw in pkg_keywords):
                        col3 = " ".join(tokens[:-1]).strip()
                        col4 = tokens[-1].strip()

            # If Column 4 starts with company name before package keyword (e.g. "City Shoes Carton")
            if col4:
                tokens = col4.split()
                if len(tokens) > 1:
                    last_token_lower = tokens[-1].lower()
                    if any(kw in last_token_lower for kw in pkg_keywords):
                        extracted_comp = " ".join(tokens[:-1]).strip()
                        col3 = f"{col3} {extracted_comp}".strip() if col3 else extracted_comp
                        col4 = tokens[-1].strip()

            # Rule 4: Quantity Expression Normalization & Single-Stroke "1" Fallback for Column 5
            # If Column 4 ends with a quantity token (e.g. "Cover 1", "Box 1", "Bundle 1") and Column 5 is empty
            if col4 and not col5:
                tokens = col4.split()
                if len(tokens) > 1:
                    last_tok = tokens[-1].strip()
                    norm_last = normalize_quantity_token(last_tok)
                    if norm_last.isdigit() or norm_last in ('1', '-', '—', '_', '|', 'l', 'I', '!', '/', '\\', 't', 'r'):
                        col4 = " ".join(tokens[:-1]).strip()
                        col5 = evaluate_quantity_expression(last_tok)

            if not col5 and (col1 or col2 or col3 or col4):
                col5 = "1"
            else:
                col5 = evaluate_quantity_expression(col5)

            # Rule 5: Trailing Single Character & Quote Stripping
            # Clean up trailing noise in From/To Company columns (but don't touch cells that are only quote marks)
            for c_idx, val_str in ((0, col1), (2, col3)):
                val = val_str.strip()
                if val:
                    is_only_quotes = all(c in ('"', "'", '`', '“', '”', '’') for c in val)
                    if not is_only_quotes:
                        val = val.rstrip('"`\'“”’')
                        tokens = val.split()
                        if len(tokens) > 1:
                            last_token = tokens[-1]
                            if len(last_token) == 1 and not last_token.isdigit():
                                val = " ".join(tokens[:-1])
                        val = val.strip()
                if c_idx == 0:
                    col1 = val
                else:
                    col3 = val

            # Rule 6: Contextual Ditto Mark Normalization
            # Normalize a single character to `"` ONLY when:
            # - The token is exactly one character.
            # - It appears in the From Company (index 0) or To Company (index 2) column.
            # - The previous row contains a valid value for that same column.
            for c_idx, val_str in ((0, col1), (2, col3)):
                val = val_str.strip()
                if len(val) == 1:
                    has_prev_value = bool(previous_row_values[c_idx].strip())
                    is_common_misread = (
                        val in ('"', "'", '`', '“', '”', '’', '-', '.', ',') or 
                        (val.islower() and val.isalpha())
                    )
                    if has_prev_value and is_common_misread:
                        if c_idx == 0:
                            col1 = '"'
                        else:
                            col3 = '"'

            cols = [col1, col2, col3, col4, col5]

            # Track previous row values to allow context-sensitive ditto detection for the next row
            for col_idx in range(5):
                val = cols[col_idx].strip()
                if val == '"':
                    pass
                elif val != "":
                    previous_row_values[col_idx] = val

            processed_rows.append(cols)

        return processed_rows


    def map_rows(self, rows: List[OCRRow]) -> List[List[str]]:
        """Map a list of OCRRows to a 2D list of mapped string values with post-processing."""
        all_items = [item for r in rows for item in r.items]
        if all_items:
            max_x = max(item.box.x_max for item in all_items)
            self.update_centroids_for_width(max_x)

        mapped = [self.map_row(row) for row in rows]
        return self.post_process_rows(mapped)

