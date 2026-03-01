import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { ParticlesBackground } from "@/components/ParticlesBackground";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] relative">
      <ParticlesBackground />
      <div className="relative z-10">
        <SignIn
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: "#22C55E",
              colorBackground: "#0A0A0C",
              colorInputBackground: "#1E1E22",
              colorText: "#FFFFFF",
              colorTextSecondary: "#A1A1AA",
            },
            elements: {
              rootBox: "w-full max-w-md",
              card: "bg-[#0A0A0C] border border-white/10 shadow-xl p-8 rounded-xl",
              headerTitle: "text-2xl font-bold text-white mb-2",
              headerSubtitle: "text-gray-400 mb-6",
              socialButtonsBlockButton: "bg-[#1E1E22] border border-white/10 hover:bg-white/5 transition-all text-white py-2.5",
              socialButtonsBlockButtonText: "text-white font-medium",
              dividerLine: "bg-white/10",
              dividerText: "text-gray-400 uppercase text-xs tracking-wider",
              formFieldLabel: "text-gray-300 font-medium",
              formFieldInput: "bg-[#1E1E22] border border-white/10 text-white focus:border-green-500 rounded-lg py-2.5",
              formButtonPrimary: "bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-lg transition-all normal-case",
              footer: "bg-transparent",
              footerActionText: "text-gray-400",
              footerActionLink: "text-green-500 hover:text-green-400 font-medium",
              identityPreviewText: "text-gray-300",
              identityPreviewEditButtonIcon: "text-green-500",
              formResendCodeLink: "text-green-500 hover:text-green-400",
            },
          }}
        />
      </div>
    </div>
  );
}
