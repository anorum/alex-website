import React, { useEffect, useState } from 'react';
import { StarIcon, BookOpenIcon } from '@heroicons/react/24/solid';

export default function Authors() {
  const [topAuthors, setTopAuthors] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.__booksStats?.top_authors) {
      setTopAuthors(window.__booksStats.top_authors);
    }
  }, []);

  if (!topAuthors.length) return null;

  return (
    <div className="stats-card p-4 rounded-xl border border-[var(--border-color)] bg-white/5 dark:bg-white/10">
      <h3 className="text-lg font-semibold mb-4">Top Authors</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {topAuthors.map((author, index) => (
          <div
            key={index}
            className="p-3 rounded-lg border border-white/10 bg-white/10 dark:bg-white/5 shadow-sm hover:shadow-md transition-all"
          >
            <h4 className="font-semibold text-sm mb-1">{author.name}</h4>
            <p className="text-xs text-gray-400 mb-2">{author.books.length} books read</p>
            <div className="flex items-center text-sm gap-1">
              <StarIcon className="w-4 h-4 text-yellow-400" />
              <span>{author.avg_rating?.toFixed(2) || 'N/A'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
