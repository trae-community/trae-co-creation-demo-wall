'use client'

import { useParams } from "next/navigation";
import { PROJECTS } from "../../data/projects";
import { ArrowLeft, ExternalLink, Github, Users, Calendar, Share2, ThumbsUp } from "lucide-react";
import { Button } from "../../components/Button";
import { useState, useEffect, useRef } from "react";
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';

function getApiBase() {
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

async function fetchStats(workId: string) {
  const base = getApiBase();
  const res = await fetch(`${base}/api/works/${workId}/stats`);
  if (!res.ok) return null;
  return res.json() as Promise<{ viewCount: number; likeCount: number; liked: boolean }>;
}

export function ProjectDetailPage() {
  const t = useTranslations('Project');
  const params = useParams();
  const id = params?.id as string;
  const project = PROJECTS.find((p) => p.id === id);
  // 仅用接口数据，不用 mock：初始为 0，等 /api/works/[id]/stats 返回后再更新
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likeError, setLikeError] = useState<string | null>(null);
  const viewRecordedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!id || !project) return;
    const workId = id;
    if (viewRecordedRef.current.has(workId)) {
      fetchStats(workId).then((stats) => {
        if (stats) {
          setLikesCount(stats.likeCount);
          setLiked(stats.liked);
        }
      });
      return;
    }
    viewRecordedRef.current.add(workId);
    (async () => {
      try {
        await fetch(`${getApiBase()}/api/works/${workId}/view`, { method: 'POST' });
      } catch {
        viewRecordedRef.current.delete(workId);
      }
      const stats = await fetchStats(workId);
      if (stats) {
        setLikesCount(stats.likeCount);
        setLiked(stats.liked);
      }
    })();
  }, [id, project]);

  const handleLike = async () => {
    setLikeError(null);
    try {
      const res = await fetch(`${getApiBase()}/api/works/${id}/like`, { method: 'POST' });
      if (res.status === 401) {
        setLikeError(t('loginToLike'));
        router.push('/sign-in');
        return;
      }
      const data = await res.json();
      if (data.liked !== undefined) {
        setLiked(data.liked);
        setLikesCount(prev => (data.liked ? prev + 1 : Math.max(0, prev - 1)));
      } else {
        const stats = await fetchStats(id);
        if (stats) {
          setLiked(stats.liked);
          setLikesCount(stats.likeCount);
        }
      }
    } catch {
      setLikeError(t('likeFailed'));
    }
  };

  if (!project) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white">{t('notFound')}</h2>
        <Link href="/" className="text-primary hover:underline mt-4 block">
          {t('backHome')}
        </Link>
      </div>
    );
  }

  const handleShare = () => {
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
        {t('backList')}
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
                    {t('cityFeatured')}
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
                  <span className="font-medium">{t('teamMembers')}</span>
                  <span className="text-gray-200">{project.team.join(", ")}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{t('submitTime')}</span>
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
                {liked ? t('liked') : t('likeProject')}
                <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-mono ${liked ? "bg-white/20" : "bg-white/5 text-gray-400 group-hover:text-white"}`}>
                  {likesCount}
                </span>
              </Button>
              {likeError && (
                <p className="text-sm text-amber-400 mt-2">{likeError}</p>
              )}
            </div>
          </div>
      </div>

      {/* Content Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section className="bg-card p-8 rounded-2xl shadow-sm border border-border">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full"></span>
              {t('story')}
            </h2>
            <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed">
              {project.story}
            </div>
          </section>

          <section className="bg-card p-8 rounded-2xl shadow-sm border border-border">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary/80 rounded-full"></span>
              {t('features')}
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
              {t('scenarios')}
            </h2>
            <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed">
              {project.scenarios}
            </div>
          </section>

          <section className="bg-card p-8 rounded-2xl shadow-sm border border-border">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary/40 rounded-full"></span>
              {t('screenshots')}
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
              {t('techStack')}
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
                {t('tryDemo')}
              </Button>
            </a>

            {project.repoUrl && (
              <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                <Button variant="secondary" className="w-full gap-2 bg-white/10 hover:bg-white/20 border-white/5 text-white">
                  <Github className="w-4 h-4" />
                  {t('codeRepo')}
                </Button>
              </a>
            )}

            <Button
              variant="outline"
              onClick={handleShare}
              className="w-full gap-2 border-white/10 hover:bg-white/5 hover:text-white hover:border-white/20 text-gray-400"
            >
              <Share2 className="w-4 h-4" />
              {t('shareCard')}
            </Button>
          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <h3 className="font-bold text-primary mb-2">{t('aboutProject')}</h3>
            <p className="text-gray-400 text-sm mb-4">{t('aboutProjectDesc')}</p>
          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t('aboutAuthor')}
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div>
                  <p className="text-xs text-gray-500 mt-1">xxxxxxxxxxxxxxxxxxxxxxxxxxx</p>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800">
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <span>{t('phone')}：13800000000</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>{t('email')}：demo@example.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
