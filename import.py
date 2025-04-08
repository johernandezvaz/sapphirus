import os
import requests
import cloudinary
import cloudinary.uploader
from supabase import create_client
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configurar Supabase
supabase = create_client(os.getenv("https://rxjquziaipslqtmgqeoz.supabase.co"), os.getenv("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4anF1emlhaXBzbHF0bWdxZW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0MjQzMTEsImV4cCI6MjA1NjAwMDMxMX0.iu4ovJ2QumGBROQOnbljQ9kPSirYvfgYiEukxJrHD3Q"))

# Configurar Cloudinary
cloudinary.config(
    cloud_name=os.getenv("dgxc3vc0x"),
    api_key=os.getenv("864199978382235"),
    api_secret=os.getenv("bTaiEYC5fqcnCS4LO5P9Q0OGhgA"),
)

def migrate_images():
    # Obtener productos con imágenes
    response = supabase.table("products").select("id, images").execute()
    
    if response.get("error"):
        print("❌ Error obteniendo productos:", response["error"])
        return

    for product in response.get("data", []):
        if not product["images"]:
            continue  # Saltar si no tiene imágenes

        new_image_urls = []

        for image_url in product["images"]:
            try:
                # ✅ Subir la imagen a Cloudinary directamente desde la URL
                result = cloudinary.uploader.upload(image_url, folder="products")

                print(f"✅ Imagen subida: {result['secure_url']}")
                new_image_urls.append(result['secure_url'])

            except Exception as e:
                print(f"⚠️ Error con la imagen {image_url}: {e}")

        # ✅ Guardar las nuevas URLs en `used_images`
        supabase.table("products").update({"used_images": new_image_urls}).eq("id", product["id"]).execute()
        print(f"🔄 Producto {product['id']} actualizado con nuevas imágenes")

migrate_images()