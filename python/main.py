import json
import sys
import re
from paddleocr import PaddleOCR
from ocr import PaddleOCRParser, RowGrouper, RowFilter, ColumnMapper, QuoteResolver


def normalize_quantity_text(qty_str: str) -> str:
    clean = qty_str.strip()
    if not clean:
        return ""
    if clean in ('I', 'i', 'l', '|', '!', 'L'):
        return '1'
    res = clean
    for char in ('I', 'i', 'l', '|', '!', 'L'):
        res = re.sub(r'(?<=[\d*xX×\s])' + re.escape(char) + r'(?=[\d*xX×\s]|$)', '1', res)
        res = re.sub(r'^' + re.escape(char) + r'(?=[\d*xX×\s])', '1', res)
    return res


def validate_quantity_string(qty_str: str) -> bool:
    norm = normalize_quantity_text(qty_str)
    if not norm:
        return False
    
    # Match numbers separated by x, X, *, or ×
    pattern = r'^\d+(?:\s*[xX*×]\s*\d+)*$'
    if not re.match(pattern, norm):
        return False
        
    # Extract all numbers and ensure they are positive (> 0)
    numbers = [int(n) for n in re.findall(r'\d+', norm)]
    if any(n <= 0 for n in numbers):
        return False
        
    return True


def safe_str(s: str) -> str:
    """Sanitize string for safe printing in cp1252/Windows terminals."""
    return "".join(c if ord(c) < 128 else '?' for c in s)


def validate_shipment(row_number: int, cols: list) -> dict:
    """Validate shipment fields and return a structured shipment dictionary."""
    from_company = cols[0].strip()
    customer_invoice = cols[1].strip()
    to_company = cols[2].strip()
    package_type = cols[3].strip()
    quantity = cols[4].strip()

    errors = []

    # 1. fromCompany validation
    if not from_company:
        errors.append("Missing From Company")

    # 2. customerInvoice validation
    if not customer_invoice:
        errors.append("Missing Customer Invoice")

    # 3. toCompany validation
    if not to_company:
        errors.append("Missing To Company")

    # 4. packageType validation
    if not package_type:
        errors.append("Missing Package Type")

    # 5. quantity validation
    if not quantity:
        errors.append("Invalid Quantity")
    else:
        if not validate_quantity_string(quantity):
            errors.append("Invalid Quantity")

    row_text = " ".join(cols).lower()
    payment_status = "Paid" if "paid" in row_text else "Pending"

    is_valid = len(errors) == 0

    return {
        "rowNumber": row_number,
        "fromCompany": from_company,
        "customerInvoice": customer_invoice,
        "toCompany": to_company,
        "packageType": package_type,
        "quantity": quantity,
        "paymentStatus": payment_status,
        "isValid": is_valid,
        "validationErrors": errors
    }


def main():
    # Initialize PaddleOCR with necessary configurations
    print("Initializing PaddleOCR...")
    ocr = PaddleOCR(
        use_doc_orientation_classify=False,
        use_doc_unwarping=False,
        use_textline_orientation=False,
        lang="en",
    )

    # Perform OCR text detection and recognition
    image_path = sys.argv[1] if len(sys.argv) > 1 else "python/input/sample.jpg"
    print(f"Running OCR on {image_path}...")
    result = ocr.predict(image_path)
    page = result[0]

    # 1. Parse OCR outputs into domain model items
    print("Parsing PaddleOCR outputs...")
    ocr_items = PaddleOCRParser.parse_page(page)

    # 2. Group items into rows using layout grouping algorithm
    print("Grouping items into rows using vertical overlap analysis...")
    grouper = RowGrouper(overlap_threshold=0.5)
    rows = grouper.group_items(ocr_items)

    # 3. Perform dynamic row filtering (Header boundary & Noise filters)
    print("Filtering rows...")
    row_filter = RowFilter()
    filtered_rows = row_filter.filter_rows(rows)

    if not filtered_rows:
        print("No valid shipment rows found after filtering!")
        return

    # 4. Map OCR items to 5 columns using X coordinates
    print("Mapping items to 5 columns...")
    mapper = ColumnMapper()
    mapped_rows = mapper.map_rows(filtered_rows)

    # 5. Resolve repeat (ditto) marks globally down each column
    print("Resolving repeated ditto values...")
    resolver = QuoteResolver()
    resolved_rows = resolver.resolve(mapped_rows)

    # 6. Print Column Assignment Validation Table (for debugging)
    print("\n=========================================================")
    print("          COLUMN ASSIGNMENT VALIDATION TABLE             ")
    print("=========================================================")
    for idx, (row, cols) in enumerate(zip(filtered_rows, resolved_rows), start=1):
        orig_text = " | ".join(item.text for item in row.items)
        mapped_details = []
        for c_idx, val in enumerate(cols, start=1):
            if val:
                mapped_details.append(f"Col {c_idx}: '{val}'")
        mapped_str = " , ".join(mapped_details)
        print(f"Row {idx:02d}:")
        print(f"  [Original OCR] : {safe_str(orig_text)}")
        print(f"  [Mapped Cols]  : {safe_str(mapped_str)}")
        print()
    print("=========================================================\n")

    # 7. Validate and structure each shipment
    print("Validating shipments...")
    shipments = []
    coordinates = {}
    for idx, cols in enumerate(resolved_rows, start=1):
        shipment = validate_shipment(idx, cols)
        shipments.append(shipment)
        
        # Capture bounding box of the row
        row = filtered_rows[idx - 1]
        coordinates[str(idx)] = {
            "x_min": min(item.box.x_min for item in row.items) if row.items else 0.0,
            "y_min": row.y_min,
            "x_max": max(item.box.x_max for item in row.items) if row.items else 0.0,
            "y_max": row.y_max
        }

    output_data = {
        "shipments": shipments,
        "coordinates": coordinates
    }

    # 8. Output final unified JSON structure
    print("\n==============================================")
    print("           FINAL PREVIEW JSON RESPONSE        ")
    print("==============================================")
    print(safe_str(json.dumps(output_data, indent=2)))
    print("==============================================\n")


if __name__ == "__main__":
    main()