import { NextResponse } from "next/server";
import { cos, COS_BUCKET, COS_REGION } from "@/lib/cos";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  try {
    // 1. Parse FormData
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // 2. Validate file
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File size exceeds 5MB limit" },
        { status: 400 }
      );
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed." },
        { status: 400 }
      );
    }

    // 3. Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const dateStr = new Date().toISOString().split('T')[0];
    const filePath = `uploads/${dateStr}/${fileName}`;

    // 4. Upload to Tencent COS
    const buffer = Buffer.from(await file.arrayBuffer());

    await new Promise((resolve, reject) => {
      cos.putObject({
        Bucket: COS_BUCKET,
        Region: COS_REGION,
        Key: filePath,
        Body: buffer,
        ContentType: file.type,
      }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    // 5. Generate public URL
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
