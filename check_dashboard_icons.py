import re

content = open('gapfinder-app/src/components/LmsDashboard.jsx', encoding='utf-8').read()
matches = re.findall(r'<span[^>]*material-symbols-outlined[^>]*>([^<]+)</span>', content)
print("Icons found:", len(matches))
for m in sorted(set(matches)):
    print(" -", m)

# Let's also check index.html for Material Symbols font link
index_html = open('gapfinder-app/index.html', encoding='utf-8').read()
print("Font in index.html:", "Material Symbols" in index_html)
