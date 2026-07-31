from typing import Dict, List, Any
import numpy as np
from .models import BoundingBox, OCRItem


class PaddleOCRParser:
    """Parses raw PaddleOCR outputs into structured domain models.

    Adheres to the Single Responsibility Principle by only handling conversion
    from vendor-specific OCR payload structures to our internal domain models.
    """

    @staticmethod
    def parse_page(page: Dict[str, Any]) -> List[OCRItem]:
        """Parse a single page dictionary from PaddleOCR output into a list of OCRItems.

        Args:
            page: A dictionary containing 'rec_texts', 'rec_boxes', and 'rec_scores'.

        Returns:
            A list of structured OCRItem instances.
        """
        texts = page.get("rec_texts", [])
        boxes = page.get("rec_boxes", [])
        scores = page.get("rec_scores", [])

        # Ensure alignment of parallel arrays
        num_items = min(len(texts), len(boxes), len(scores))
        ocr_items: List[OCRItem] = []

        for i in range(num_items):
            text = texts[i]
            box_data = boxes[i]
            score = float(scores[i])

            # Convert numpy array to list if needed
            if isinstance(box_data, np.ndarray):
                coords = box_data.tolist()
            else:
                coords = list(box_data)

            # PaddleOCR rec_boxes shape (N, 4) denotes [x_min, y_min, x_max, y_max]
            if len(coords) != 4:
                # Skip invalid bounding boxes
                continue

            box = BoundingBox(
                x_min=float(coords[0]),
                y_min=float(coords[1]),
                x_max=float(coords[2]),
                y_max=float(coords[3])
            )

            ocr_items.append(OCRItem(text=text, box=box, score=score))

        return ocr_items
