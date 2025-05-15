import React, { useEffect, useState } from 'react';

const workoutTypes = ['run', 'ride', 'yoga', 'weightTraining'];

const getDaysSinceLast = (type, activities) => {
  if (!Array.isArray(activities)) return 'No data';
  const last = activities.find(
    (a) => a.type?.toLowerCase() === type.toLowerCase()
  );
  if (!last || !last.date) return 'No data';
  const daysAgo = Math.floor((Date.now() - new Date(last.date)) / (1000 * 60 * 60 * 24));
  return daysAgo === 0 ? 'Today' : `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`;
};

export default function TimeSinceLastWorkout() {
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.recentActivities) {
        setRecent(e.detail.recentActivities);
      }
    };

    document.addEventListener('workout-data-ready', handler);
    return () => document.removeEventListener('workout-data-ready', handler);
  }, []);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
      {workoutTypes.map((type) => (
        <div
          key={type}
          className="text-xs sm:text-sm text-[var(--text-secondary)] bg-[var(--bubble-bg)] border border-[var(--border-color)] rounded-lg px-3 py-2 shadow-sm flex flex-col items-center text-center"
        >
          <span className="font-semibold capitalize mb-0.5">{type.replace('_', ' ')}</span>
          <span className="text-[var(--text-tertiary)] opacity-80">{getDaysSinceLast(type, recent)}</span>
        </div>
      ))}
    </div>
  );
}