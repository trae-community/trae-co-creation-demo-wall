import { useTranslations } from 'next-intl';
import { Users, FileCheck, BarChart3, Settings } from 'lucide-react';

export default function AdminPage() {
  const t = useTranslations('Admin');

  const modules = [
    { icon: Users, titleKey: 'userManagement' as const, descKey: 'userManagementDesc' as const },
    { icon: FileCheck, titleKey: 'contentReview' as const, descKey: 'contentReviewDesc' as const },
    { icon: BarChart3, titleKey: 'dataStats' as const, descKey: 'dataStatsDesc' as const },
    { icon: Settings, titleKey: 'systemSettings' as const, descKey: 'systemSettingsDesc' as const },
  ];

  return (
    <div className="min-h-[calc(100vh-12rem)] flex flex-col items-center pt-24">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-white mb-2">{t('title')}</h1>
        <p className="text-gray-400">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl">
        {modules.map(({ icon: Icon, titleKey, descKey }) => (
          <div
            key={titleKey}
            className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 hover:border-green-500/30 hover:bg-white/[0.08] transition-all duration-300 cursor-default"
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0 rounded-xl bg-green-500/10 p-3 border border-green-500/20 group-hover:shadow-lg group-hover:shadow-green-500/10 transition-shadow">
                <Icon className="w-6 h-6 text-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-white mb-1">{t(titleKey)}</h2>
                <p className="text-sm text-gray-400 leading-relaxed">{t(descKey)}</p>
                <span className="inline-block mt-3 text-xs text-gray-500 border border-white/10 rounded-full px-3 py-1">
                  {t('comingSoon')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
