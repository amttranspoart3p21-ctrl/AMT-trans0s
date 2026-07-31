from typing import List
from .models import OCRItem, OCRRow


class RowGrouper:
    """Groups flat list of OCRItems into sorted horizontal rows.

    Implements a layout grouping algorithm using vertical overlaps of bounding
    boxes, sorting rows from top-to-bottom and items within rows from left-to-right.
    """

    def __init__(self, overlap_threshold: float = 0.5):
        """Initialize the RowGrouper.

        Args:
            overlap_threshold: The minimum vertical overlap ratio (0.0 to 1.0)
                               required to group an item into an existing row.
                               Defaults to 0.5 (50% overlap).
        """
        self.overlap_threshold = overlap_threshold

    def group_items(self, items: List[OCRItem]) -> List[OCRRow]:
        """Group a flat list of OCRItems into a list of OCRRow instances.

        This algorithm:
        1. Sorts items by their vertical center (y_center) to process top-to-bottom.
        2. Assigns each item to the best-matching existing row based on vertical overlap.
        3. Creates a new row if no existing row has overlap exceeding the threshold.
        4. Sorts the final rows vertically.
        5. Sorts items within each row horizontally (by x_min).

        Args:
            items: A flat list of OCRItem instances to group.

        Returns:
            A list of grouped OCRRow instances sorted from top to bottom.
        """
        if not items:
            return []

        # Step 1: Sort items by vertical center to process them top-to-bottom
        sorted_items = sorted(items, key=lambda x: x.box.y_center)

        rows: List[OCRRow] = []

        # Step 2: Assign items to rows
        for item in sorted_items:
            best_row = None
            best_overlap = -1.0

            # Find the existing row with the highest overlap ratio above threshold
            for row in rows:
                overlap = row.get_overlap_ratio(item)
                if overlap > self.overlap_threshold and overlap > best_overlap:
                    best_overlap = overlap
                    best_row = row

            if best_row is not None:
                # Add item to the best matching row (extends row's vertical bounds)
                best_row.add_item(item)
            else:
                # Create a new row starting with this item
                rows.append(OCRRow(items=[item]))

        # Step 3: Sort the rows themselves vertically by their y_min to guarantee order
        rows = sorted(rows, key=lambda r: r.y_min)

        # Step 4: Sort items within each row horizontally (left-to-right) by x_min
        for row in rows:
            row.items = sorted(row.items, key=lambda x: x.box.x_min)

        return rows
