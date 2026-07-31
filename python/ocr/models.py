from dataclasses import dataclass, field
from typing import List


@dataclass
class BoundingBox:
    """Represents a 2D bounding box coordinate structure.

     PaddleOCR returns bounding boxes in [x_min, y_min, x_max, y_max] format.
    """
    x_min: float
    y_min: float
    x_max: float
    y_max: float

    @property
    def height(self) -> float:
        """Calculate the height of the bounding box."""
        return self.y_max - self.y_min

    @property
    def width(self) -> float:
        """Calculate the width of the bounding box."""
        return self.x_max - self.x_min

    @property
    def y_center(self) -> float:
        """Calculate the vertical center of the bounding box."""
        return (self.y_min + self.y_max) / 2.0

    @property
    def x_center(self) -> float:
        """Calculate the horizontal center of the bounding box."""
        return (self.x_min + self.x_max) / 2.0

    def to_list(self) -> List[float]:
        """Convert the bounding box to a list format [x_min, y_min, x_max, y_max]."""
        return [self.x_min, self.y_min, self.x_max, self.y_max]


@dataclass
class OCRItem:
    """Represents a single OCR text detection element with its bounding box and score."""
    text: str
    box: BoundingBox
    score: float


@dataclass
class OCRRow:
    """Represents a dynamically grouped row of OCRItem elements.

    Handles vertical alignment calculations to evaluate row overlap dynamically.
    """
    items: List[OCRItem] = field(default_factory=list)

    @property
    def y_min(self) -> float:
        """Get the absolute minimum y_min of all items in the row."""
        return min(item.box.y_min for item in self.items) if self.items else 0.0

    @property
    def y_max(self) -> float:
        """Get the absolute maximum y_max of all items in the row."""
        return max(item.box.y_max for item in self.items) if self.items else 0.0

    @property
    def height(self) -> float:
        """Calculate the height of the row's bounding box range."""
        return self.y_max - self.y_min

    def get_overlap_ratio(self, item: OCRItem) -> float:
        """Calculate the vertical overlap ratio of the given item with this row.

        Uses the average vertical range of the row's items to prevent drift.
        The ratio is computed as: overlap_height / min(avg_row_height, item_height).
        """
        if not self.items:
            return 0.0

        # Calculate the average vertical range of the current items in this row
        avg_y_min = sum(i.box.y_min for i in self.items) / len(self.items)
        avg_y_max = sum(i.box.y_max for i in self.items) / len(self.items)

        overlap_min = max(avg_y_min, item.box.y_min)
        overlap_max = min(avg_y_max, item.box.y_max)
        overlap_height = overlap_max - overlap_min

        if overlap_height <= 0:
            return 0.0

        item_height = item.box.height
        avg_row_height = avg_y_max - avg_y_min
        min_height = min(item_height, avg_row_height)

        if min_height <= 0:
            return 0.0

        return overlap_height / min_height

    def add_item(self, item: OCRItem) -> None:
        """Add an item to the row."""
        self.items.append(item)

