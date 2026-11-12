import re
import os
import shutil

raw_dir = r"c:\Users\revat\Downloads\Acadza_AI_Intern_Assignment\raw_stitch_screens"
pub_dir = r"c:\Users\revat\Downloads\Acadza_AI_Intern_Assignment\gapfinder-app\public"

# 1. Copy exact raw HTML files to public folder
shutil.copy2(os.path.join(raw_dir, "screen_1_landing_page.html"), os.path.join(pub_dir, "screen_1_landing_page.html"))
shutil.copy2(os.path.join(raw_dir, "screen_3_signin_signup.html"), os.path.join(pub_dir, "screen_3_signin_signup.html"))
shutil.copy2(os.path.join(raw_dir, "screen_4_student_lms_dashboard.html"), os.path.join(pub_dir, "screen_4_student_lms_dashboard.html"))
print("Copied exact HTML files to public/")

def html_to_jsx(html_str):
    # replace class= with className=
    s = re.sub(r'\bclass="', 'className="', html_str)
    # replace SVG attributes
    svg_attrs = [
        ("stroke-width", "strokeWidth"),
        ("stroke-linejoin", "strokeLinejoin"),
        ("stroke-linecap", "strokeLinecap"),
        ("stroke-opacity", "strokeOpacity"),
        ("stroke-dasharray", "strokeDasharray"),
        ("fill-opacity", "fillOpacity"),
        ("fill-rule", "fillRule"),
        ("clip-rule", "clipRule"),
        ("viewbox", "viewBox"),
        ("font-variation-settings", "fontVariationSettings"),
        ("font-family", "fontFamily"),
        ("font-weight", "fontWeight"),
        ("letter-spacing", "letterSpacing"),
        ("line-height", "lineHeight"),
        ("stop-color", "stopColor"),
        ("stop-opacity", "stopOpacity")
    ]
    for old, new in svg_attrs:
        s = s.replace(old + '=', new + '=')
    
    # replace self-closing tags
    for tag in ['input', 'img', 'hr', 'br']:
        s = re.sub(rf'(<{tag}[^>]*?)(?<!/)>', r'\1 />', s)
    
    # replace html comments <!-- ... --> with {/* ... */}
    s = re.sub(r'<!--(.*?)-->', r'{/* \1 */}', s)
    return s

print("Helper ready")
