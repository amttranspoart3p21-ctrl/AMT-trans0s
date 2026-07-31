from typing import List


class QuoteResolver:
    """Propagates previously seen cell values downwards when encountering repeat (ditto) marks."""

    def is_repeat_mark(self, val: str) -> bool:
        clean = val.strip()
        if not clean:
            return False
        
        # Check if it consists only of quote-like characters
        # e.g., ", '', “, ”, `, etc.
        is_quote_chars = all(c in ('"', "'", '`', '“', '”', '’') for c in clean)
        
        # Also accept 'ditto' or 'do' variations
        is_ditto_word = clean.lower() in ('ditto', 'do')
        
        return is_quote_chars or is_ditto_word

    def resolve(self, rows: List[List[str]]) -> List[List[str]]:
        """Propagate previous values down for each column when repeat marks are detected."""
        if not rows:
            return []

        previous_column_values = [""] * 5
        resolved_rows = []

        for row in rows:
            # Create a copy to prevent mutating the original row list
            resolved_row = list(row)
            for col_idx in range(5):
                val = resolved_row[col_idx]
                if self.is_repeat_mark(val):
                    # Replace ditto mark with the last valid value in this column
                    resolved_row[col_idx] = previous_column_values[col_idx]
                elif val.strip() != "":
                    # Track this as the new last valid value for this column
                    previous_column_values[col_idx] = val
            resolved_rows.append(resolved_row)

        return resolved_rows
