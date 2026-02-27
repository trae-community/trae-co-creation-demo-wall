'use client'

import { useParams } from "next/navigation";
import Link from "next/link";
import { PROJECTS } from "../data/projects";
import { ArrowLeft, ExternalLink, Github, Users, Calendar, Share2, ThumbsUp } from "lucide-react";
import { Button } from "../components/Button";
import { useState } from "react";

export function ProjectDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const project = PROJECTS.find((p) => p.id === id);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(project?.likes || 0);

  const handleLike = () => {
    if (liked) {
      setLikesCount(prev => prev - 1);
    } else {
      setLikesCount(prev => prev + 1);
    }
    setLiked(!liked);
  };

  if (!project) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white">项目未找到</h2>
        <Link href="/" className="text-primary hover:underline mt-4 block">
          返回首页
        </Link>
      </div>
    );
  }

  const handleShare = () => {
    // TODO: Implement share card logic here
    console.log("Share card clicked");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back Button */}
      <Link
        href="/"
        className="inline-flex items-center text-gray-400 hover:text-primary transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        返回列表
      </Link>

      {/* Header Section */}
      <div className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border">
        <div className="aspect-video w-full bg-zinc-900 relative">
          <img
            src={project.coverUrl}
            alt={project.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end">
            <div className="p-8 text-white w-full">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-primary text-black text-xs font-bold px-2 py-1 rounded">
                  {project.city}
                </span>
                {project.isFeatured && (
                  <span className="bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded">
                    城市优选
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{project.name}</h1>
              <p className="text-gray-200 text-lg max-w-2xl">{project.intro}</p>
            </div>
          </div>
        </div>

        {/* Meta Info Bar */}
        <div className="flex flex-wrap items-center justify-between p-6 bg-card border-b border-border gap-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                <span className="bg-white/10 text-white text-xs font-medium px-2.5 py-1 rounded-full border border-white/10">
                  {project.category}
                </span>
                {project.tags.map((tag) => (
                  <span key={tag} className="bg-zinc-800 text-gray-300 text-xs font-medium px-2.5 py-1 rounded-full border border-zinc-700">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">团队成员:</span>
                  <span className="text-gray-200">{project.team.join(", ")}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">提交时间:</span>
                  <span className="text-gray-200">{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleLike}
                className={`gap-2 transition-all duration-300 px-6 py-2.5 rounded-full font-medium ${
                  liked
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)] border-transparent scale-105"
                    : "bg-zinc-800/80 text-gray-300 hover:text-white hover:bg-zinc-800 border border-white/10 backdrop-blur-md hover:border-green-500/50 hover:shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                }`}
              >
                <ThumbsUp className={`w-4 h-4 ${liked ? "fill-current animate-bounce" : "group-hover:scale-110 transition-transform"}`} />
                {liked ? "已点赞" : "为作品点赞"}
                <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-mono ${liked ? "bg-white/20" : "bg-white/5 text-gray-400 group-hover:text-white"}`}>
                  {likesCount}
                </span>
              </Button>
            </div>
          </div>
      </div>

      {/* Content Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section className="bg-card p-8 rounded-2xl shadow-sm border border-border">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full"></span>
              创作故事
            </h2>
            <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed">
              {project.story}
            </div>
          </section>

          <section className="bg-card p-8 rounded-2xl shadow-sm border border-border">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary/80 rounded-full"></span>
              功能亮点
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {project.features.split('\n').map((feature, index) => (
                <div key={index} className="flex items-start gap-3 bg-zinc-900/50 p-4 rounded-xl border border-white/5 hover:border-primary/20 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-xs font-bold">{index + 1}</span>
                  </div>
                  <span className="text-gray-300">{feature.replace(/^\d+\.\s*/, '')}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-card p-8 rounded-2xl shadow-sm border border-border">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary/60 rounded-full"></span>
              使用场景
            </h2>
            <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed">
              {project.scenarios}
            </div>
          </section>

          <section className="bg-card p-8 rounded-2xl shadow-sm border border-border">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary/40 rounded-full"></span>
              界面截图
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.screenshots.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Screenshot ${index + 1}`}
                  className="rounded-lg w-full object-cover border border-zinc-800"
                />
              ))}
            </div>
          </section>

          <section className="bg-card p-8 rounded-2xl shadow-sm border border-border">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary/20 rounded-full"></span>
              技术说明
            </h2>
            <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed">
              {project.techStack}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 flex flex-col gap-3">
            <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
              <Button className="w-full gap-2 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40">
                <ExternalLink className="w-4 h-4" />
                体验 Demo
              </Button>
            </a>

            {project.repoUrl && (
              <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                <Button variant="secondary" className="w-full gap-2 bg-white/10 hover:bg-white/20 border-white/5 text-white">
                  <Github className="w-4 h-4" />
                  代码仓库
                </Button>
              </a>
            )}

            <Button
              variant="outline"
              onClick={handleShare}
              className="w-full gap-2 border-white/10 hover:bg-white/5 hover:text-white hover:border-white/20 text-gray-400"
            >
              <Share2 className="w-4 h-4" />
              分享卡片
            </Button>
          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <h3 className="font-bold text-primary mb-2">关于作品</h3>
            <p className="text-gray-400 text-sm mb-4">该作品由TRAE Friends@杭州线下活动提交。如果您对该项目感兴趣，可以通过代码仓库或Demo链接进一步了解。</p>
          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              关于作者
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div>
                  <p className="text-xs text-gray-500 mt-1">xxxxxxxxxxxxxxxxxxxxxxxxxxx</p>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800">
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <span>电话：13800000000</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>邮箱：demo@example.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
