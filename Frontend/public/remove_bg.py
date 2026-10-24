from PIL import Image

def make_black_transparent(input_path, output_path, threshold=30):
    img = Image.open(input_path)
    img = img.convert("RGBA")
    
    datas = img.getdata()
    
    newData = []
    for item in datas:
        # item is (R, G, B, A)
        if item[0] < threshold and item[1] < threshold and item[2] < threshold:
            # Replace with transparent
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
            
    img.putdata(newData)
    img.save(output_path, "PNG")
    print(f"Saved {output_path} with transparent background.")

make_black_transparent("d:/ERP/frontend/public/logo-new.png", "d:/ERP/frontend/public/logo-new.png", 35)
