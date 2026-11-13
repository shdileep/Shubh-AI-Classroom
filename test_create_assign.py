import os
import sys
import io
import asyncio
import datetime
from starlette.datastructures import UploadFile

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from backend.database import init_db
from backend.routers import teacher

init_db()

sample_content = "Matrix rank nullity linear algebra eigenvectors eigenvalues trace orthogonal projection."
now = datetime.datetime.now()
start_time = (now - datetime.timedelta(minutes=5)).strftime("%Y-%m-%dT%H:%M")
end_time = (now + datetime.timedelta(hours=24)).strftime("%Y-%m-%dT%H:%M")

upload_file = UploadFile(file=io.BytesIO(sample_content.encode("utf-8")), filename="Linear_Algebra_Chapter2.txt")
teacher_user = {"sub": 1, "email": "admin@aiready.ac.in", "name": "Faculty Administrator", "role": "teacher"}

print("Calling create_teacher_assignment...", flush=True)
created = teacher.create_teacher_assignment(
    file=upload_file,
    title="Unit 2 Quiz",
    topic="Matrix Rank & Vector Pivot",
    start_time=start_time,
    end_time=end_time,
    faculty_name="Faculty Administrator",
    subject="Foundational STEM",
    assignment_type="quiz",
    current_user=teacher_user
)
print("Result:", created, flush=True)
