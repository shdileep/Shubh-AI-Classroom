import os
import shutil

src_dir = r"c:\Users\revat\Downloads\Acadza_AI_Intern_Assignment\raw_stitch_screens"
dst_dir = r"c:\Users\revat\Downloads\Acadza_AI_Intern_Assignment\gapfinder-app\public\assets"
os.makedirs(dst_dir, exist_ok=True)

for root, dirs, files in os.walk(src_dir):
    for f in files:
        if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.svg')):
            src_file = os.path.join(root, f)
            rel_path = os.path.relpath(src_file, src_dir)
            target_file = os.path.join(dst_dir, os.path.basename(f))
            shutil.copy2(src_file, target_file)
            print(f"Copied: {f} -> {target_file}")

print("All assets copied to public/assets successfully!")
