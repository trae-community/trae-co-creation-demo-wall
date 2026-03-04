'use client'

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/language/navigation";
import { SignOutButton, UserProfile } from "@clerk/nextjs";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, MapPin, Save, ShieldCheck, Sparkles, User, LogOut } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WorksManagement } from "@/components/work/works-management";

interface ProfileData {
  profile: {
    id: string;
    username: string;
    email: string;
    avatarUrl: string | null;
    bio: string;
    phone: string;
    locationCountry: string;
    locationCity: string;
    lastSignInAt: string | null;
    workCount: number;
    totalViews: number;
    totalLikes: number;
  };
  works: Array<{
    id: string;
    title: string;
    summary: string;
    coverUrl: string;
    countryCode: string;
    cityCode: string;
    createdAt: string;
    views: number;
    likes: number;
    tags: string[];
  }>;
}

interface ProfileFormState {
  bio: string;
  phone: string;
  locationCountry: string;
  locationCity: string;
}

export default function ProfilePage() {
  const locale = useLocale();
  const t = useTranslations("Profile");
  const [data, setData] = useState<ProfileData | null>(null);
  const [form, setForm] = useState<ProfileFormState>({
    bio: "",
    phone: "",
    locationCountry: "",
    locationCity: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await fetch("/api/profile", { method: "GET" });
      if (!response.ok) throw new Error("Failed to fetch profile data");

      const payload = await response.json();
      setData(payload);
      setForm({
        bio: payload.profile.bio ?? "",
        phone: payload.profile.phone ?? "",
        locationCountry: payload.profile.locationCountry ?? "",
        locationCity: payload.profile.locationCity ?? "",
      });
    } catch (err) {
      console.error(err);
      setError(t("loadError"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [t]);

  const hasChanges = useMemo(() => {
    if (!data) return false;
    return (
      form.bio !== (data.profile.bio ?? "") ||
      form.phone !== (data.profile.phone ?? "") ||
      form.locationCountry !== (data.profile.locationCountry ?? "") ||
      form.locationCity !== (data.profile.locationCity ?? "")
    );
  }, [data, form]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "Failed to save profile");
      }

      const payload = await response.json();
      setData(payload);
      setForm({
        bio: payload.profile.bio ?? "",
        phone: payload.profile.phone ?? "",
        locationCountry: payload.profile.locationCountry ?? "",
        locationCity: payload.profile.locationCity ?? "",
      });
      setSuccess(t("saveSuccess"));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : t("saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
          {error || t("loadError")}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <section className="rounded-3xl border border-white/10 bg-card/80 backdrop-blur-md p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 bg-zinc-900">
            {data.profile.avatarUrl ? (
              <img src={data.profile.avatarUrl} alt={data.profile.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <User className="w-8 h-8" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-white">{data.profile.username}</h1>
            <p className="text-gray-400 mt-1">{data.profile.email}</p>
            <p className="text-xs text-gray-500 mt-2">
              {t("lastSignIn")}: {data.profile.lastSignInAt ? new Date(data.profile.lastSignInAt).toLocaleString(locale) : t("na")}
            </p>
          </div>

          <SignOutButton redirectUrl="/">
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
              <LogOut className="w-4 h-4" />
              {t("signOut")}
            </button>
          </SignOutButton>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-card p-5">
          <p className="text-xs text-gray-400">{t("statsWorks")}</p>
          <p className="text-2xl font-bold text-white mt-1">{data.profile.workCount}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-card p-5">
          <p className="text-xs text-gray-400">{t("statsViews")}</p>
          <p className="text-2xl font-bold text-white mt-1">{data.profile.totalViews}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-card p-5">
          <p className="text-xs text-gray-400">{t("statsLikes")}</p>
          <p className="text-2xl font-bold text-white mt-1">{data.profile.totalLikes}</p>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <div className="rounded-2xl border border-white/10 bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-lg font-semibold text-white">{t("basicsTitle")}</h2>
            </div>

            {error ? (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>
            ) : null}
            {success ? (
              <div className="mb-4 rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-300">{success}</div>
            ) : null}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-300">{t("introLabel")}</label>
                <textarea
                  rows={4}
                  value={form.bio}
                  onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900/60 text-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder={t("introPlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-300">{t("phoneLabel")}</label>
                <input
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900/60 text-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder={t("phonePlaceholder")}
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-black font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {t("save")}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">{t("worksTitle")}</h2>
            <WorksManagement 
              scope="user" 
              userId={data.profile.id}
              allowedActions={['view', 'edit', 'tag', 'delete']} 
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <h2 className="text-lg font-semibold text-white">{t("securityTitle")}</h2>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              {t("securityDesc")}
            </p>
            <button
              onClick={() => setIsAccountDialogOpen(true)}
              className="w-full rounded-xl border border-white/10 bg-zinc-900/60 text-white px-4 py-2.5 text-sm hover:bg-zinc-900 transition-colors"
            >
              {t("openSettings")}
            </button>
          </div>
        </div>
      </section>
      <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
        <DialogContent className="w-[96vw] max-w-5xl h-[90vh] bg-zinc-950 border-zinc-800 p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-white">{t("settingsModalTitle")}</DialogTitle>
            <DialogDescription>{t("settingsModalDesc")}</DialogDescription>
          </DialogHeader>
          <div className="px-2 pb-2 h-[calc(90vh-80px)] overflow-auto">
            <UserProfile
              routing="hash"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  cardBox: "w-full",
                  card: "w-full max-w-none border-0 shadow-none bg-transparent",
                },
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
