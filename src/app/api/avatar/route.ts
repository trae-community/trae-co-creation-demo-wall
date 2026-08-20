import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cos, COS_BUCKET, COS_REGION } from '@/lib/cos';
import { writeOperationLog } from '@/lib/audit-log';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File too large (max 2MB)' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only JPG, PNG, WEBP, and SVG are allowed.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop();
    const fileName = `avatars/${user.userId}-${Date.now()}.${ext}`;

    await new Promise((resolve, reject) => {
      cos.putObject({
        Bucket: COS_BUCKET,
        Region: COS_REGION,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
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
