import os
import json
import base64

steps_dir = r"C:\Users\revat\.gemini\antigravity\brain\d5ca73eb-2008-4708-8a4b-c35d0c92e6fb\.system_generated\steps"
base_out = r"c:\Users\revat\Downloads\Acadza_AI_Intern_Assignment\raw_stitch_screens"
os.makedirs(base_out, exist_ok=True)

# 1. HTML files
html_mappings = [
    {
        "step": 10,
        "screen_id": "213653d414db45a392d00fbff5679013",
        "title": "GapFinder AI — Soft Ivory & Midnight Black Edition",
        "out_html": os.path.join(base_out, "screen_1_landing_page.html")
    },
    {
        "step": 20,
        "screen_id": "9a55e7d0975e46c0a976c0856fa32de5",
        "title": "GapFinder AI — Sign In & Sign Up",
        "out_html": os.path.join(base_out, "screen_3_signin_signup.html")
    },
    {
        "step": 22,
        "screen_id": "c913e28acc294df9af932ac78cf59ce8",
        "title": "GapFinder AI — Student LMS Overview Dashboard",
        "out_html": os.path.join(base_out, "screen_4_student_lms_dashboard.html")
    }
]

for item in html_mappings:
    path = os.path.join(steps_dir, str(item["step"]), "output.txt")
    print(f"Reading HTML from {path}...")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    html_content = data.get("html", "")
    with open(item["out_html"], "w", encoding="utf-8") as out_f:
        out_f.write(html_content)
    print(f"Saved HTML to {item['out_html']} ({len(html_content)} bytes)")

# 2. Image files
image_mappings = [
    {
        "step": 28,
        "screen_id": "213653d414db45a392d00fbff5679013",
        "title": "Screen 1 Landing Page Screenshot",
        "out_img": os.path.join(base_out, "screen_1_soft_ivory_midnight.jpg")
    },
    {
        "step": 24,
        "screen_id": "a6988a19effe438dbfe9f2b93e89519a",
        "title": "Screen 2 Modern university student with books and laptop",
        "out_img": os.path.join(base_out, "screen_2_student_campus_study.png")
    },
    {
        "step": 30,
        "screen_id": "9a55e7d0975e46c0a976c0856fa32de5",
        "title": "Screen 3 Sign In & Sign Up Screenshot",
        "out_img": os.path.join(base_out, "screen_3_signin_signup.jpg")
    },
    {
        "step": 32,
        "screen_id": "c913e28acc294df9af932ac78cf59ce8",
        "title": "Screen 4 Student LMS Overview Dashboard Screenshot",
        "out_img": os.path.join(base_out, "screen_4_student_lms_dashboard.png")
    },
    {
        "step": 34,
        "screen_id": "46ddeef031b64efaaef52059fb47e269",
        "title": "Screen 5 Focused college student writing in notebook next to laptop",
        "out_img": os.path.join(base_out, "screen_5_student_writing_library.png")
    },
    {
        "step": 36,
        "screen_id": "4fb8ae2946fa409681388e61c655bbde",
        "title": "Screen 6 College student woman in cream knitted sweater with binder and tablet",
        "out_img": os.path.join(base_out, "screen_6_student_sweater_tablet.png")
    },
    {
        "step": 38,
        "screen_id": "61af0735e03f4228a10dbd6eb567eb16",
        "title": "Screen 7 Smiling university student brunette woman in campus library cafe",
        "out_img": os.path.join(base_out, "screen_7_student_smiling_cafe.png")
    },
    {
        "step": 44,
        "screen_id": "702ffcc6efb34ede9a3dd25f6d7a25a6",
        "title": "Additional student portrait holding textbooks",
        "out_img": os.path.join(base_out, "student_textbooks_hallway.png")
    },
    {
        "step": 46,
        "screen_id": "14759692173569139080",
        "title": "Logo / Asset 1",
        "out_img": os.path.join(base_out, "asset_logo_1.png")
    },
    {
        "step": 50,
        "screen_id": "14759692173569139636",
        "title": "Logo / Asset 3",
        "out_img": os.path.join(base_out, "asset_logo_3.png")
    }
]

for item in image_mappings:
    path = os.path.join(steps_dir, str(item["step"]), "output.txt")
    print(f"Reading image from {path}...")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    img_b64 = data.get("image", "")
    img_bytes = base64.b64decode(img_b64)
    with open(item["out_img"], "wb") as out_f:
        out_f.write(img_bytes)
    print(f"Saved image to {item['out_img']} ({len(img_bytes)} bytes)")

# Handle the two inline image outputs from steps 48 and 52
step48_b64 = "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"
with open(os.path.join(base_out, "asset_logo_2.png"), "wb") as f:
    f.write(base64.b64decode(step48_b64))
print("Saved asset_logo_2.png")

step52_b64 = "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"
with open(os.path.join(base_out, "asset_logo_4.png"), "wb") as f:
    f.write(base64.b64decode(step52_b64))
print("Saved asset_logo_4.png")

print("All stitch assets extracted successfully!")
