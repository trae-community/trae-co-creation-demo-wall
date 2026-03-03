import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

const BUCKET_NAME = "TRAE";

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
    // Max size 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File size exceeds 5MB limit" },
        { status: 400 }
      );
    }

    // Allowed types
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
    // Simple path structure: uploads/YYYY-MM-DD/filename
    const dateStr = new Date().toISOString().split('T')[0];
    const filePath = `uploads/${dateStr}/${fileName}`;

    // 4. Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Supabase storage upload error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to upload file to storage", details: error.message, fullError: error },
        { status: 500 }
      );
    }

    // 5. Get Public URL
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
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
    // 1. Parse request body
    const body = await request.json();
    const { path, url } = body;

    if (!path && !url) {
      return NextResponse.json(
        { success: false, error: "File path or URL is required" },
        { status: 400 }
      );
    }

    // 2. Determine file path
    let filePath = path;
    if (!filePath && url) {
      try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split(`/${BUCKET_NAME}/`);
        if (pathParts.length > 1) {
          filePath = decodeURIComponent(pathParts[1]);
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

    // 3. Delete from Supabase Storage
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error("Supabase storage delete error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to delete file" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("File delete error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
