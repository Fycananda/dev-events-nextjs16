import { v2 as cloudinary } from "cloudinary";

export function connectCloudinary() {
  try {
    const CLOUDINARY_URL = {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    };

    // Cek .env cloudinary
    if (!CLOUDINARY_URL) throw new Error(".env for CLOUDINARY_URL not found.");

    // Configuration
    cloudinary.config(CLOUDINARY_URL);
    // await cloudinary.uploader.upload("./public/images/event-full.png");

    return cloudinary;
  } catch (e) {
    console.error(
      "initializeCloudinary error:",
      e instanceof Error ? e.message : e,
    );
  }
}

export async function uploadToCloudinary(
  file: File,
): Promise<{ url: string; publicId: string }> {
  const cloudinary = connectCloudinary();
  const buffer = Buffer.from(await file.arrayBuffer());

  return new Promise((resolve, reject) => {
    cloudinary?.uploader
      .upload_stream(
        {
          resource_type: "image",
          folder: "DevEvent",
          transformation: {
            fetch_format: "auto",
            width: "auto",
            height: "auto",
            quality: "auto",
            dpr: "auto",
            crop: "fill",
            gravity: "auto",
          },
        },
        (error, result) => {
          if (error || !result) return reject(error);

          resolve({ url: result.secure_url, publicId: result.public_id });
        },
      )
      .end(buffer);
  });
}
