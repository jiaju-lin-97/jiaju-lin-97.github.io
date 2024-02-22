from PIL import Image

# Replace 'input_image.tiff' with the path to your TIFF image
input_image_path = 'portrait_circle.tiff'

# Replace 'output_image.jpg' with the desired output path for the JPEG image
output_image_path = 'portrait_circle.jpg'

# Open the input image
with Image.open(input_image_path) as img:
    # Convert the image to RGB mode in case it's in a different mode (like CMYK)
    img = img.convert('RGB')
    
    # Save the image in JPEG format
    img.save(output_image_path, 'JPEG')

print(f"Image converted to JPEG and saved as '{output_image_path}'")
