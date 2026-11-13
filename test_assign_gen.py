import time
from backend.services.assignment_generator import generate_assignment_questions_from_document

print("Testing question generator...", flush=True)
t0 = time.time()
pages = [{"page_number": 1, "raw_text": "Matrix rank nullity linear algebra eigenvectors eigenvalues trace orthogonal projection."}]
qs = generate_assignment_questions_from_document(pages, "Matrix Rank & Vector Pivot", "quiz", "Chapter2.txt")
print(f"Generated {len(qs)} MCQs in {round(time.time() - t0, 2)}s", flush=True)
assert len(qs) == 30
print("Success!", flush=True)
