import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import api from '../services/api';

export function HistoryModal({ isOpen, onClose }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const limit = 7;

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, page]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getHistory(page, limit);
      setDocuments(data);
      // If we got exactly the limit, there might be more
      setHasMore(data.length === limit);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPreview = (content) => {
    const words = content.trim().split(/\s+/).slice(0, 8).join(' ');
    return content.trim().split(/\s+/).length > 8 ? `${words}...` : words;
  };

  const handleClose = () => {
    setSelectedDoc(null);
    setPage(1);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 backdrop-blur-sm transition-opacity duration-300"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            opacity: isOpen ? 1 : 0
          }}
          onClick={handleClose}
        />
      )}

      {/* Sidebar */}
      <div 
        className="fixed top-0 left-0 h-full z-50 shadow-2xl overflow-y-auto transition-transform duration-300 ease-in-out"
        style={{ 
          width: '90vw',
          maxWidth: '500px',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          borderRight: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)'
        }}
      >
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl md:text-4xl" style={{ fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>
              History
            </h2>
            <button
              onClick={handleClose}
              className="text-4xl leading-none hover:opacity-100 transition-opacity w-10 h-10 flex items-center justify-center"
              style={{ fontFamily: 'var(--font-title)', color: 'var(--text-primary)', opacity: 0.5, cursor: 'pointer' }}
            >
              ×
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 opacity-50" style={{ fontFamily: 'var(--font-body)', color: 'var(--text-primary)' }}>
              Loading history...
            </div>
          ) : selectedDoc ? (
            /* Show full document */
            <div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="mb-4 text-sm underline hover:opacity-100 transition-opacity"
                style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                ← Back to list
              </button>
              <div className="mb-4 pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <div className="text-xl mb-1" style={{ fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>
                  {format(new Date(selectedDoc.date), 'EEEE, MMM d, yyyy')}
                </div>
                <div className="text-sm opacity-70" style={{ fontFamily: 'var(--font-body)', color: 'var(--text-primary)' }}>
                  {selectedDoc.word_count} words
                </div>
              </div>
              <div 
                className="whitespace-pre-wrap text-base leading-relaxed"
                style={{ fontFamily: 'var(--font-body)', color: 'var(--text-primary)' }}
              >
                {selectedDoc.content}
              </div>
            </div>
          ) : (
            /* Show list of documents */
            <>
              {documents.length > 0 ? (
                <>
                  <div className="space-y-3 mb-6">
                    {documents.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => setSelectedDoc(doc)}
                        className="w-full text-left p-3 border transition-colors"
                        style={{ cursor: 'pointer', borderColor: 'var(--border-color)' }}
                      >
                        <div className="flex justify-between items-baseline mb-1">
                          <div className="font-semibold text-lg" style={{ fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>
                            {format(new Date(doc.date), 'EEE, MMM d')}
                          </div>
                          <div className="text-sm opacity-70" style={{ fontFamily: 'var(--font-body)', color: 'var(--text-primary)' }}>
                            {doc.word_count} words
                          </div>
                        </div>
                        <div className="text-sm opacity-70" style={{ fontFamily: 'var(--font-body)', color: 'var(--text-primary)' }}>
                          {getPreview(doc.content)}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="flex justify-between items-center pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="btn-secondary text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm" style={{ fontFamily: 'var(--font-body)', color: 'var(--text-primary)' }}>
                      Page {page}
                    </span>
                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={!hasMore}
                      className="btn-secondary text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 opacity-50" style={{ fontFamily: 'var(--font-body)', color: 'var(--text-primary)' }}>
                  No entries yet. Start writing!
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

