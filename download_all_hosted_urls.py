import os
import re
import subprocess

base = r"c:\Users\revat\Downloads\Acadza_AI_Intern_Assignment\raw_stitch_screens"
hosted_dir = os.path.join(base, "hosted_assets")
os.makedirs(hosted_dir, exist_ok=True)

urls = set()
for html_file in ['screen_1_landing_page.html', 'screen_3_signin_signup.html', 'screen_4_student_lms_dashboard.html']:
    with open(os.path.join(base, html_file), 'r', encoding='utf-8') as f:
        content = f.read()
    found = re.findall(r'https://[^\s"\'\<\>\)]+', content)
    for u in found:
        if 'googleusercontent.com' in u or 'gstatic.com' in u:
            urls.add(u)

print(f"Found {len(urls)} hosted asset URLs to download:")
for i, url in enumerate(sorted(urls)):
    ext = ".png" if "png" in url.lower() else ".jpg"
    out_file = os.path.join(hosted_dir, f"hosted_asset_{i+1}{ext}")
    print(f"Downloading [{i+1}/{len(urls)}] -> {out_file}")
    res = subprocess.run(["curl.exe", "-L", url, "-o", out_file], capture_output=True)
    if res.returncode == 0 and os.path.exists(out_file) and os.path.getsize(out_file) > 0:
        print(f"  Success: {os.path.getsize(out_file)} bytes")
    else:
        print(f"  Failed: {res.stderr.decode('utf-8', errors='ignore')}")

print("All hosted URLs processed!")
