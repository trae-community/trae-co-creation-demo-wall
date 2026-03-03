'use client'

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CITIES, COUNTRIES, COUNTRY_CITY_MAP } from "../../types";
import { Button } from "../../components/Button";
import { v4 as uuidv4 } from "uuid";
import { AlertCircle, CheckCircle, UploadCloud, Link as LinkIcon, Users, MapPin, FileText, Image as ImageIcon, Globe, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';

export function SubmissionPage({ user }: { user?: { id: string; email: string | null; username: string; avatarUrl: string | null } }) {
  const t = useTranslations('Submit');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [availableCities, setAvailableCities] = useState<string[]>(CITIES);

  const submissionSchema = z.object({
    name: z.string().min(2, t('validationNameMin')).max(50, t('validationNameMax')),
    intro: z.string().min(10, t('validationIntroMin')).max(100, t('validationIntroMax')),
    country: z.string().min(1, t('validationCountry')),
    city: z.string().min(1, t('validationCity')),
    team: z.string().min(2, t('validationTeam')),
    teamIntro: z.string().optional(),
    contactPhone: z.string().optional(),
    contactEmail: z.string().email(t('validationEmail')).optional().or(z.literal("")),
    coverUrl: z.string().min(1, t('validationCover')),
    story: z.string().min(20, t('validationStoryMin')),
    highlights: z.array(z.object({ value: z.string().min(1, t('validationHighlightRequired')).max(10, t('validationHighlightMax')) }))
      .min(3, t('validationHighlightsMin'))
      .max(5, t('validationHighlightsMax')),
    scenarios: z.array(z.object({ value: z.string().min(1, t('validationScenarioRequired')) }))
      .min(1, t('validationScenariosMin')),
    screenshots: z.array(z.string()).min(1, t('validationScreenshotsMin')).max(5, t('validationScreenshotsMax')),
    demoUrl: z.string().url(t('validationDemoUrl')),
    repoUrl: z.string().url(t('validationRepoUrl')).optional().or(z.literal("")),
  });

  type SubmissionFormValues = z.infer<typeof submissionSchema>;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      name: "",
      intro: "",
      country: "",
      city: "",
      team: user?.username || "",
      teamIntro: "",
      contactPhone: "",
      contactEmail: "",
      coverUrl: "",
      story: "",
      highlights: [{ value: "" }, { value: "" }, { value: "" }], // Start with 3
      scenarios: [{ value: "" }],
      screenshots: [],
      demoUrl: "",
      repoUrl: "",
    },
  });

  const { fields: highlightFields, append: appendHighlight, remove: removeHighlight } = useFieldArray({
    control,
    name: "highlights"
  });

  const { fields: scenarioFields, append: appendScenario, remove: removeScenario } = useFieldArray({
    control,
    name: "scenarios"
  });

  const coverUrl = watch("coverUrl");
  const screenshots = watch("screenshots") || [];
  const selectedCountry = watch("country");

  useEffect(() => {
    if (selectedCountry) {
      setAvailableCities(COUNTRY_CITY_MAP[selectedCountry] || []);
      // Reset city if it's not in the new country list
      setValue("city", "");
    } else {
      setAvailableCities(CITIES);
    }
  }, [selectedCountry, setValue]);

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

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      if (files.length + screenshots.length > 5) {
        alert(t('uploadLimitError'));
        return;
      }

      const newScreenshots: string[] = [];
      const readers: Promise<void>[] = [];

      Array.from(files).forEach((file) => {
        if (file.size > 5 * 1024 * 1024) {
          alert(t('uploadSizeError'));
          return;
        }

        const reader = new FileReader();
        const promise = new Promise<void>((resolve) => {
          reader.onloadend = () => {
            newScreenshots.push(reader.result as string);
            resolve();
          };
        });
        reader.readAsDataURL(file);
        readers.push(promise);
      });

      Promise.all(readers).then(() => {
        setValue("screenshots", [...screenshots, ...newScreenshots]);
      });
    }
  };

  const removeScreenshot = (index: number) => {
    const newScreenshots = [...screenshots];
    newScreenshots.splice(index, 1);
    setValue("screenshots", newScreenshots);
  };

  const onSubmit = async (data: SubmissionFormValues) => {
    try {
      const payload = {
        ...data,
        highlights: data.highlights.map(h => h.value),
        scenarios: data.scenarios.map(s => s.value)
      };

      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setIsSubmitted(true);
      } else {
        console.error("Submission error:", result.error, result.details);
        alert(t('submitError') || result.error || "Submission failed");
      }
    } catch (error) {
      console.error("Submission failed:", error);
      alert(t('submitError') || "An unexpected error occurred");
    }
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">{t('projectName')} <span className="text-red-500">*</span></label>
            <input
              {...register("name")}
              className="w-full px-4 py-3 rounded-lg border-b-2 border-zinc-700 bg-zinc-900/50 text-white focus:border-primary focus:outline-none transition-colors placeholder:text-zinc-600"
              placeholder={t('projectNamePlaceholder')}
            />
            {errors.name && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">{t('country')} <span className="text-red-500">*</span></label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                <select
                  {...register("country")}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border-b-2 border-zinc-700 bg-zinc-900/50 text-white focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="">{t('countryPlaceholder')}</option>
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
              {errors.country && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.country.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">{t('city')} <span className="text-red-500">*</span></label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                <select
                  {...register("city")}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border-b-2 border-zinc-700 bg-zinc-900/50 text-white focus:border-primary focus:outline-none transition-colors"
                  disabled={!selectedCountry}
                >
                  <option value="">{t('cityPlaceholder')}</option>
                  {availableCities.map((city) => (
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
        </section>

        {/* Cover Image */}
        <section className="space-y-6">
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
            <label className="text-sm font-medium text-gray-300">{t('story')} <span className="text-red-500">*</span></label>
            <p className="text-xs text-zinc-500 mb-2">{t('storyDesc')}</p>
            <textarea
              {...register("story")}
              rows={8}
              className="w-full px-4 py-3 rounded-lg border-b-2 border-zinc-700 bg-zinc-900/50 text-white focus:border-primary focus:outline-none transition-colors placeholder:text-zinc-600"
              placeholder={t('storyPlaceholder')}
            />
            {errors.story && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.story.message}</p>}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">{t('highlights')} <span className="text-red-500">*</span></label>
              <span className="text-xs text-zinc-500">{t('highlightsDesc')}</span>
            </div>
            {highlightFields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start">
                <div className="flex-1 space-y-1">
                  <input
                    {...register(`highlights.${index}.value` as const)}
                    className="w-full px-4 py-3 rounded-lg border-b-2 border-zinc-700 bg-zinc-900/50 text-white focus:border-primary focus:outline-none transition-colors placeholder:text-zinc-600"
                    placeholder={t('highlightPlaceholder', { index: index + 1 })}
                  />
                  {errors.highlights?.[index]?.value && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.highlights[index]?.value?.message}</p>}
                </div>
                {highlightFields.length > 3 && (
                  <button type="button" onClick={() => removeHighlight(index)} className="p-3 text-zinc-500 hover:text-red-500 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
            {highlightFields.length < 5 && (
              <Button type="button" variant="outline" size="sm" onClick={() => appendHighlight({ value: "" })} className="w-full border-dashed border-zinc-700 hover:border-primary hover:text-primary">
                <Plus className="w-4 h-4 mr-2" /> {t('addHighlight')}
              </Button>
            )}
            {errors.highlights && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.highlights.message}</p>}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">{t('scenarios')} <span className="text-red-500">*</span></label>
            </div>
            {scenarioFields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start">
                <div className="flex-1 space-y-1">
                  <input
                    {...register(`scenarios.${index}.value` as const)}
                    className="w-full px-4 py-3 rounded-lg border-b-2 border-zinc-700 bg-zinc-900/50 text-white focus:border-primary focus:outline-none transition-colors placeholder:text-zinc-600"
                    placeholder={t('scenarioPlaceholder', { index: index + 1 })}
                  />
                  {errors.scenarios?.[index]?.value && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.scenarios[index]?.value?.message}</p>}
                </div>
                {scenarioFields.length > 1 && (
                  <button type="button" onClick={() => removeScenario(index)} className="p-3 text-zinc-500 hover:text-red-500 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => appendScenario({ value: "" })} className="w-full border-dashed border-zinc-700 hover:border-primary hover:text-primary">
              <Plus className="w-4 h-4 mr-2" /> {t('addScenario')}
            </Button>
            {errors.scenarios && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.scenarios.message}</p>}
          </div>
        </section>

        {/* Screenshots */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-border pb-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            {t('screenshots')}
          </h2>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">{t('screenshotsLabel')} <span className="text-red-500">*</span></label>
            <p className="text-xs text-zinc-500 mb-2">{t('screenshotsDesc')}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {screenshots.map((url, index) => (
                <div key={index} className="relative group aspect-video bg-zinc-900 rounded-lg overflow-hidden border border-border">
                  <img src={url} alt={`Screenshot ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeScreenshot(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {screenshots.length < 5 && (
                <label className="flex flex-col items-center justify-center aspect-video border-2 border-zinc-700 border-dashed rounded-lg cursor-pointer bg-zinc-900/50 hover:bg-zinc-800 transition-colors">
                  <Plus className="w-8 h-8 mb-2 text-zinc-500" />
                  <span className="text-xs text-zinc-500">{t('addScreenshot')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleScreenshotUpload}
                  />
                </label>
              )}
            </div>
            {errors.screenshots && <p className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" />{errors.screenshots.message}</p>}
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

        {/* Team Info */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-border pb-2">
            <Users className="w-5 h-5 text-primary" />
            {t('teamInfo')}
          </h2>

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

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">{t('teamIntro')}</label>
            <textarea
              {...register("teamIntro")}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border-b-2 border-zinc-700 bg-zinc-900/50 text-white focus:border-primary focus:outline-none transition-colors placeholder:text-zinc-600"
              placeholder={t('teamIntroPlaceholder')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">{t('contactPhone')}</label>
              <input
                {...register("contactPhone")}
                className="w-full px-4 py-3 rounded-lg border-b-2 border-zinc-700 bg-zinc-900/50 text-white focus:border-primary focus:outline-none transition-colors placeholder:text-zinc-600"
                placeholder={t('contactPhonePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">{t('contactEmail')}</label>
              <input
                {...register("contactEmail")}
                className="w-full px-4 py-3 rounded-lg border-b-2 border-zinc-700 bg-zinc-900/50 text-white focus:border-primary focus:outline-none transition-colors placeholder:text-zinc-600"
                placeholder={t('contactEmailPlaceholder')}
              />
              {errors.contactEmail && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.contactEmail.message}</p>}
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
