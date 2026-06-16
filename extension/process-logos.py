import os
from PIL import Image

def process_red_logo():
    src_path = os.path.join(os.path.dirname(__file__), 'logo_red_wireframe.png')
    
    if not os.path.exists(src_path):
        print(f"Error: Source image not found at {src_path}")
        return False
        
    img = Image.open(src_path).convert("RGBA")
    width, height = img.size
    
    # Create new images for dark (white icon) and light (black icon)
    img_dark = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    img_light = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    
    pixels = img.load()
    pixels_dark = img_dark.load()
    pixels_light = img_light.load()
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Identify red pixels: High red value relative to green and blue
            is_red = (r > 120) and (r > g + 40) and (r > b + 40)
            
            if is_red:
                # Solid white for dark theme
                pixels_dark[x, y] = (255, 255, 255, 255)
                # Solid black for light theme
                pixels_light[x, y] = (0, 0, 0, 255)
                
    # Crop to bounding box to remove all empty margins
    bbox = img_dark.getbbox()
    if bbox:
        # Add 2 pixels of padding to prevent edge cutoffs
        x0, y0, x1, y1 = bbox
        x0 = max(0, x0 - 2)
        y0 = max(0, y0 - 2)
        x1 = min(width, x1 + 2)
        y1 = min(height, y1 + 2)
        
        img_dark = img_dark.crop((x0, y0, x1, y1))
        img_light = img_light.crop((x0, y0, x1, y1))
        
    # Resize to standard VS Code icon size (16x16) or 24x24 for high quality
    img_dark = img_dark.resize((24, 24), Image.Resampling.LANCZOS)
    img_light = img_light.resize((24, 24), Image.Resampling.LANCZOS)
                
    img_dark.save('logo_dark.png', "PNG")
    img_light.save('logo_light.png', "PNG")
    print("Successfully processed, cropped, resized and saved transparent logo_dark.png and logo_light.png!")
    return True

if __name__ == '__main__':
    process_red_logo()
