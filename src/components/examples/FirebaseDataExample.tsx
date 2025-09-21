import React, { useState, useEffect } from 'react';
import { useFirebaseData, useRealtimeData } from '../../hooks/useFirebaseData';


// Example component showing how to use Firebase data storage
export const FirebaseDataExample: React.FC = () => {
  const {
    loading,
    createJournalEntry,
    createMoodEntry,
    saveAppSettings,
    getUserAnalytics
  } = useFirebaseData();

  const { journalEntries, appSettings } = useRealtimeData();

  const [journalTitle, setJournalTitle] = useState('');
  const [journalContent, setJournalContent] = useState('');
  const [currentMood, setCurrentMood] = useState(5);
  const [analytics, setAnalytics] = useState<any>(null);

  // Load analytics on component mount
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const data = await getUserAnalytics(30);
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      }
    };

    loadAnalytics();
  }, [getUserAnalytics]);

  // Handle journal entry creation
  const handleCreateJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalTitle.trim() || !journalContent.trim()) return;

    try {
      await createJournalEntry({
        title: journalTitle,
        content: journalContent,
        mood: 'neutral',
        emotions: ['reflective'],
        tags: ['daily'],
        isPrivate: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      setJournalTitle('');
      setJournalContent('');
    } catch (error) {
      console.error('Failed to create journal entry:', error);
    }
  };

  // Handle mood logging
  const handleLogMood = async () => {
    try {
      await createMoodEntry({
        mood: currentMood,
        energy: 7,
        anxiety: 3,
        sleep: 8,
        notes: 'Feeling good today!',
        activities: ['meditation', 'exercise'],
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Failed to log mood:', error);
    }
  };

  // Handle settings update
  const handleUpdateSettings = async () => {
    try {
      await saveAppSettings({
        theme: 'dark',
        language: 'mixed',
        notifications: {
          enabled: true,
          dailyCheckIn: true,
          moodReminders: true,
          crisisAlerts: true,
          progressUpdates: true,
          quietHours: {
            enabled: true,
            startTime: '22:00',
            endTime: '08:00'
          }
        },
        privacy: {
          dataSharing: false,
          analytics: true,
          crashReporting: true,
          personalizedAds: false
        },
        accessibility: {
          fontSize: 'medium',
          highContrast: false,
          screenReader: false,
          reducedMotion: false
        },
        aiPreferences: {
          personality: 'supportive',
          responseLength: 'detailed',
          culturalContext: true,
          hindiSupport: true
        }
      });
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem', color: '#333' }}>Firebase Data Storage Example</h1>

      {/* Journal Entry Form */}
      <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2 style={{ marginBottom: '1rem' }}>Create Journal Entry</h2>
        <form onSubmit={handleCreateJournal}>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Journal title..."
              value={journalTitle}
              onChange={(e) => setJournalTitle(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }}
            />
            <textarea
              placeholder="Write your thoughts..."
              value={journalContent}
              onChange={(e) => setJournalContent(e.target.value)}
              rows={4}
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Saving...' : 'Save Journal Entry'}
          </button>
        </form>
      </div>

      {/* Mood Logging */}
      <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2 style={{ marginBottom: '1rem' }}>Log Mood</h2>
        <div style={{ marginBottom: '1rem' }}>
          <label>Mood (1-10): </label>
          <input
            type="range"
            min="1"
            max="10"
            value={currentMood}
            onChange={(e) => setCurrentMood(parseInt(e.target.value))}
            style={{ marginLeft: '1rem' }}
          />
          <span style={{ marginLeft: '1rem' }}>{currentMood}</span>
        </div>
        <button 
          onClick={handleLogMood}
          disabled={loading}
          style={{ 
            padding: '0.5rem 1rem', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Logging...' : 'Log Mood'}
        </button>
      </div>

      {/* Settings Update */}
      <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2 style={{ marginBottom: '1rem' }}>App Settings</h2>
        <p>Current theme: {appSettings?.theme || 'Not set'}</p>
        <p>Language: {appSettings?.language || 'Not set'}</p>
        <button 
          onClick={handleUpdateSettings}
          disabled={loading}
          style={{ 
            padding: '0.5rem 1rem', 
            backgroundColor: '#6f42c1', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Updating...' : 'Update Settings'}
        </button>
      </div>

      {/* Recent Journal Entries */}
      <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2 style={{ marginBottom: '1rem' }}>Recent Journal Entries</h2>
        {journalEntries.length > 0 ? (
          <div>
            {journalEntries.slice(0, 3).map((entry) => (
              <div key={entry.entryId} style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <h4>{entry.title}</h4>
                <p style={{ fontSize: '0.9rem', color: '#666' }}>
                  {entry.content.substring(0, 100)}...
                </p>
                <small style={{ color: '#999' }}>
                  {entry.createdAt.toLocaleDateString()}
                </small>
              </div>
            ))}
          </div>
        ) : (
          <p>No journal entries yet.</p>
        )}
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h2 style={{ marginBottom: '1rem' }}>Analytics Summary (Last 30 Days)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <h4>Mood</h4>
              <p>Average: {analytics.mood.averageMood.toFixed(1)}/10</p>
              <p>Trend: {analytics.mood.moodTrend}</p>
              <p>Entries: {analytics.mood.totalEntries}</p>
            </div>
            <div>
              <h4>Journal</h4>
              <p>Total Entries: {analytics.journal.totalEntries}</p>
              <p>Avg Words: {Math.round(analytics.journal.averageWordsPerEntry)}</p>
            </div>
            <div>
              <h4>Sessions</h4>
              <p>Total: {analytics.sessions.totalSessions}</p>
              <p>Avg Duration: {Math.round(analytics.sessions.averageDuration / 60000)}min</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};