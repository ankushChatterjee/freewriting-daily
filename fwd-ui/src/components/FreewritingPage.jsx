import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../hooks/useAuth';
import { StreakBar } from './StreakBar';
import { StatsModal } from './StatsModal';
import { HistoryModal } from './HistoryModal';
import api from '../services/api';

export function FreewritingPage() {
  const [content, setContent] = useState('');
  const [lastSavedContent, setLastSavedContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveWarning, setSaveWarning] = useState('');
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [streakRefreshTrigger, setStreakRefreshTrigger] = useState(0);
  const { logout, user } = useAuth();
  
  const minimumWords = parseInt(import.meta.env.VITE_MINIMUM_WORDS);

  useEffect(() => {
    loadTodayDoc();
  }, []);

  useEffect(() => {
    // Calculate word count
    const text = content.trim();
    const words = text === '' ? 0 : text.split(/\s+/).length;
    setWordCount(words);
  }, [content]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [content]); // Include content as dependency to ensure handleSave uses current state

  const loadTodayDoc = async () => {
    try {
      const doc = await api.getTodayDoc();
      if (doc) {
        setContent(doc.content);
        setLastSavedContent(doc.content);
      }
    } catch (error) {
      console.error('Failed to load today\'s document:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    setSaveWarning('');

    try {
      await api.saveDoc(content);
      setLastSavedContent(content);
      // Trigger streak bar refresh to fetch latest data from API
      setStreakRefreshTrigger(prev => prev + 1);
      if (wordCount < minimumWords) {
        setSaveWarning(`You need ${minimumWords}+ words for this to count toward your streak.`);
      }
      setTimeout(() => {
        setSaveWarning('');
      }, 4000);
    } catch (error) {
      setSaveError(error.message || 'Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const hasUnsavedChanges = content !== lastSavedContent;

  const today = new Date();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl opacity-50" style={{ fontFamily: 'var(--font-title)', color: 'var(--color-charcoal)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Top Bar - Fixed */}
      <header className="flex-shrink-0 px-4 py-4 md:py-6 border-b border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'var(--font-title)', color: 'var(--color-charcoal)' }}>
                The Free Writing Daily
              </h1>
              <p className="text-sm md:text-base" style={{ fontFamily: 'var(--font-title)', color: 'var(--color-charcoal)', opacity: 0.7 }}>
                {format(today, 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <StreakBar refreshTrigger={streakRefreshTrigger} />
              <div className="hidden md:flex items-center">
                <button
                  onClick={() => setIsHistoryOpen(true)}
                  className="btn-secondary"
                  style={{ paddingRight: '0.5rem' }}
                >
                  History
                </button>
                <span style={{ color: 'var(--color-charcoal)', opacity: 0.3 }}>|</span>
                <button
                  onClick={() => setIsStatsOpen(true)}
                  className="btn-secondary"
                  style={{ paddingLeft: '0.5rem', paddingRight: '0.5rem' }}
                >
                  Statistics
                </button>
                <span style={{ color: 'var(--color-charcoal)', opacity: 0.3 }}>|</span>
                <button
                  onClick={logout}
                  className="btn-secondary transition-colors hover:opacity-100"
                  style={{ paddingLeft: '0.5rem', opacity: 0.5 }}
                >
                  Logout
                </button>
              </div>
              <button
                onClick={logout}
                className="md:hidden text-sm transition-colors hover:opacity-100"
                style={{ fontFamily: 'var(--font-body)', color: 'var(--color-charcoal)', opacity: 0.7, cursor: 'pointer' }}
              >
                Logout
              </button>
            </div>
          </div>
          
          {/* Mobile buttons */}
          <div className="md:hidden flex gap-2 justify-center">
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="btn-secondary text-sm"
            >
              History
            </button>
            <button
              onClick={() => setIsStatsOpen(true)}
              className="btn-secondary text-sm"
            >
              Statistics
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Expandable */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-6xl mx-auto px-4 py-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="just write"
            className="w-full h-full bg-transparent border-0 focus:outline-none text-lg md:text-xl resize-none"
            style={{ 
              fontFamily: 'var(--font-body)', 
              color: 'var(--color-charcoal)',
              lineHeight: '1.8' 
            }}
          />
        </div>
      </div>

      <footer className="flex-shrink-0 px-4 py-4 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between md:items-center gap-3">
          <div className="flex items-center gap-4 self-center md:self-auto">
            <div className="flex items-center gap-3">
              <span 
                className="text-4xl leading-none inline-block text-right"
                style={{ 
                  fontFamily: 'var(--font-body)',
                  color: wordCount >= minimumWords ? 'var(--color-charcoal)' : '#d97706',
                  opacity: 0.45,
                  fontWeight: 400,
                  letterSpacing: '-0.02em',
                }}
                title={`${wordCount} words`}
              >
                {wordCount}
              </span>
              {wordCount < minimumWords && (
                <span 
                  className="text-sm leading-none"
                  style={{ 
                    fontFamily: 'var(--font-body)', 
                    color: 'var(--color-charcoal)', 
                    opacity: 0.5
                  }}
                >
                  {minimumWords}+ for streak
                </span>
              )}
            </div>
            
            {saveError && (
              <span className="text-sm text-red-600" style={{ fontFamily: 'var(--font-body)' }}>
                {saveError}
              </span>
            )}
            {saveWarning && (
              <span className="text-sm" style={{ fontFamily: 'var(--font-body)', color: '#d97706' }}>
                {saveWarning}
              </span>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary relative"
            title="⌘+Enter to save"
          >
            {/* Status Indicator */}
            <div 
              className="w-2 h-2 rounded-full transition-colors absolute"
              style={{ 
                backgroundColor: hasUnsavedChanges ? '#eab308' : '#22c55e',
                top: '-4px',
                left: '-4px',
                boxShadow: '0 0 0 2px white'
              }}
              title={hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved'}
            />
            {saving ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </footer>

      {/* Modals */}
      <StatsModal isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} />
      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
    </div>
  );
}

