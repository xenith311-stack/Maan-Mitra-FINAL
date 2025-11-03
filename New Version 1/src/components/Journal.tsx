import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Textarea } from './ui/textarea';
import { ArrowLeft, Save, BookOpen, Clock, Loader2, Edit, Trash2, X, Sparkles, BrainCircuit } from 'lucide-react'; // *** MODIFIED ***
import { useAuth } from './auth/AuthProvider';
import { firebaseService, JournalEntry } from '../services/firebaseService';

import { toast } from 'sonner';
import type { Screen } from '../types';

interface JournalProps {
  navigateTo?: (screen: Screen) => void;
}

export function Journal({ navigateTo }: JournalProps = {}) {
  const { currentUser } = useAuth();
  const [currentEntry, setCurrentEntry] = useState('');
  const [mood, setMood] = useState('');
  const [savedEntries, setSavedEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null); // *** NEW ***

  // Component state tracking for development
  // console.log('Journal render:', { editingEntry: !!editingEntry, hasContent: !!currentEntry, mood });

  const moodOptions = ['very_happy', 'happy', 'neutral', 'sad', 'very_sad'];
  const moodLabels = {
    'very_happy': 'Amazing',
    'happy': 'Good',
    'neutral': 'Okay',
    'sad': 'Stressed',
    'very_sad': 'Sad'
  };

  // Load journal entries on component mount
  useEffect(() => {
    loadJournalEntries();
  }, [currentUser]);



  const loadJournalEntries = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const entries = await firebaseService.getJournalEntries(currentUser.uid, 10);
      setSavedEntries(entries);
    } catch (error) {
      console.error('Error loading journal entries:', error);
      toast.error('Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  };

  const clearDemoEntries = async () => {
    if (!currentUser) return;

    if (!window.confirm('Are you sure you want to clear all demo entries?')) {
      return;
    }

    try {
      const allEntries = await firebaseService.getJournalEntries(currentUser.uid, 50);
      const demoEntries = allEntries.filter(entry =>
        entry.title.includes('My First Day with MannMitra') ||
        entry.title.includes('Dealing with Work Stress') ||
        entry.title.includes('Feeling Better Today')
      );

      for (const demoEntry of demoEntries) {
        await firebaseService.deleteJournalEntry(demoEntry.entryId);
      }

      if (demoEntries.length > 0) {
        toast.success(`Removed ${demoEntries.length} demo entries`);
        await loadJournalEntries(); // Refresh the list
      } else {
        toast.info('No demo entries found');
      }
    } catch (error) {
      console.error('Error clearing demo entries:', error);
      toast.error('Failed to clear demo entries. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!currentUser || !currentEntry.trim() || !mood) {
      return;
    }

    setSaving(true);
    try {
      if (editingEntry) {
        // Update existing entry
        const updates: Partial<JournalEntry> = {
          content: currentEntry.trim(),
          mood: mood as 'very_happy' | 'happy' | 'neutral' | 'sad' | 'very_sad',
          emotions: [mood]
        };
        await firebaseService.updateJournalEntry(editingEntry.entryId, updates);
        toast.success('Journal entry updated!');
      } else {
        // Create new entry
        const newEntry: Omit<JournalEntry, 'entryId'> = {
          userId: currentUser.uid,
          title: `Journal Entry - ${new Date().toLocaleDateString()}`,
          content: currentEntry.trim(),
          mood: mood as 'very_happy' | 'happy' | 'neutral' | 'sad' | 'very_sad',
          emotions: [mood],
          tags: [],
          isPrivate: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await firebaseService.createJournalEntry(newEntry);
        toast.success('Journal entry saved successfully!');
      }

      // Clear form and reload entries
      setCurrentEntry('');
      setMood('');
      setEditingEntry(null);
      await loadJournalEntries();


    } catch (error) {
      console.error('Error saving journal entry:', error);
      toast.error('Failed to save journal entry');
    } finally {
      setSaving(false);
    }
  };
  // ... after handleSave

  const handleEditClick = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setCurrentEntry(entry.content);
    setMood(entry.mood);
    
    // Scroll to the top to the editor
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setCurrentEntry('');
    setMood('');
  };

  const handleDelete = async (entryId: string) => {
    // Show a confirmation dialog
    if (!window.confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      return;
    }

    try {
      await firebaseService.deleteJournalEntry(entryId);
      toast.success('Entry deleted successfully');
      await loadJournalEntries(); // Refresh the list
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry. Please try again.');
    }
  };



  // ...
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="relative min-h-screen p-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateTo?.('home')}
              className="mr-4 hover:bg-primary/10"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-semibold">Journal & Vent</h1>
          </div>

          {/* Clear Demo Entries Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={clearDemoEntries}
            className="text-red-600 border-red-200 hover:bg-red-50 hidden sm:flex"
          >
            Clear Demo
          </Button>
        </div>

        {/* New Entry */}
        <Card className={`p-4 sm:p-6 mb-8 bg-card ${editingEntry ? 'border-yellow-400 border-2' : 'border-primary/20'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center flex-wrap gap-2">
              <BookOpen className="w-5 h-5 text-primary mr-2" />
              <h2 className="text-lg font-medium">
                {editingEntry ? '✏️ Edit Entry' : '📝 New Entry'}
              </h2>
              {editingEntry && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  Editing
                </span>
              )}
            </div>
            {editingEntry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                className="text-muted-foreground"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            )}
          </div>

          {/* Mood Selection */}
          <div className="mb-4">
            <p className="text-sm font-medium mb-3">How are you feeling?</p>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
              {moodOptions.map((moodOption) => (
                <Button
                  key={moodOption}
                  variant={mood === moodOption ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMood(moodOption)}
                  className={`${mood === moodOption ? "bg-primary text-white" : "border-primary/20 hover:border-primary/40"} transition-colors`}
                >
                  {moodLabels[moodOption as keyof typeof moodLabels]}
                </Button>
              ))}
            </div>
          </div>

          {/* Text Area */}
          <div className="mb-6">
            <p className="text-sm font-medium mb-3">What's on your mind?</p>
            <Textarea
              value={currentEntry}
              onChange={(e) => setCurrentEntry(e.target.value)}
              placeholder="Write about your day, your feelings, or anything you want to express..."
              className="min-h-32 resize-none border-primary/20 focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={(!currentEntry.trim() && !mood) || saving || !currentUser}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {editingEntry ? 'Update Entry' : 'Save Entry'}
              </>
            )}
          </Button>
        </Card>

        {/* Previous Entries */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Recent Entries</h2>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading entries...</span>
            </div>
          ) : savedEntries.length > 0 ? (
            savedEntries.map((entry) => (
              <Card key={entry.entryId} className="p-4 bg-card border-primary/20 overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {formatDate(entry.createdAt instanceof Date ? entry.createdAt : new Date(entry.createdAt))}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                    {moodLabels[entry.mood as keyof typeof moodLabels]}
                  </span>
                </div>
                <h3 className="font-medium text-sm mb-1">{entry.title}</h3>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap mb-4">
                  {entry.content}
                </p>

                {/* AI Insights Section */}
                {entry.aiInsights ? (
                  <div className="mt-4 p-3 bg-gradient-to-r from-primary/5 to-primary/10 border-t border-primary/20 rounded-lg -mx-4 mx-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">AI Insights</h4>
                      </div>

                    </div>
                    <div className="space-y-2 text-xs text-primary/90">
                      {/* Enhanced safety check for potentially dangerous misanalysis */}
                      {(() => {
                        const content = entry.content.toLowerCase();
                        const criticalPhrases = [
                          'feel like dying', 'want to die', 'kill myself', 'end it all',
                          'suicide', 'suicidal', 'hurt myself', 'harm myself', 'no point in living'
                        ];
                        const hasCriticalContent = criticalPhrases.some(phrase => content.includes(phrase));
                        const hasPositiveSentiment = entry.aiInsights.sentimentScore && entry.aiInsights.sentimentScore > 0;
                        const hasNoRiskFlags = !entry.aiInsights.riskFlags || entry.aiInsights.riskFlags.length === 0;
                        const hasWrongSummary = entry.aiInsights.summary && (
                          entry.aiInsights.summary.toLowerCase().includes('playful') ||
                          entry.aiInsights.summary.toLowerCase().includes('greeting') ||
                          entry.aiInsights.summary.toLowerCase().includes('positive')
                        );
                        
                        const isDangerous = hasCriticalContent && (hasPositiveSentiment || hasNoRiskFlags || hasWrongSummary);
                        
                        return isDangerous ? (
                          <div className="bg-red-100 border-2 border-red-300 p-3 rounded-lg mb-3">
                            <div className="flex items-center gap-2 text-red-800">
                              <span className="text-lg">🚨</span>
                              <div>
                                <div className="font-bold text-sm">CRITICAL: Analysis Review Required</div>
                                <div className="text-xs">This entry contains concerning content that may need professional attention.</div>
                              </div>
                            </div>
                          </div>
                        ) : null;
                      })()}
                      
                      {entry.aiInsights.sentimentScore !== undefined && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Sentiment:</span>
                          <span className={`font-medium px-2 py-1 rounded text-xs ${
                            entry.aiInsights.sentimentScore > 0.2 ? 'bg-green-100 text-green-700' :
                            entry.aiInsights.sentimentScore < -0.2 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {entry.aiInsights.sentimentScore > 0.2 ? 'Positive' :
                             entry.aiInsights.sentimentScore < -0.2 ? 'Negative' : 'Neutral'}
                          </span>
                        </div>
                      )}
                      {entry.aiInsights.keyThemes && entry.aiInsights.keyThemes.length > 0 && (
                        <div>
                          <span className="text-gray-600">Key Themes:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {entry.aiInsights.keyThemes.map((theme, index) => (
                              <span key={index} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                                {theme}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {entry.aiInsights.summary && (
                        <p className="italic text-gray-700 bg-white/50 p-2 rounded">
                          "{entry.aiInsights.summary}"
                        </p>
                      )}
                      {entry.aiInsights.riskFlags && entry.aiInsights.riskFlags.length > 0 && (
                        <div className="bg-red-50 border border-red-200 p-2 rounded">
                          <span className="text-red-700 font-medium text-xs">⚠️ Risk Flags:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {entry.aiInsights.riskFlags.map((flag, index) => (
                              <span key={index} className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">
                                {flag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-3 border-t border-gray-100 -mx-4 mx-0 text-center">
                    <p className="text-xs text-gray-400 italic flex items-center justify-center gap-1">
                      <BrainCircuit className="w-3 h-3 animate-pulse" />
                      AI analysis will appear automatically...
                    </p>
                  </div>
                )}

                {/* Edit/Delete Buttons */}
                <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t border-gray-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(entry)}
                    className="border-primary/30 hover:bg-primary/5 transition-colors"
                  >
                    <Edit className="w-3 h-3 mr-1.5" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(entry.entryId)}
                    className="transition-colors"
                  >
                    <Trash2 className="w-3 h-3 mr-1.5" />
                    Delete
                  </Button>
                </div>

              </Card>
            ))
          ) : (
            <Card className="p-8 text-center bg-card border-primary/20">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No journal entries yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Start writing your first entry above!</p>
            </Card>
          )}
        </div>

        {/* Tips */}
        <Card className="p-4 mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <h3 className="font-medium mb-2 text-blue-800">Journaling Tips</h3>
          <div className="space-y-2 text-sm text-blue-700">
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              <span>Write freely without worrying about grammar</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              <span>Focus on your emotions and experiences</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              <span>Regular journaling can improve mental clarity</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Journal;