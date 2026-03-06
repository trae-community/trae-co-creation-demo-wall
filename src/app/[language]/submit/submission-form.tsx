'use client'

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Tag as WorkTag, DictionaryItem } from "@/lib/types";
import { Button } from "@/components/common/action-button";
import { Select } from "@/components/common/form-select";
import { v4 as uuidv4 } from "uuid";
import { AlertCircle, CheckCircle, UploadCloud, Link as LinkIcon, Users, MapPin, FileText, Image as ImageIcon, Globe, Plus, Trash2, Tag, LayoutGrid } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useLocale, useTranslations } from 'next-intl';
import { useUser } from "@clerk/nextjs";

export function SubmissionForm() {
  const { user } = useUser();
  const t = useTranslations('Submit');
  const locale = useLocale();
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingScreenshots, setUploadingScreenshots] = useState(false);

  // Initialize preview URLs from initialData or empty
  const [previewCoverUrl, setPreviewCoverUrl] = useState<string>("");
  const [previewScreenshots, setPreviewScreenshots] = useState<string[]>([]);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [availableTags, setAvailableTags] = useState<WorkTag[]>([]);
  const [availableCategories, setAvailableCategories] = useState<DictionaryItem[]>([]);
  const [availableCountries, setAvailableCountries] = useState<DictionaryItem[]>([]);
  const [availableCities, setAvailableCities] = useState<DictionaryItem[]>([]);
  const [availableDevStatuses, setAvailableDevStatuses] = useState<DictionaryItem[]>([]);

  const submissionSchema = z.object({
    name: z.string().min(2, t('validationNameMin')).max(50, t('validationNameMax')),
    intro: z.string().min(10, t('validationIntroMin')).max(100, t('validationIntroMax')),
    country: z.string().min(1, t('validationCountry')),
    city: z.string().min(1, t('validationCity')),
    category: z.string().min(1, t('validationCategory')),
    devStatus: z.string().min(1, t('validationDevStatus')),
    tags: z.array(z.number()).min(1, t('validationTagsMin')).max(5, t('validationTagsMax')),
    team: z.array(z.object({ value: z.string().min(1, t('validationTeamMemberRequired')) })).min(1, t('validationTeamMin')),
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
      category: "",
      devStatus: "",
      tags: [],
      team: [{ value: user?.username || "" }],
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

  const { fields: teamFields, append: appendTeam, remove: removeTeam } = useFieldArray({
    control,
    name: "team"
  });

  const coverUrl = watch("coverUrl");
  const screenshots = watch("screenshots") || [];
  const selectedCountry = watch("country");
  const selectedTags = watch("tags") || [];

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/file', {
      method: 'POST',
      body: formData,
    });
    const result = await response.json();
    if (result.success) {
      return result.url;
    }
    throw new Error(result.error || "Upload failed");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(t('uploadSizeError'));
        return;
      }
      
      try {
        setUploadingCover(true);
        const url = await uploadFile(file);
        setPreviewCoverUrl(url); // Update preview immediately
        setValue("coverUrl", url, { shouldValidate: true });
      } catch (error) {
        console.error("Cover upload failed:", error);
        alert(t('uploadError') || "Upload failed");
      } finally {
        setUploadingCover(false);
      }
    }
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      if (files.length + screenshots.length > 5) {
        alert(t('uploadLimitError'));
        return;
      }

      setUploadingScreenshots(true);
      try {
        const uploadPromises = Array.from(files).map(async (file) => {
          if (file.size > 5 * 1024 * 1024) {
            throw new Error(t('uploadSizeError'));
          }
          return uploadFile(file);
        });

        const uploadedUrls = await Promise.all(uploadPromises);
        const newScreenshots = [...screenshots, ...uploadedUrls];
        setPreviewScreenshots(newScreenshots); // Update preview immediately
        setValue("screenshots", newScreenshots, { shouldValidate: true });
      } catch (error) {
        console.error("Screenshot upload failed:", error);
        alert(t('uploadError') || "Upload failed");
      } finally {
        setUploadingScreenshots(false);
      }
    }
  };

  const removeScreenshot = (index: number) => {
    const newScreenshots = [...screenshots];
    newScreenshots.splice(index, 1);
    setPreviewScreenshots(newScreenshots);
    setValue("screenshots", newScreenshots);
  };

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags/all');
      if (!response.ok) throw new Error(`Failed to fetch tags: ${response.statusText}`);
      const data = await response.json();
      setAvailableTags(data);
    } catch (err) {
      console.error("Failed to fetch tags:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const apiLang = locale === 'zh' ? 'zh-CN' : locale === 'en' ? 'en-US' : locale === 'ja' ? 'ja-JP' : locale;
      const [categoryRes, devStatusRes] = await Promise.all([
        fetch(`/api/dictionaries?code=category_code&lang=${apiLang}`),
        fetch(`/api/dictionaries?code=dev_status&lang=${apiLang}`)
      ]);
      const categoryData = categoryRes.ok ? await categoryRes.json() : { items: [] };
      const devStatusData = devStatusRes.ok ? await devStatusRes.json() : { items: [] };
      setAvailableCategories(categoryData.items || []);
      setAvailableDevStatuses(devStatusData.items || []);
    } catch (err) {
      console.error("Failed to fetch dictionaries:", err);
    }
  };

  const fetchLocations = async () => {
    try {
      const apiLang = locale === 'zh' ? 'zh-CN' : locale === 'en' ? 'en-US' : locale === 'ja' ? 'ja-JP' : locale;
      const [countryRes, cityRes] = await Promise.all([
        fetch(`/api/dictionaries?code=country&lang=${apiLang}`),
        fetch(`/api/dictionaries?code=city&lang=${apiLang}`)
      ]);
      const countryData = countryRes.ok ? await countryRes.json() : { items: [] };
      const cityData = cityRes.ok ? await cityRes.json() : { items: [] };
      setAvailableCountries(countryData.items || []);
      setAvailableCities(cityData.items || []);
    } catch (err) {
      console.error("Failed to fetch locations:", err);
    }
  };

  // Filter cities based on selected country
  const filteredCities = useMemo(() => {
    if (!selectedCountry) return [];
    return availableCities.filter(city => city.parentValue === selectedCountry);
  }, [availableCities, selectedCountry]);

  useEffect(() => {
    fetchTags();
    fetchCategories();
    fetchLocations();
  }, [locale]);

  useEffect(() => {
    if (selectedCountry) {
      setValue("city", "");
    }
  }, [selectedCountry, setValue]);

  useEffect(() => {
    if (user?.username) {
      setValue("team", [{ value: user.username }]);
    }
  }, [user, setValue]);

  const toggleTag = (tagId: number) => {
    const currentTags = selectedTags as number[];
    if (currentTags.includes(tagId)) {
      setValue("tags", currentTags.filter(t => t !== tagId));
    } else {
      if (currentTags.length >= 5) {
        alert(t('tagsLimitError'));
        return;
      }
      setValue("tags", [...currentTags, tagId]);
    }
  };

  const onSubmit = async (data: SubmissionFormValues) => {
    try {
      // 2. Prepare payload with real URLs
      const payload = {
        ...data,
        highlights: data.highlights.map(h => h.value),
        scenarios: data.scenarios.map(s => s.value),
        team: JSON.stringify(data.team.map(t => t.value)), // Stringify team array for backend
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
              <Select
                options={availableCountries.map(country => ({ label: country.itemLabel, value: country.itemValue }))}
                value={selectedCountry}
                onChange={(value) => setValue("country", value)}
                placeholder={t('countryPlaceholder')}
                icon={<Globe className="w-4 h-4" />}
              />
              <input type="hidden" {...register("country")} />
              {errors.country && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.country.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">{t('city')} <span className="text-red-500">*</span></label>
              <Select
                options={filteredCities.map(city => ({ label: city.itemLabel, value: city.itemValue }))}
                value={watch("city")}
                onChange={(value) => setValue("city", value)}
                placeholder={t('cityPlaceholder')}
                disabled={!selectedCountry}
                icon={<MapPin className="w-4 h-4" />}
              />
              <input type="hidden" {...register("city")} />
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

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">{t('category')} <span className="text-red-500">*</span></label>
              <Select
                options={availableCategories.map(category => ({ label: category.itemLabel, value: category.itemValue }))}
                value={watch("category")}
                onChange={(value) => setValue("category", value)}
                placeholder={t('categoryPlaceholder')}
                icon={<LayoutGrid className="w-4 h-4" />}
              />
              <input type="hidden" {...register("category")} />
              {errors.category && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.category.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">{t('devStatus')} <span className="text-red-500">*</span></label>
              <Select
                options={availableDevStatuses.map(status => ({ label: status.itemLabel, value: status.itemValue }))}
                value={watch("devStatus")}
                onChange={(value) => setValue("devStatus", value)}
                placeholder={t('devStatusPlaceholder')}
                icon={<CheckCircle className="w-4 h-4" />}
              />
              <input type="hidden" {...register("devStatus")} />
              {errors.devStatus && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.devStatus.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">{t('tags')} <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const isSelected = (selectedTags as number[]).includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                        isSelected 
                          ? "bg-primary text-black border-primary" 
                          : "bg-zinc-900/50 text-zinc-400 border-zinc-700 hover:border-zinc-500"
                      }`}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
              <input type="hidden" {...register("tags")} />
              {errors.tags && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.tags.message}</p>}
              <p className="text-xs text-zinc-500 mt-1">{t('tagsDesc')}</p>
            </div>
          </div>
        </section>

        {/* Cover Image */}
        <section className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">{t('coverImageLabel')} <span className="text-red-500">*</span></label>
            {!previewCoverUrl ? (
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
                  src={previewCoverUrl}
                  alt={t('coverPreviewAlt')}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPreviewCoverUrl("");
                    setValue("coverUrl", "");
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title={t('deleteImage')}
                >
                  <Trash2 className="w-4 h-4" />
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
              {previewScreenshots.map((url, index) => (
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
              {previewScreenshots.length < 5 && (
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

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">{t('team')} <span className="text-red-500">*</span></label>
            </div>
            {teamFields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start">
                <div className="flex-1 space-y-1">
                  <input
                    {...register(`team.${index}.value` as const)}
                    className="w-full px-4 py-3 rounded-lg border-b-2 border-zinc-700 bg-zinc-900/50 text-white focus:border-primary focus:outline-none transition-colors placeholder:text-zinc-600"
                    placeholder={t('teamPlaceholder')}
                  />
                  {errors.team?.[index]?.value && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.team[index]?.value?.message}</p>}
                </div>
                {teamFields.length > 1 && (
                  <button type="button" onClick={() => removeTeam(index)} className="p-3 text-zinc-500 hover:text-red-500 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => appendTeam({ value: "" })} className="w-full border-dashed border-zinc-700 hover:border-primary hover:text-primary">
              <Plus className="w-4 h-4 mr-2" /> {t('addTeamMember')}
            </Button>
            {errors.team && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.team.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">{t('teamIntro')}</label>
            <textarea
              {...register("teamIntro")}
              rows={4}
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
