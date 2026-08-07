import { connectCloudinary, uploadToCloudinary } from "@/lib/cloudinary";
import { createEventSchema } from "@/lib/validation";
import { createEvent, getAllEvent } from "@/repository/events";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

function isAllowedImage(file: File): boolean {
  const hasValidType = ALLOWED_TYPES.includes(file.type);
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) =>
    file.name.toLowerCase().endsWith(ext),
  );

  // Terima kalau salah SATU valid — mengatasi kasus type kosong/salah deteksi
  // TAPI kalau type ADA isinya dan gak cocok apapun (misal "application/pdf"), tetap tolak
  if (file.type && file.type !== "application/octet-stream") {
    return hasValidType;
  }

  // type gak reliable (kosong atau octet-stream) → andalkan ekstensi
  return hasValidExtension;
}

export async function POST(req: NextRequest) {
  let uploadedPublicId;
  try {
    const formData = await req.formData();

    // Validasi file untuk format image dari formdata
    const file = formData.get("image");
    if (file instanceof File) {
    }
    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "Image file is required" },
        { status: 400 },
      );
    }

    if (!isAllowedImage(file)) {
      return NextResponse.json(
        {
          message: "Only JPEG, PNG, or WEBP images are allowed",
          type: file.type,
          name: file.name,
        },
        { status: 400 },
      );
    }

    // Upload, simpan 'publicId' buat rollback kalau perlu
    const { url, publicId } = await uploadToCloudinary(file);
    uploadedPublicId = publicId;

    const parsed = createEventSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description"),
      overview: formData.get("overview"),
      image: url,
      venue: formData.get("venue"),
      location: formData.get("location"),
      date: formData.get("date"),
      time: formData.get("time"),
      mode: formData.get("mode"),
      audience: formData.get("audience"),
      organizer: formData.get("organizer"),
      agenda: formData.get("agenda"),
      tags: formData.get("tags"),
    });

    if (!parsed.success) {
      // Rollback: field lain invalid, tapi image kadung ke-upload
      await connectCloudinary()!
        .uploader.destroy(uploadedPublicId)
        .catch((cleanupError) => {
          console.error(
            "Failed to clean up orphaned Cloudinary image",
            cleanupError,
          );
        });

      return NextResponse.json(
        {
          message: "Validation failed",
          error: z.flattenError(parsed.error).fieldErrors,
        },
        { status: 400 },
      );
    }

    const createdEvent = await createEvent(parsed.data);

    revalidatePath("/events");
    
    return NextResponse.json(
      { message: "Event created successfully", createdEvent },
      { status: 201 },
    );
  } catch (e) {
    // Rollback: hapus image dari Cloudinary kalau insert ke mongoDb gagal setelah upload sukses
    if (uploadedPublicId) {
      const cloudinary = connectCloudinary();
      await cloudinary?.uploader
        .destroy(uploadedPublicId)
        .catch((cleanupError) => {
          console.error(
            "Failed to clean up orphaned Cloudinary image",
            cleanupError,
          );
        });
    }

    // log error '`${e.name}: ${e.message}`' ganti ke 'e.stack' itu sama saja, malah lebih jelas.
    console.log(e instanceof Error ? e.stack : "Unknown Error");

    return NextResponse.json(
      {
        message: "Event Creation Failed",
        error:
          e instanceof Error
            ? e.message
            : "Unknown Error from /POST api/events",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const getAllEvents = await getAllEvent();

    if (getAllEvents.length === 0) {
      return NextResponse.json(
        { message: "Empty Data at events", getAllEvents },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { message: "Events fetched successfully", getAllEvents },
      { status: 200 },
    );
  } catch (e) {
    console.error(e);

    return NextResponse.json(
      {
        message: "Event fetching failed",
        error:
          e instanceof Error ? e.message : "Unknown Error from /GET api/events",
      },
      { status: 500 },
    );
  }
}
