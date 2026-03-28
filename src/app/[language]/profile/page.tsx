'use client'

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/language/navigation";
import { signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, MapPin, Save, ShieldCheck, Sparkles, User, LogOut, Camera, Key } from "lucide-react";
import { toast } from 'sonner';
import { WorksManagement } from "@/components/work/works-management";
import { LikedWorks } from "@/components/work/liked-works";

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
  username: string;
  bio: string;
  phone: string;
  locationCountry: string;
  locationCity: string;
}

interface ChangePasswordFormState {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const locale = useLocale();
  const t = useTranslations("Profile");
  const [data, setData] = useState<ProfileData | null>(null);
  const [form, setForm] = useState<ProfileFormState>({
    username: "",
    bio: "",
    phone: "",
    locationCountry: "",
    locationCity: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordForm, setPasswordForm] = useState<ChangePasswordFormState>({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await fetch("/api/profile", { method: "GET" });
      if (!response.ok) throw new Error("Failed to fetch profile data");

      const payload = await response.json();
      setData(payload);
      setForm({
        username: payload.profile.username ?? "",
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
      form.username !== (data.profile.username ?? "") ||
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
        username: payload.profile.username ?? "",
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

  const handleChangePassword = async () => {
    // 清空之前的提示
    setPasswordError("");

    // 前端验证
    if (!passwordForm.oldPassword) {
      setPasswordError(locale === "zh-CN" ? "请输入原密码" :
              locale === "ja-JP" ? "現在のパスワードを入力してください" :
              "Please enter current password");
      return;
    }

    if (!passwordForm.newPassword) {
      setPasswordError(locale === "zh-CN" ? "请输入新密码" :
              locale === "ja-JP" ? "新しいパスワードを入力してください" :
              "Please enter new password");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError(locale === "zh-CN" ? "新密码长度不能少于 6 个字符" : 
                      locale === "ja-JP" ? "新しいパスワードは 6 文字以上である必要があります" : 
                      "Password must be at least 6 characters");
      return;
    }

    if (!passwordForm.confirmPassword) {
      setPasswordError(locale === "zh-CN" ? "请确认新密码" :
              locale === "ja-JP" ? "新しいパスワードを確認してください" :
              "Please confirm new password");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(locale === "zh-CN" ? "两次输入的新密码不一致" :
                      locale === "ja-JP" ? "新しいパスワードが一致しません" :
                      "Passwords do not match");
      return;
    }

    try {
      setIsChangingPassword(true);

      const response = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(passwordForm),
      });

      const result = await response.json();

      if (!response.ok) {
        setPasswordError(result.error || t("passwordChangeError"));
        return;
      }

      // 成功：清空表单，显示成功提示
      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordSuccess(result.message || t("passwordChangeSuccess"));
      // 2秒后关闭弹窗
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess("");
      }, 2000);
    } catch (err) {
      console.error(err);
      setPasswordError(err instanceof Error ? err.message : t("passwordChangeError"));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('头像大小不能超过 2MB');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/avatar', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast.success('头像上传成功');
        await fetchProfile();
      } else {
        toast.error(result.error || '上传失败');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('上传失败');
    } finally {
      setIsUploadingAvatar(false);
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
          <div className="relative group">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 bg-zinc-900">
              {data.profile.avatarUrl ? (
                <img src={data.profile.avatarUrl} alt={data.profile.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <User className="w-8 h-8" />
                </div>
              )}
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl">
              {isUploadingAvatar ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={isUploadingAvatar}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-white">{data.profile.username}</h1>
            <p className="text-gray-400 mt-1">{data.profile.email}</p>
            <p className="text-xs text-gray-500 mt-2">
              {t("lastSignIn")}: {data.profile.lastSignInAt ? new Date(data.profile.lastSignInAt).toLocaleString(locale) : t("na")}
            </p>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {t("signOut")}
          </button>
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
                <label className="text-sm text-gray-300">{t("usernameLabel")}</label>
                <input
                  value={form.username}
                  onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900/60 text-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder={t("usernamePlaceholder")}
                  maxLength={20}
                />
              </div>

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

          <div className="rounded-2xl border border-white/10 bg-card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">{t("likedWorksTitle")}</h2>
            <LikedWorks userId={data.profile.id} />
          </div>
        </div>

        {/* 右侧栏 */}
        <div className="space-y-8">
          <div className="rounded-2xl border border-white/10 bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <h2 className="text-lg font-semibold text-white">{t("securityTitle")}</h2>
            </div>
            <p className="text-sm text-gray-400 mb-4">{t("securityDesc")}</p>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Key className="w-4 h-4" />
              {t("changePassword")}
            </button>
          </div>
        </div>
      </section>

      {/* 修改密码弹窗 */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPasswordModal(false)}
          />
          <div className="relative w-full max-w-md bg-[#0A0A0C] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">{t("changePassword")}</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-300">{t("oldPassword")}</label>
                <input
                  type="password"
                  value={passwordForm.oldPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, oldPassword: event.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900/60 text-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder={t("oldPasswordPlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-300">{t("newPassword")}</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900/60 text-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder={t("newPasswordPlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-300">{t("confirmPassword")}</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900/60 text-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder={t("confirmPasswordPlaceholder")}
                />
              </div>

              {/* 弹窗内的成功提示 */}
              {passwordSuccess && (
                <div className="p-3 rounded-xl border border-green-500/30 bg-green-500/10 text-sm text-green-300">
                  {passwordSuccess}
                </div>
              )}

              {/* 弹窗内的错误提示 */}
              {passwordError && (
                <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-300">
                  {passwordError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
                    setPasswordError("");
                    setPasswordSuccess("");
                  }}
                  disabled={isChangingPassword}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-black font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {t("changePassword")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
