import { NextRequest, NextResponse } from 'next/server';
import { isAuthResponse, requireAuthUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { cos, COS_BUCKET, COS_REGION } from '@/lib/cos';
import { writeOperationLog } from '@/lib/audit-log';
import { UPLOAD_IMAGE_MIME, validateUploadImage } from '@/lib/upload-image';

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_MAX_SIDE = 1024;
const AVATAR_MIME = [UPLOAD_IMAGE_MIME.jpeg, UPLOAD_IMAGE_MIME.png, UPLOAD_IMAGE_MIME.webp];

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthUser();
    if (isAuthResponse(user)) {
      return user;
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const validated = validateUploadImage(buffer, {
      maxBytes: AVATAR_MAX_BYTES,
      allowedMime: AVATAR_MIME,
      maxWidth: AVATAR_MAX_SIDE,
      maxHeight: AVATAR_MAX_SIDE,
      declaredMime: file.type,
    });

    if (!validated.ok) {
      return NextResponse.json({ success: false, error: validated.error }, { status: 400 });
    }

    const { detected } = validated;
    const fileName = `avatars/${user.userId}-${Date.now()}.${detected.ext}`;

    await new Promise((resolve, reject) => {
      cos.putObject({
        Bucket: COS_BUCKET,
        Region: COS_REGION,
        Key: fileName,
        Body: buffer,
        ContentType: detected.mime,
      }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    const avatarUrl = `https://${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com/${fileName}`;

    await prisma.sysUser.update({
      where: { id: user.userId },
      data: { avatarUrl },
    });

    await writeOperationLog({
      operatorId: user.userId,
      module: 'profile',
      action: 'update_avatar',
      targetType: 'sys_user',
      targetId: user.userId,
      payload: { avatarUrl },
      request,
    });

    return NextResponse.json({ success: true, url: avatarUrl });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
