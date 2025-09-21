import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Textarea } from './ui/textarea';
import { ArrowLeft, Save, BookOpen, Clock, Loader2 } from 'lucide-react';
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
        loadJournalEntries(); // Refresh the list
      } else {
        toast.info('No demo entries found');
      }
    } catch (error) {
      console.error('Error clearing demo entries:', error);
      toast.error('Failed to clear demo entries');
    }
  };

  const handleSave = async () => {
    if (!currentUser || !currentEntry.trim() || !mood) return;
    
    setSaving(true);
    try {
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
      
      // Clear form and reload entries
      setCurrentEntry('');
      setMood('');
      await loadJournalEntries();
    } catch (error) {
      console.error('Error saving journal entry:', error);
      toast.error('Failed to save journal entry');
    } finally {
      setSaving(false);
    }
  };

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
            <h1 className="text-xl">Journal & Vent</h1>
          </div>
          
          {/* Clear Demo Entries Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={clearDemoEntries}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Clear Demo
          </Button>
        </div>

        {/* New Entry */}
        <Card className="p-6 mb-8 bg-card border-primary/20">
          <div className="flex items-center mb-4">
            <BookOpen className="w-5 h-5 text-primary mr-2" />
            <h2 className="text-lg font-medium">New Entry</h2>
          </div>

          {/* Mood Selection */}
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">How are you feeling?</p>
            <div className="flex flex-wrap gap-2">
              {moodOptions.map((moodOption) => (
                <Button
                  key={moodOption}
                  variant={mood === moodOption ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMood(moodOption)}
                  className={mood === moodOption ? "bg-primary hover:bg-primary/90" : "border-primary/30 hover:bg-primary/5"}
                >
                  {moodLabels[moodOption as keyof typeof moodLabels]}
                </Button>
              ))}
            </div>
          </div>

          {/* Text Area */}
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">What's on your mind?</p>
            <Textarea
              value={currentEntry}
              onChange={(e) => setCurrentEntry(e.target.value)}
              placeholder="Write about your day, your feelings, or anything you want to express..."
              className="min-h-32 resize-none border-primary/20 focus:border-primary/40"
            />
          </div>

          {/* Save Button */}
          <Button 
            onClick={handleSave}
            disabled={!currentEntry.trim() || !mood || saving || !currentUser}
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
                Save Entry
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
              <Card key={entry.entryId} className="p-4 bg-card border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {formatDate(entry.createdAt)}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                    {moodLabels[entry.mood as keyof typeof moodLabels]}
                  </span>
                </div>
                <h3 className="font-medium text-sm mb-1">{entry.title}</h3>
                <p className="text-sm text-foreground leading-relaxed">
                  {entry.content}
                </p>
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