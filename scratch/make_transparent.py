from PIL import Image
import os
import base64
import re

base_dir = "c:/Users/USER/OneDrive/Desktop/adhira"

def flood_fill_transparency(img_path, output_path, tolerance=15):
    img = Image.open(img_path).convert("RGBA")
    width, height = img.size
    data = img.load()
    
    # Target color to replace (white)
    target = (255, 255, 255)
    
    # Queue for BFS
    queue = []
    visited = set()
    
    # Add all border pixels to queue
    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(1, height - 1):
        queue.append((0, y))
        queue.append((width - 1, y))
        
    # BFS
    while queue:
        cx, cy = queue.pop(0)
        if (cx, cy) in visited:
            continue
        visited.add((cx, cy))
        
        # Check color similarity
        r, g, b, a = data[cx, cy]
        dist_sq = (r - target[0])**2 + (g - target[1])**2 + (b - target[2])**2
        
        # If it is white/near-white, make it transparent
        # If the pixel is already transparent, we also propagate the flood fill through it!
        if dist_sq <= tolerance**2 or a == 0:
            data[cx, cy] = (r, g, b, 0)
            
            # Add neighbors
            for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
                nx, ny = cx + dx, cy + dy
                if 0 <= nx < width and 0 <= ny < height:
                    if (nx, ny) not in visited:
                        queue.append((nx, ny))
                        
    img.save(output_path, "PNG")
    print(f"Processed flood-fill transparency for {img_path}")

def signature_to_alpha(img_path, output_path):
    img = Image.open(img_path).convert("RGBA")
    width, height = img.size
    data = img.load()
    
    for x in range(width):
        for y in range(height):
            r, g, b, a = data[x, y]
            # Calculate brightness (grayscale value)
            v = (r + g + b) // 3
            
            # White background is fully transparent
            if v >= 245:
                data[x, y] = (r, g, b, 0)
            # Deep ink is fully opaque
            elif v <= 180:
                data[x, y] = (r, g, b, 255)
            # Soft edges get interpolated transparency
            else:
                ratio = (v - 180) / (245 - 180)
                new_a = int(255 * (1.0 - ratio))
                data[x, y] = (r, g, b, new_a)
                
    img.save(output_path, "PNG")
    print(f"Processed signature-to-alpha transparency for {img_path}")

def make_white_transparent_global(img_path, output_path, tolerance=15):
    img = Image.open(img_path).convert("RGBA")
    width, height = img.size
    data = img.load()
    
    for x in range(width):
        for y in range(height):
            r, g, b, a = data[x, y]
            # If color is near-white, make it transparent
            if r > 255 - tolerance and g > 255 - tolerance and b > 255 - tolerance:
                data[x, y] = (r, g, b, 0)
                
    img.save(output_path, "PNG")
    print(f"Processed global white transparency for {img_path}")

def main():
    # Paths
    logos_path = os.path.join(base_dir, "logos.png")
    sig_path = os.path.join(base_dir, "signature.png")
    msme_path = os.path.join(base_dir, "ministry-of-micro-small-and-medium-enterprises-logo-png.png")
    
    # Process images on disk
    flood_fill_transparency(logos_path, logos_path, tolerance=20)
    signature_to_alpha(sig_path, sig_path)
    make_white_transparent_global(msme_path, msme_path, tolerance=15)
    
    # Generate Base64
    def get_b64(path):
        with open(path, "rb") as f:
            encoded = base64.b64encode(f.read()).decode("utf-8")
        return f"data:image/png;base64,{encoded}"
        
    logos_b64 = get_b64(logos_path)
    sig_b64 = get_b64(sig_path)
    msme_b64 = get_b64(msme_path)
    
    # Save base64 to text files
    with open(os.path.join(base_dir, "logos_b64.txt"), "w") as f:
        f.write(logos_b64)
    with open(os.path.join(base_dir, "sig_b64.txt"), "w") as f:
        f.write(sig_b64)
    with open(os.path.join(base_dir, "msme_b64.txt"), "w") as f:
        f.write(msme_b64)
        
    print("Saved Base64 text files.")
    
    # Update certificate-generator.html
    html_path = os.path.join(base_dir, "certificate-generator.html")
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Replace in assets
    # Match pattern: logos: 'data:image/png;base64,...',
    logos_pattern = r"logos:\s*'data:image/png;base64,[^']*'"
    sig_pattern = r"sig:\s*'data:image/png;base64,[^']*'"
    msme_pattern = r"msme:\s*'data:image/png;base64,[^']*'"
    
    content, count_logos = re.subn(logos_pattern, f"logos: '{logos_b64}'", content)
    content, count_sig = re.subn(sig_pattern, f"sig: '{sig_b64}'", content)
    content, count_msme = re.subn(msme_pattern, f"msme: '{msme_b64}'", content)
    
    print(f"Substituted in HTML - logos: {count_logos}, sig: {count_sig}, msme: {count_msme}")
    
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(content)
        
    print("Updated certificate-generator.html successfully.")

if __name__ == "__main__":
    main()
