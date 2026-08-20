import Link from "next/link";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { ParticlesBackground } from "@/components/layout/particles-background";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] relative">
      <ParticlesBackground />
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-card border border-border shadow-xl p-8 rounded-xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">注册</h1>
            <p className="text-muted-foreground">创建您的账户，开始使用</p>
          </div>

          <SignUpForm />

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              已有账户？{" "}
              <Link
                href="/sign-in"
                className="text-green-500 hover:text-green-400 font-medium"
              >
                立即登录
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
