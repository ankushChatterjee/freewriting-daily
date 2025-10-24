import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import api from '../services/api';

export function StreakBar({ refreshTrigger }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [refreshTrigger]);

  const loadStats = async () => {
    try {
      const data = await api.getStats(7);
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex gap-2 justify-center">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="w-8 h-8 animate-pulse" style={{ backgroundColor: 'var(--border-color)' }} />
        ))}
      </div>
    );
  }

  // Create a map of dates that have writing
  const writtenDates = new Set(
    stats?.words_per_day?.map(item => item.date) || []
  );

  // Generate last 7 days
  const last7Days = [...Array(7)].map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    return {
      date: dateStr,
      displayDate: format(date, 'EEE, MMM d'),
      hasWriting: writtenDates.has(dateStr),
    };
  });

  return (
    <div className="flex gap-2 justify-center">
      {last7Days.map((day) => (
        <div
          key={day.date}
          title={day.displayDate}
          className="w-8 h-8 transition-all"
          style={{
            backgroundColor: day.hasWriting ? 'var(--accent-selection)' : 'var(--border-color)',
          }}
        />
      ))}
    </div>
  );
}

