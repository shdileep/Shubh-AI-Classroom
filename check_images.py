import re
import os

base = r"c:\Users\revat\Downloads\Acadza_AI_Intern_Assignment\raw_stitch_screens"
for f in ['screen_1_landing_page.html', 'screen_3_signin_signup.html', 'screen_4_student_lms_dashboard.html']:
    with open(os.path.join(base, f), 'r', encoding='utf-8') as fp:
        c = fp.read()
    srcs = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', c)
    print(f, len(srcs), 'images found:')
    for s in srcs:
        print('  ', s)
