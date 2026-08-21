from typing import List


class QuoteResolver:
    """Propagates previously seen cell values downwards per-column when encountering repeat (ditto) marks."""

    def is_repeat_mark(self, val: str, col_idx: int) -> bool:
        """Determines if a string value represents a repeat (ditto) mark in text columns."""
        clean = val.strip()
        if not clean:
            return False

        # Applicable ONLY to text columns: 0 (From Company), 2 (To Company), 3 (Package Type)
        if col_idx not in (0, 2, 3):
            return False

        text_lower = clean.lower()

        # 1. Standard ditto words, double ticks, and OCR character pairings
        if text_lower in (
            'ditto', 'do', 'do.', '11', '""', "''", 'ii', 'i i', '||', '| |',
            '\\\\', '//', '\\/', '/\\', '!!', '! !', 'll', 'l l', 'tt', 't t',
            '``', '“”', '’’', '""'
        ):
            return True

        # 2. String composed ONLY of ditto-like characters (quotes, ticks, slashes, pipes, I, l, !, etc.) up to 4 chars
        ditto_chars = set('"\'`“”’|\\/!IiLltT1^-.,~')
        if all(c in ditto_chars for c in clean) and len(clean) <= 4:
            return True

        # 3. Single misread punctuation/ditto token in text column
        if clean in ('"', "'", '`', '“', '”', '’', '-', '.', ',', '^', '~', '!', '|') and len(clean) == 1:
            return True

        return False

    def resolve(self, rows: List[List[str]]) -> List[List[str]]:
        """Propagate previous values down for each text column (From Company, To Company, Package Type) independently."""
        if not rows:
            return []

        previous_column_values = [""] * 5
        resolved_rows = []

        for row in rows:
            resolved_row = list(row)

            # Columns to resolve: 0 (From Company), 2 (To Company), 3 (Package Type)
            for col_idx in (0, 2, 3):
                val = resolved_row[col_idx].strip()

                if self.is_repeat_mark(val, col_idx):
                    # Replace ditto mark with previous valid value for this column
                    if previous_column_values[col_idx]:
                        resolved_row[col_idx] = previous_column_values[col_idx]
                elif val != "":
                    # Valid new text value: update tracker for this column
                    previous_column_values[col_idx] = val

            # Keep numeric / non-ditto columns (1: Customer Invoice, 4: Quantity) untouched
            resolved_rows.append(resolved_row)

        return resolved_rows


