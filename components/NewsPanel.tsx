"use client";

interface Article { id: number; headline: string; summary: string; url: string; datetime: number; source: string; }

export default function NewsPanel({ news }: { news: Article[] }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-white font-semibold mb-3">Latest News</h2>
      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
        {news.length === 0 && <p className="text-gray-500 text-sm">No recent news.</p>}
        {news.map((a, i) => (
          <a key={a.id ?? i} href={a.url} target="_blank" rel="noopener noreferrer"
            className="block bg-gray-800 hover:bg-gray-750 rounded-lg p-3 transition-colors group">
            <div className="text-white text-sm font-medium group-hover:text-blue-400 line-clamp-2 leading-snug">{a.headline}</div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-gray-500 text-xs">{a.source}</span>
              <span className="text-gray-600 text-xs">·</span>
              <span className="text-gray-500 text-xs">{new Date(a.datetime * 1000).toLocaleDateString()}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
