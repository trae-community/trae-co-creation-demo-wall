import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash, compare } from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { oldPassword, newPassword, confirmPassword } = body;

    // Validate required fields
    if (!oldPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "请填写完整信息" },
        { status: 400 }
      );
    }

    // Validate password length
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "新密码长度不能少于 6 个字符" },
        { status: 400 }
      );
    }

    // Validate password match
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "两次输入的新密码不一致" },
        { status: 400 }
      );
    }

    // Get user with password hash
    const user = await prisma.sysUser.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      );
    }

    // Check if user has a password (some users might be created via OAuth without password)
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "当前账户未设置密码，请先通过其他方式登录" },
        { status: 400 }
      );
    }

    // Verify old password
    const isValidOldPassword = await compare(oldPassword, user.passwordHash);
    if (!isValidOldPassword) {
      return NextResponse.json(
        { error: "原密码错误" },
        { status: 400 }
      );
    }

    // Hash new password
    const newPasswordHash = await hash(newPassword, 10);

    // Update password
    await prisma.sysUser.update({
      where: { id: authUser.userId },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    return NextResponse.json({
      success: true,
      message: "密码修改成功",
    });
  } catch (error) {
    console.error("[API] Failed to change password:", error);
    return NextResponse.json(
      { error: "修改密码失败" },
      { status: 500 }
    );
  }
}
