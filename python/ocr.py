

from paddleocr import PaddleOCR

ocr = PaddleOCR(
    use_doc_orientation_classify=False,
    use_doc_unwarping=False,
    use_textline_orientation=False,
    lang="en",
)

result = ocr.predict("python/input/sample.jpg")

# 1
# print(result)

# 2
# print(type(result))
# print(len(result))

# 3
# page = result[0]
# print(type(page))
# print(page.keys)()

# 4
# page = result[0]
# print(page["rec_texts"])

# 5
# page = result[0]
# text = "\n".join(page["rec_texts"])
# print(text)

# 6
page = result[0]

texts = page["rec_boxes"]
scores = page["rec_scores"]

for text, score in zip(texts, scores):
    print(f"{score:.2f} -> {text}")

# run this for test   [ python python/ocr.py ] 