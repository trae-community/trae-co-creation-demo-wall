'use client';

import { cn } from '@/lib/utils';

const W = 213;
const H = 320;

function Route1Mock() {
  return (
    <div
      className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
      style={{ width: W, height: H }}
    >
      <div className="h-[48%] bg-muted flex items-center justify-center text-xs text-muted-foreground">封面</div>
      <div className="h-[52%] bg-white relative">
        <div className="absolute top-2 left-3 w-[78%] h-3.5 bg-[#435eeb] opacity-90" />
        <p className="absolute top-7 left-3.5 font-mono text-[11px] font-extrabold text-gray-900">我的 TRAE 作品名</p>
        <p className="absolute top-[3.1rem] left-3.5 font-mono text-[9px] font-bold text-gray-600 leading-snug max-w-[140px]">
          简介仍用等宽粗体，按固定字数硬切行…
        </p>
        <div className="absolute bottom-9 left-3 w-[55%] h-5 rounded-full bg-pink-500/80" />
        <p className="absolute bottom-3.5 right-14 font-mono text-[8px] font-extrabold text-gray-500 text-right">@同一昵称</p>
        <div className="absolute bottom-3 right-2.5 w-9 h-10 bg-gray-100 border border-gray-200" />
      </div>
    </div>
  );
}

function Route2Mock() {
  return (
    <div
      className="overflow-hidden rounded-xl border border-border bg-[#16181c] shadow-sm"
      style={{ width: W, height: H }}
    >
      <div className="h-[58%] bg-muted relative">
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">封面</div>
        <div className="absolute inset-x-0 bottom-0 h-[35%] bg-gradient-to-t from-[#16181c] to-transparent opacity-80" />
      </div>
      <div className="h-[42%] px-3 pt-2 pb-2.5 relative text-foreground">
        <div className="w-7 h-0.5 bg-green-400 rounded-full mb-2" />
        <p className="text-[13px] font-semibold leading-tight">作品名称</p>
        <p className="text-[10px] text-muted-foreground leading-relaxed mt-1.5 max-w-[150px]">
          一两行简介，按宽度自然换行，层次清晰。
        </p>
        <div className="absolute left-3 right-3 bottom-2.5 flex items-end justify-between">
          <div>
            <p className="text-[9px] text-muted-foreground">扫码体验</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">@creator</p>
          </div>
          <div className="w-10 h-10 rounded-md border border-border bg-card p-1">
            <div className="w-full h-full bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}

const TABLE_ROWS = [
  ['路线 1', '只改 compose + 微调旧模板', '粉/蓝装饰仍在', '修字体栈', '1～2 天', '与现在类似'],
  ['路线 2', '新模板 / 新版式', '深底 + 绿点缀', 'Sans 层级', '3～5 天', '全站统一变好看'],
  ['路线 3', '路线 2 + Canvas 导出', '版式同 2', 'Web 字体 fillText', '+2～3 天', '下载/打印最清晰'],
] as const;

export default function PosterRoutesPreviewPage() {
  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-10">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">海报合成：三条路线效果对比（示意）</h1>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          比例约 2:3，非最终稿。路线 1 接近现状；路线 2/3 为与 Demo Wall 对齐的目标版式。本页仅供选型，上线前可删除。
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="flex flex-col items-center gap-3">
          <h2 className="text-sm font-semibold">路线 1 · 修补</h2>
          <Route1Mock />
          <p className="text-xs text-muted-foreground text-center max-w-[220px]">
            蓝条、粉按钮、等宽粗字仍在；仅减轻字体与二维码贴图感。
          </p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <h2 className="text-sm font-semibold text-green-400">路线 2 · 新版式（推荐）</h2>
          <Route2Mock />
          <p className="text-xs text-muted-foreground text-center max-w-[220px]">
            上封面 + 下信息区；标题 / 简介 / @ 分层；与站点卡片一致。
          </p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <h2 className="text-sm font-semibold">路线 3 · Canvas 成片</h2>
          <Route2Mock />
          <p className="text-xs text-muted-foreground text-center max-w-[220px]">
            屏幕版式与路线 2 相同；差异在导出 PNG / 打印时笔画更稳。
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left">
              {['路线', '改动', '观感', '字体', '工期', '导出'].map((h) => (
                <th key={h} className="px-3 py-2 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TABLE_ROWS.map((row, i) => (
              <tr key={row[0]} className={cn(i < TABLE_ROWS.length - 1 && 'border-b border-border/60')}>
                {row.map((cell) => (
                  <td key={cell} className="px-3 py-2 text-muted-foreground align-top">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Cursor Canvas 文件（若在 IDE 里用 Canvas）：{' '}
        <code className="text-[10px] bg-muted px-1 rounded break-all">
          C:\Users\shea_\.cursor\projects\d-2-Project-trae-demo-wall-trae-co-creation-demo-wall\canvases\poster-routes-comparison.canvas.tsx
        </code>
      </p>
    </div>
  );
}
