import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import api from '../services/api';

export function StatsModal({ isOpen, onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen]);

  const loadStats = async () => {
    try {
      const data = await api.getStats(30);
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate longest streak
  const calculateLongestStreak = () => {
    if (!stats?.words_per_day || stats.words_per_day.length === 0) return 0;

    let longestStreak = 0;
    let currentStreak = 0;
    const dates = stats.words_per_day.map(d => d.date).sort();
    
    for (let i = 0; i < dates.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const prevDate = new Date(dates[i - 1]);
        const currDate = new Date(dates[i]);
        const diffDays = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
      }
    }
    
    return Math.max(longestStreak, currentStreak);
  };

  if (!isOpen) return null;

  // Prepare chart data (reverse to show oldest to newest)
  const chartData = stats?.words_per_day
    ? [...stats.words_per_day].reverse().map(item => ({
        date: format(new Date(item.date), 'MMM d'),
        words: item.word_count,
      }))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl p-8 md:p-12 shadow-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 md:top-4 md:right-4 text-5xl leading-none hover:opacity-100 transition-opacity w-12 h-12 flex items-center justify-center"
          style={{ fontFamily: 'var(--font-title)', color: 'var(--text-primary)', opacity: 0.5, cursor: 'pointer' }}
        >
          ×
        </button>

        <h2 className="text-4xl mb-8" style={{ fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>Your Statistics</h2>

        {loading ? (
          <div className="text-center py-12 opacity-50" style={{ fontFamily: 'var(--font-body)', color: 'var(--text-primary)' }}>
            Loading statistics...
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-6 mb-12">
              <div className="text-center">
                <div className="text-4xl mb-2" style={{ fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>
                  {stats?.current_streak || 0}
                </div>
                <div className="text-sm opacity-70" style={{ fontFamily: 'var(--font-body)', color: 'var(--text-primary)' }}>
                  Current Streak
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2" style={{ fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>
                  {stats?.total_days_written || 0}
                </div>
                <div className="text-sm opacity-70" style={{ fontFamily: 'var(--font-body)', color: 'var(--text-primary)' }}>
                  Total Days
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2" style={{ fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>
                  {calculateLongestStreak()}
                </div>
                <div className="text-sm opacity-70" style={{ fontFamily: 'var(--font-body)', color: 'var(--text-primary)' }}>
                  Longest Streak
                </div>
              </div>
            </div>

            {/* Chart */}
            {chartData.length > 0 ? (
              <div>
                <h3 className="text-2xl mb-4" style={{ fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>
                  Words Per Day (Last 30 Days)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <XAxis
                      dataKey="date"
                      stroke="currentColor"
                      style={{ fontSize: '12px', fontFamily: 'Crete Round', color: 'var(--text-primary)' }}
                    />
                    <YAxis
                      stroke="currentColor"
                      style={{ fontSize: '12px', fontFamily: 'Crete Round', color: 'var(--text-primary)' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        fontFamily: 'Crete Round',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="words"
                      stroke="var(--accent-selection)"
                      strokeWidth={3}
                      dot={{ fill: 'var(--accent-selection)', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 opacity-50" style={{ fontFamily: 'var(--font-body)', color: 'var(--text-primary)' }}>
                No writing data yet. Start your first entry!
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

