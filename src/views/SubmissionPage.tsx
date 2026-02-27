'use client'

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CITIES } from "../types";
import { Button } from "../components/Button";
import { v4 as uuidv4 } from "uuid";
import { AlertCircle, CheckCircle, UploadCloud, Link as LinkIcon, Users, MapPin, FileText, Image as ImageIcon } from "lucide-react";
import { useState } from "react";

const submissionSchema = z.object({
  name: z.string().min(2, "项目名称至少2个字符").max(50, "项目名称不能超过50个字符"),
  intro: z.string().min(10, "简介至少10个字符").max(100, "简介不能超过100个字符"),
  city: z.string().min(1, "请选择所属城市"),
  team: z.string().min(2, "请填写团队成员"),
  coverUrl: z.string().min(1, "请上传封面图片"),
  problem: z.string().min(20, "问题描述至少20个字符"),
  solution: z.string().min(20, "解决方案至少20个字符"),
  demoUrl: z.string().url("请输入有效的Demo链接"),
  repoUrl: z.string().url("请输入有效的代码仓库链接").optional().or(z.literal("")),
});

type SubmissionFormValues = z.infer<typeof submissionSchema>;

export function SubmissionPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);

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
      team: "",
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
        alert("图片大小不能超过 5MB");
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
        <h2 className="text-3xl font-bold text-white mb-4">提交成功！</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          您的作品数据已生成并开始下载。请将下载的 JSON 文件发送给比赛管理员进行审核与发布。
        </p>
        <div className="flex justify-center gap-4">
          <Button onClick={() => window.location.reload()} variant="outline">
            继续提交
          </Button>
          <Button onClick={() => setIsSubmitted(false)}>
            查看提交内容
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">提交您的参赛作品</h1>
        <p className="text-gray-400">欢迎提交你的 TRAE Demo！请填写以下信息，我们将审核后在 TRAE DEMO WALL 上展示你的作品。所有信息将用于作品展示与社区交流，请确保真实准确。</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-card p-8 md:p-10 rounded-2xl shadow-lg border border-border">
        {/* Basic Info */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-border pb-2">
            <FileText className="w-5 h-5 text-primary" />
            基础信息
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">项目名称 <span className="text-red-500">*</span></label>
              <input
                {...register("name")}
                className="w-full px-4 py-3 rounded-lg border-b-2 border-zinc-700 bg-zinc-900/50 text-white focus:border-primary focus:outline-none transition-colors placeholder:text-zinc-600"
                placeholder="给你的项目起个响亮的名字"
              />
              {errors.name && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">所属城市 <span className="text-red-500">*</span></label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                <select
                  {...register("city")}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border-b-2 border-zinc-700 bg-zinc-900/50 text-white focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="">选择城市</option>
                  {CITIES.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              {errors.city && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.city.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">一句话简介 <span className="text-red-500">*</span></label>
            <input
                {...register("intro")}
                className="w-full px-4 py-3 rounded-lg border-b-2 border-zinc-700 bg-zinc-900/50 text-white focus:border-primary focus:outline-none transition-colors placeholder:text-zinc-600"
                placeholder="简要描述项目的核心价值（100字以内）"
              />
            {errors.intro && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.intro.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">团队成员 <span className="text-red-500">*</span></label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
              <input
                {...register("team")}
                className="w-full pl-10 pr-4 py-3 rounded-lg border-b-2 border-zinc-700 bg-zinc-900/50 text-white focus:border-primary focus:outline-none transition-colors placeholder:text-zinc-600"
                placeholder="张三, 李四, 王五 (使用逗号分隔)"
              />
            </div>
            {errors.team && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.team.message}</p>}
          </div>
        </section>

        {/* Cover Image */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-border pb-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            项目封面
          </h2>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">封面图片 <span className="text-red-500">*</span></label>
            {!coverUrl ? (
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-700 border-dashed rounded-lg cursor-pointer bg-zinc-900/50 hover:bg-zinc-800 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 mb-3 text-zinc-500" />
                        <p className="mb-2 text-sm text-zinc-400"><span className="font-semibold text-primary">点击上传</span> 或拖拽图片到此处</p>
                        <p className="text-xs text-zinc-500">支持 PNG, JPG (MAX. 5MB)</p>
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
                  alt="封面预览"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setValue("coverUrl", "")}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title="删除图片"
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
            详细内容
          </h2>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">解决的问题 <span className="text-red-500">*</span></label>
            <textarea
              {...register("problem")}
              rows={5}
              className="w-full px-4 py-3 rounded-lg border-b-2 border-zinc-700 bg-zinc-900/50 text-white focus:border-primary focus:outline-none transition-colors placeholder:text-zinc-600"
              placeholder="详细描述项目要解决的核心痛点..."
            />
            {errors.problem && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.problem.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">实现方案 <span className="text-red-500">*</span></label>
            <textarea
              {...register("solution")}
              rows={5}
              className="w-full px-4 py-3 rounded-lg border-b-2 border-zinc-700 bg-zinc-900/50 text-white focus:border-primary focus:outline-none transition-colors placeholder:text-zinc-600"
              placeholder="技术架构、核心功能实现逻辑..."
            />
            {errors.solution && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.solution.message}</p>}
          </div>
        </section>

        {/* Links */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-border pb-2">
            <LinkIcon className="w-5 h-5 text-primary" />
            外部链接
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Demo 链接 <span className="text-red-500">*</span></label>
              <input
                {...register("demoUrl")}
                className="w-full px-4 py-3 rounded-lg border-b-2 border-zinc-700 bg-zinc-900/50 text-white focus:border-primary focus:outline-none transition-colors placeholder:text-zinc-600"
                placeholder="https://..."
              />
              {errors.demoUrl && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.demoUrl.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">代码仓库 (选填)</label>
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
            生成作品数据并导出
          </Button>
        </div>
      </form>
    </div>
  );
}
