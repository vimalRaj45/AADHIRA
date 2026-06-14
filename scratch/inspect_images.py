from PIL import Image
import os

images = [
    "logos.png",
    "signature.png",
    "ministry-of-micro-small-and-medium-enterprises-logo-png.png"
]

for img_name in images:
    path = os.path.join("c:/Users/USER/OneDrive/Desktop/adhira", img_name)
    if os.path.exists(path):
        with Image.open(path) as img:
            print(f"Image: {img_name}")
            print(f"  Format: {img.format}")
            print(f"  Mode: {img.mode}")
            print(f"  Size: {img.size}")
    else:
        print(f"Image not found: {img_name}")
