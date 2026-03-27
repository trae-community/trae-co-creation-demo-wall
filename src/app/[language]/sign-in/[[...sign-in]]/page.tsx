import Link from "next/link";
import { SignInForm } from "@/components/auth/sign-in-form";
import { ParticlesBackground } from "@/components/layout/particles-background";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] relative">
      <ParticlesBackground />
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-[#0A0A0C] border border-white/10 shadow-xl p-8 rounded-xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">登录</h1>
            <p className="text-gray-400">欢迎回来，请登录您的账户</p>
          </div>

          <SignInForm />

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              还没有账户？{" "}
              <Link
                href="/sign-up"
                className="text-green-500 hover:text-green-400 font-medium"
              >
                立即注册
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
