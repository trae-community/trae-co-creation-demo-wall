import { NextResponse } from "next/server";
import { cos, COS_BUCKET, COS_REGION } from "@/lib/cos";
import { v4 as uuidv4 } from "uuid";
import { isAuthResponse, requireAuthUser } from "@/lib/api-auth";
import { UPLOAD_IMAGE_MIME, validateUploadImage } from "@/lib/upload-image";

const WORK_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
const WORK_UPLOAD_MIME = [
  UPLOAD_IMAGE_MIME.jpeg,
  UPLOAD_IMAGE_MIME.png,
  UPLOAD_IMAGE_MIME.webp,
  UPLOAD_IMAGE_MIME.gif,
];

export async function POST(request: Request) {
  try {
    const user = await requireAuthUser();
    if (isAuthResponse(user)) {
      return user;
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const validated = validateUploadImage(buffer, {
      maxBytes: WORK_UPLOAD_MAX_BYTES,
      allowedMime: WORK_UPLOAD_MIME,
      declaredMime: file.type,
    });

    if (!validated.ok) {
      return NextResponse.json(
        { success: false, error: validated.error },
        { status: 400 }
      );
    }

    const { detected } = validated;
    const fileName = `${uuidv4()}.${detected.ext}`;
    const dateStr = new Date().toISOString().split('T')[0];
    const filePath = `uploads/${dateStr}/${fileName}`;

    await new Promise((resolve, reject) => {
      cos.putObject({
        Bucket: COS_BUCKET,
        Region: COS_REGION,
        Key: filePath,
        Body: buffer,
        ContentType: detected.mime,
      }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    const publicUrl = `https://${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com/${filePath}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
    });

  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireAuthUser();
    if (isAuthResponse(user)) {
      return user;
    }

    const body = await request.json();
    const { path, url } = body;

    if (!path && !url) {
      return NextResponse.json(
        { success: false, error: "File path or URL is required" },
        { status: 400 }
      );
    }

    let filePath = path;
    if (!filePath && url) {
      try {
        const urlObj = new URL(url);
        const pathMatch = urlObj.pathname.match(/\/(.+)$/);
        if (pathMatch) {
          filePath = decodeURIComponent(pathMatch[1]);
        } else {
          return NextResponse.json(
            { success: false, error: "Invalid URL format" },
            { status: 400 }
          );
        }
      } catch (e) {
        return NextResponse.json(
          { success: false, error: "Invalid URL" },
          { status: 400 }
        );
      }
    }

    await new Promise((resolve, reject) => {
      cos.deleteObject({
        Bucket: COS_BUCKET,
        Region: COS_REGION,
        Key: filePath,
      }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("File delete error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
