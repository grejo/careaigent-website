import re
import base64
import os
import sys

EXT_MAP = {"jpeg": "jpg", "jpg": "jpg", "png": "png", "gif": "gif", "webp": "webp", "svg+xml": "svg"}

def extract_images(html_file):
    with open(html_file, "r", encoding="utf-8") as f:
        content = f.read()

    os.makedirs("images", exist_ok=True)
    stem = os.path.splitext(os.path.basename(html_file))[0]
    counter = {"n": 0}

    def replacer(match):
        fmt = match.group(1)
        b64data = match.group(2).replace("\n", "").replace(" ", "")
        ext = EXT_MAP.get(fmt, fmt)
        counter["n"] += 1
        name = f"{stem}-{counter['n']:03d}.{ext}"
        path = os.path.join("images", name)
        with open(path, "wb") as imgf:
            imgf.write(base64.b64decode(b64data))
        print(f"  Saved {path}")
        return f'src="/images/{name}"'

    pattern = r'src="data:image/([a-zA-Z0-9+/]+);base64,([A-Za-z0-9+/=\n ]+?)"'
    new_content = re.sub(pattern, replacer, content)

    with open(html_file, "w", encoding="utf-8") as f:
        f.write(new_content)

    print(f"Processed {html_file} ({counter['n']} images extracted)")

for html_file in sys.argv[1:]:
    extract_images(html_file)
