'use client'

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CITIES } from "../../types";
import { Button } from "../../components/Button";
import { v4 as uuidv4 } from "uuid";
import { AlertCircle, CheckCircle, UploadCloud, Link as LinkIcon, Users, MapPin, FileText, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { useTranslations } from 'next-intl';

export function SubmissionPage({ user }: { user?: { id: string; email: string | null; username: string; avatarUrl: string | null } }) {
  const t = useTranslations('Submit');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const submissionSchema = z.object({
    name: z.string().min(2, t('validationNameMin')).max(50, t('validationNameMax')),
    intro: z.string().min(10, t('validationIntroMin')).max(100, t('validationIntroMax')),
    city: z.string().min(1, t('validationCity')),
    team: z.string().min(2, t('validationTeam')),
    coverUrl: z.string().min(1, t('validationCover')),
    problem: z.string().min(20, t('validationProblemMin')),
    solution: z.string().min(20, t('validationSolutionMin')),
    demoUrl: z.string().url(t('validationDemoUrl')),
    repoUrl: z.string().url(t('validationRepoUrl')).optional().or(z.literal("")),
  });

  type SubmissionFormValues = z.infer<typeof submissionSchema>;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      name: "",
      intro: "",
      city: "",
      team: user?.username || "",
      coverUrl: "",
      problem: "",
      solution: "",
      demoUrl: "",
      repoUrl: "",
    },
  });

  const coverUrl = watch("coverUrl");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(t('uploadSizeError'));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setValue("coverUrl", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: SubmissionFormValues) => {
    const projectData = {
      id: uuidv4(),
      ...data,
      team: data.team.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
    };

    const jsonString = JSON.stringify(projectData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `project-${projectData.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 bg-card rounded-2xl shadow-sm border border-border px-8">
        <div className="w-20 h-20 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">{t('successTitle')}</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          {t('successMessage')}
        </p>
        <div className="flex justify-center gap-4">
          <Button onClick={() => window.location.reload()} variant="outline">
            {t('continueSubmit')}
          </Button>
          <Button onClick={() => setIsSubmitted(false)}>
            {t('viewSubmission')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">{t('title')}</h1>
        <p className="text-gray-400">{t('description')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-card p-8 md:p-10 rounded-2xl shadow-lg border border-border">
        {/* Basic Info */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-border pb-2">
            <FileText className="w-5 h-5 text-primary" />
            {t('basicInfo')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">{t('projectName')} <span className="text-red-500">*</span></label>
              <input
                {...register("name")}
                className="w-full px-4 py-3 rounded-lg border-b-2 border-zinc-700 bg-zinc-900/50 text-white focus:border-primary focus:outline-none transition-colors placeholder:text-zinc-600"
                placeholder={t('projectNamePlaceholder')}
              />
              {errors.name && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">{t('city')} <span className="text-red-500">*</span></label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                <select
                  {...register("city")}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border-b-2 border-zinc-700 bg-zinc-900/50 text-white focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="">{t('cityPlaceholder')}</option>
                  {CITIES.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              {errors.city && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.city.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">{t('intro')} <span className="text-red-500">*</span></label>
            <input
                {...register("intro")}
                className="w-full px-4 py-3 rounded-lg border-b-2 border-zinc-700 bg-zinc-900/50 text-white focus:border-primary focus:outline-none transition-colors placeholder:text-zinc-600"
                placeholder={t('introPlaceholder')}
              />
            {errors.intro && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.intro.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">{t('team')} <span className="text-red-500">*</span></label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
              <input
                {...register("team")}
                className="w-full pl-10 pr-4 py-3 rounded-lg border-b-2 border-zinc-700 bg-zinc-900/50 text-white focus:border-primary focus:outline-none transition-colors placeholder:text-zinc-600"
                placeholder={t('teamPlaceholder')}
              />
            </div>
            {errors.team && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.team.message}</p>}
          </div>
        </section>

        {/* Cover Image */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-border pb-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            {t('coverImage')}
          </h2>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">{t('coverImageLabel')} <span className="text-red-500">*</span></label>
            {!coverUrl ? (
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-700 border-dashed rounded-lg cursor-pointer bg-zinc-900/50 hover:bg-zinc-800 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 mb-3 text-zinc-500" />
                        <p className="mb-2 text-sm text-zinc-400"><span className="font-semibold text-primary">{t('uploadClick')}</span> {t('uploadDrag')}</p>
                        <p className="text-xs text-zinc-500">{t('uploadFormat')}</p>
                      </div>
                      <input
                        id="dropzone-file"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                  {errors.coverUrl && <p className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" />{errors.coverUrl.message}</p>}
                </div>
              </div>
            ) : (
              /* Preview */
              <div className="mt-4 w-full aspect-video bg-zinc-900 rounded-lg overflow-hidden border border-border flex items-center justify-center relative group">
                <img
                  src={coverUrl}
                  alt={t('coverPreviewAlt')}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setValue("coverUrl", "")}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title={t('deleteImage')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>
                </button>
              </div>
            )}
            <input type="hidden" {...register("coverUrl")} />
          </div>
        </section>

        {/* Project Content */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-border pb-2">
            <FileText className="w-5 h-5 text-primary" />
            {t('detailContent')}
          </h2>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">{t('problem')} <span className="text-red-500">*</span></label>
            <textarea
              {...register("problem")}
              rows={5}
              className="w-full px-4 py-3 rounded-lg border-b-2 border-zinc-700 bg-zinc-900/50 text-white focus:border-primary focus:outline-none transition-colors placeholder:text-zinc-600"
              placeholder={t('problemPlaceholder')}
            />
            {errors.problem && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.problem.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">{t('solution')} <span className="text-red-500">*</span></label>
            <textarea
              {...register("solution")}
              rows={5}
              className="w-full px-4 py-3 rounded-lg border-b-2 border-zinc-700 bg-zinc-900/50 text-white focus:border-primary focus:outline-none transition-colors placeholder:text-zinc-600"
              placeholder={t('solutionPlaceholder')}
            />
            {errors.solution && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.solution.message}</p>}
          </div>
        </section>

        {/* Links */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-border pb-2">
            <LinkIcon className="w-5 h-5 text-primary" />
            {t('externalLinks')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">{t('demoUrl')} <span className="text-red-500">*</span></label>
              <input
                {...register("demoUrl")}
                className="w-full px-4 py-3 rounded-lg border-b-2 border-zinc-700 bg-zinc-900/50 text-white focus:border-primary focus:outline-none transition-colors placeholder:text-zinc-600"
                placeholder="https://..."
              />
              {errors.demoUrl && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.demoUrl.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">{t('repoUrl')}</label>
              <input
                {...register("repoUrl")}
                className="w-full px-4 py-3 rounded-lg border-b-2 border-zinc-700 bg-zinc-900/50 text-white focus:border-primary focus:outline-none transition-colors placeholder:text-zinc-600"
                placeholder="https://github.com/..."
              />
              {errors.repoUrl && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.repoUrl.message}</p>}
            </div>
          </div>
        </section>

        <div className="pt-6 border-t border-border flex justify-end">
          <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full md:w-auto px-8">
            {t('submitButton')}
          </Button>
        </div>
      </form>
    </div>
  );
}
