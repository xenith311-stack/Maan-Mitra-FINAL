import React, { useState, useEffect, ReactElement } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
// --- Import Recharts Components ---
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip as ChartTooltip } from 'recharts';
import { getFunctions, httpsCallable } from 'firebase/functions';
const functions = getFunctions();
const getDashboardInsights = httpsCallable(functions, 'getDashboardInsights');
// --- Import Icons ---
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Heart,
  Activity,
  Shield,
  Clock,
  Lightbulb,
  Brain,
  Users,
  BookOpen,
  MessageCircle
} from 'lucide-react';
import { useAuth } from './auth/AuthProvider';
import { firebaseService } from '../services/firebaseService';
import { toast } from 'sonner';

// --- Import chart data types from firebaseService ---
import { ProgressData } from '../services/firebaseService';

// --- Interfaces ---
interface AdvancedDashboardProps {
  userId: string;
  navigateTo?: (screen: string) => void;
}

interface DashboardData {
  wellnessScore: number;
  emotionalTrend: string;
  latestPhq9: number | null;
  latestGad7: number | null;
  phq9Trend: string;
  gad7Trend: string;
  recentSessionTopics: string[];
  recentJournalMoods: string[];
  userLanguage: string;
  userName: string;
}
// --- End Interfaces ---


export const AdvancedDashboard: React.FC<AdvancedDashboardProps> = ({ userId, navigateTo }) => {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const [recentSessions, setRecentSessions] = useState<any[]>([]); // Define a more specific type if possible
  const [crisisEvents, setCrisisEvents] = useState<any[]>([]); // Define a more specific type if possible
  const [latestJournal, setLatestJournal] = useState<any[]>([]);
  const [latestConvo, setLatestConvo] = useState<any[]>([]);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  const { userProfile } = useAuth();

  // Get the user's language key and translations
  const langKey = userProfile?.preferences?.language?.split('-')[0] || 'en';
  const t = {
    title: {
      en: "Your mental wellness journey",
      hi: "आपकी मानसिक स्वास्थ्य यात्रा",
      mr: "तुमचा मानसिक आरोग्य प्रवास"
    },
    greeting: {
      en: "Hello",
      hi: "नमस्ते",
      mr: "नमस्कार"
    },
    wellnessScore: {
      en: "Wellness Score",
      hi: "कल्याण स्कोर",
      mr: "वेलनेस स्कोअर"
    },
    sessions: {
      en: "Sessions",
      hi: "सत्र",
      mr: "सत्रे"
    },
    emotionalTrend: {
      en: "Emotional Trend",
      hi: "भावनात्मक रुझान",
      mr: "भावनिक प्रवृत्ती"
    },
    riskIndicator: {
      en: "Clinical Risk Indicator",
      hi: "नैदानिक जोखिम संकेतक",
      mr: "वैद्यकीय जोखीम सूचक"
    },
    recentSessions: {
      en: "Recent Sessions",
      hi: "हाल के सत्र",
      mr: "अलीकडील सत्रे"
    },
    assessmentScores: {
      en: "Assessment Scores",
      hi: "मूल्यांकन स्कोर",
      mr: "मूल्यांकन गुण"
    },
    todaysInsight: {
      en: "Today's AI Insight",
      hi: "आज की AI अंतर्दृष्टि",
      mr: "आजची AI अंतर्दृष्टी"
    },
    quickActions: {
      en: "Quick Actions",
      hi: "त्वरित कार्य",
      mr: "त्वरित कृती"
    },
    recentActivity: {
      en: "Your Recent Activity",
      hi: "आपकी हाल की गतिविधि",
      mr: "तुमची अलीकडील गतिविधी"
    },
    actions: {
      calmDown: { en: "Calm Down", hi: "शांत हों", mr: "शांत व्हा" },
      talkToCompanion: { en: "Talk to Companion", hi: "साथी से बात करें", mr: "साथीशी बोला" },
      writeJournal: { en: "Write in Journal", hi: "डायरी में लिखें", mr: "डायरीत लिहा" },
      takeAssessment: { en: "Take Assessment", hi: "मूल्यांकन करें", mr: "मूल्यांकन करा" },
      startVoiceSession: { en: "Start Voice Session", hi: "आवाज सत्र शुरू करें", mr: "आवाज सत्र सुरू करा" }
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [userId, timeframe]);

  const loadDashboardData = async () => {
    setLoading(true);
    setAiInsight(null); // Clear old insight on reload
    try {
      // Load progress analytics (now handles pre-aggregated data automatically)
      console.log('Fetching dashboard data for timeframe:', timeframe);
      const analytics = await firebaseService.getUserProgressAnalytics(userId, timeframe);
      console.log('Dashboard data loaded:', analytics);
      setProgressData(analytics);

      // Load recent sessions
      const sessions = await firebaseService.getUserSessions(userId, 5);
      setRecentSessions(sessions);

      // Load crisis events
      const crisis = await firebaseService.getUserCrisisEvents(userId);
      setCrisisEvents(crisis);

      // Load recent activity (enhanced for AI insights)
      try {
        const journal = await firebaseService.getJournalEntries(userId, 5); // Get last 5 for mood analysis
        setLatestJournal(journal);
      } catch (error) {
        console.log('No journal entries found or error loading:', error);
        setLatestJournal([]);
      }

      try {
        const conversations = await firebaseService.getUserConversations(userId, 3); // Get last 3 conversations
        setLatestConvo(conversations);
      } catch (error) {
        console.log('No conversations found or error loading:', error);
        setLatestConvo([]);
      }

      // --- NEW: Fetch AI Insight AFTER data is loaded ---
      if (analytics && userProfile) {
        try {
          // Calculate wellness score using the analytics data directly
          const calculateWellnessScore = (analyticsData: ProgressData): number => {
            const sessionCount = analyticsData.sessions.total || 0;
            const sessionScore = Math.min(sessionCount * 5, 25);
            const engagementLevel = analyticsData.sessions.engagementLevel || 0;
            const engagementScore = Math.round(engagementLevel * 25);
            const trend = analyticsData.sessions.emotionalTrend || 'stable';
            const trendScore = trend === 'improving' ? 25 : trend === 'stable' ? 15 : 5;
            let assessmentContribution = 0;
            let assessmentCount = 0;
            const latestPhq9 = analyticsData.assessments.latestScores.phq9;
            const latestGad7 = analyticsData.assessments.latestScores.gad7;
            if (latestPhq9 !== null && latestPhq9 !== undefined) {
              assessmentContribution += Math.max(0, (1 - (latestPhq9 / 27)) * 12.5);
              assessmentCount++;
            }
            if (latestGad7 !== null && latestGad7 !== undefined) {
              assessmentContribution += Math.max(0, (1 - (latestGad7 / 21)) * 12.5);
              assessmentCount++;
            }
            if (assessmentCount === 0) {
              assessmentContribution = 12.5;
            } else if (assessmentCount === 1) {
              assessmentContribution = Math.min(25, assessmentContribution * 2);
            }
            const totalScore = Math.round(sessionScore + engagementScore + trendScore + assessmentContribution);
            return Math.max(0, Math.min(100, totalScore));
          };

          const data: DashboardData = {
            wellnessScore: calculateWellnessScore(analytics),
            emotionalTrend: analytics.sessions.emotionalTrend,
            latestPhq9: analytics.assessments.latestScores.phq9,
            latestGad7: analytics.assessments.latestScores.gad7,
            phq9Trend: analytics.assessments.progressTrend.phq9,
            gad7Trend: analytics.assessments.progressTrend.gad7,
            recentSessionTopics: await extractSessionTopics(sessions, latestConvo),
            recentJournalMoods: latestJournal.map(entry => entry.mood || 'neutral').filter(Boolean),
            userLanguage: userProfile.preferences.language || 'en-IN',
            userName: userProfile.displayName || 'Friend',
          };

          console.log("Fetching AI insight with data:", data);
          const insightResult = (await getDashboardInsights(data)) as { data: { insight: string } };
          setAiInsight(insightResult.data.insight);
        } catch (insightError) {
          console.error("Error fetching AI insight:", insightError);
          // Don't fail the whole dashboard, just set a fallback
          setAiInsight("Could not load AI insight right now. Please try again later.");
        }
      }
      // --- END: Fetch AI Insight ---

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('डैशबोर्ड लोड करने में समस्या / Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  // --- Get Chart Data from Backend ---
  const emotionalTrendData = progressData?.emotionalTrendChartData || [];
  const assessmentHistoryData = progressData?.assessmentHistoryChartData || [];
  // --- End Chart Data ---


  // --- Calculation Functions (getWellnessScore, getRiskLevel - unchanged) ---
  const getWellnessScore = (): number => {
    // ... (your existing wellness score calculation logic) ...
    if (!progressData) return 50;
    const sessionCount = progressData.sessions.total || 0;
    const sessionScore = Math.min(sessionCount * 5, 25);
    const engagementLevel = progressData.sessions.engagementLevel || 0;
    const engagementScore = Math.round(engagementLevel * 25);
    const trend = progressData.sessions.emotionalTrend || 'stable';
    const trendScore = trend === 'improving' ? 25 : trend === 'stable' ? 15 : 5;
    let assessmentContribution = 0;
    let assessmentCount = 0;
    const latestPhq9 = progressData.assessments.latestScores.phq9;
    const latestGad7 = progressData.assessments.latestScores.gad7;
    if (latestPhq9 !== null && latestPhq9 !== undefined) {
      assessmentContribution += Math.max(0, (1 - (latestPhq9 / 27)) * 12.5);
      assessmentCount++;
    }
    if (latestGad7 !== null && latestGad7 !== undefined) {
      assessmentContribution += Math.max(0, (1 - (latestGad7 / 21)) * 12.5);
      assessmentCount++;
    }
    if (assessmentCount === 0) {
      assessmentContribution = 12.5;
    } else if (assessmentCount === 1) {
      assessmentContribution = Math.min(25, assessmentContribution * 2);
    }
    const totalScore = Math.round(sessionScore + engagementScore + trendScore + assessmentContribution);
    return Math.max(0, Math.min(100, totalScore));
  };

  const getRiskLevel = (): { level: string; color: string; message: string } => {
    // ... (your existing risk level calculation logic) ...
    const recentCrisis = crisisEvents.filter(event =>
      new Date(event.timestamp).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    );
    const latestPhq9 = progressData?.assessments.latestScores.phq9;
    const latestGad7 = progressData?.assessments.latestScores.gad7;
    let scoreBasedRisk: 'low' | 'moderate' | 'high' = 'low';
    let assessmentReason = '';
    if (latestPhq9 !== null && latestPhq9 !== undefined) {
      if (latestPhq9 >= 15) { scoreBasedRisk = 'high'; assessmentReason = 'PHQ-9 score indicates significant depression symptoms.'; }
      else if (latestPhq9 >= 10 && scoreBasedRisk === 'low') { scoreBasedRisk = 'moderate'; assessmentReason = 'PHQ-9 score indicates moderate depression symptoms.'; }
    }
    if (latestGad7 !== null && latestGad7 !== undefined) {
      if (latestGad7 >= 15) { scoreBasedRisk = 'high'; assessmentReason = assessmentReason ? `${assessmentReason} GAD-7 score indicates severe anxiety.` : 'GAD-7 score indicates severe anxiety.'; }
      else if (latestGad7 >= 10 && scoreBasedRisk === 'low') { scoreBasedRisk = 'moderate'; assessmentReason = assessmentReason ? `${assessmentReason} GAD-7 score indicates moderate anxiety.` : 'GAD-7 score indicates moderate anxiety.'; }
    }
    if (recentCrisis.some(e => e.severity === 'severe')) { return { level: 'उच्च / High', color: 'bg-red-100 text-red-800 border-red-200', message: 'Severe crisis event recently detected. कृपया professional help लें / Please seek professional help immediately.' }; }
    else if (recentCrisis.some(e => e.severity === 'high') || scoreBasedRisk === 'high') { return { level: 'मध्यम / Moderate', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', message: assessmentReason ? `${assessmentReason} Extra care की जरूरत / Needs extra care & monitoring.` : 'High risk indicators detected. Needs extra care & monitoring.' }; }
    else if (scoreBasedRisk === 'moderate') { return { level: 'मध्यम / Moderate', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', message: assessmentReason ? `${assessmentReason} लक्षणों पर ध्यान दें / Monitor symptoms.` : 'Moderate risk indicators detected. Monitor symptoms.' }; }
    else { return { level: 'कम / Low', color: 'bg-green-100 text-green-800 border-green-200', message: 'अच्छी स्थिति में / Continue wellness practices.' }; }
  };
  // --- End Calculation Functions ---

  // --- Smart Quick Actions Logic ---
  const getSuggestedActions = () => {
    const suggestions: Array<{
      id: string;
      label: string;
      icon: ReactElement;
      onClick: () => void;
    }> = [];
    const risk = getRiskLevel().level;
    const trend = progressData?.sessions.emotionalTrend;

    // 1. Prioritize Crisis / High Stress
    if (risk.includes('High') || risk.includes('Moderate')) {
      suggestions.push({
        id: 'calm-down',
        label: t.actions.calmDown[langKey] || t.actions.calmDown['en'],
        icon: <Brain className="w-4 h-4" />,
        onClick: () => navigateTo && navigateTo('breathing')
      });
      suggestions.push({
        id: 'ai-companion',
        label: t.actions.talkToCompanion[langKey] || t.actions.talkToCompanion['en'],
        icon: <Heart className="w-4 h-4" />,
        onClick: () => navigateTo && navigateTo('companion')
      });
    }

    // 2. Prioritize Declining Trend
    if (trend === 'declining') {
      suggestions.push({
        id: 'journal',
        label: t.actions.writeJournal[langKey] || t.actions.writeJournal['en'],
        icon: <BookOpen className="w-4 h-4" />,
        onClick: () => navigateTo && navigateTo('journal')
      });
    }

    // 3. Add default actions if space allows
    if (suggestions.length < 2) {
      suggestions.push({
        id: 'ai-companion',
        label: t.actions.talkToCompanion[langKey] || t.actions.talkToCompanion['en'],
        icon: <MessageCircle className="w-4 h-4" />,
        onClick: () => navigateTo && navigateTo('companion')
      });
    }
    if (suggestions.length < 3) {
      suggestions.push({
        id: 'assessment',
        label: t.actions.takeAssessment[langKey] || t.actions.takeAssessment['en'],
        icon: <BarChart3 className="w-4 h-4" />,
        onClick: () => navigateTo && navigateTo('assessment')
      });
    }
    if (suggestions.length < 4) {
      suggestions.push({
        id: 'voice-session',
        label: t.actions.startVoiceSession[langKey] || t.actions.startVoiceSession['en'],
        icon: <Activity className="w-4 h-4" />,
        onClick: () => navigateTo && navigateTo('therapy')
      });
    }

    return suggestions.slice(0, 4); // Return the top 4 relevant actions
  };

  const suggestedActions = getSuggestedActions();
  // --- End Smart Actions Logic ---

  // --- Helper function to extract meaningful topics from sessions and conversations ---
  const extractSessionTopics = async (sessions: any[], conversations: any[]): Promise<string[]> => {
    const topics: string[] = [];

    // Add session types (existing logic)
    sessions.forEach(session => {
      if (session.sessionType && session.sessionType !== 'chat') {
        topics.push(session.sessionType);
      }
    });

    // Extract topics from conversation titles and recent messages
    conversations.forEach(conversation => {
      if (conversation.title) {
        // Simple keyword extraction from conversation titles
        const title = conversation.title.toLowerCase();
        if (title.includes('family') || title.includes('परिवार')) topics.push('family');
        if (title.includes('work') || title.includes('काम') || title.includes('job')) topics.push('work stress');
        if (title.includes('relationship') || title.includes('रिश्ता')) topics.push('relationships');
        if (title.includes('anxiety') || title.includes('चिंता')) topics.push('anxiety');
        if (title.includes('depression') || title.includes('अवसाद')) topics.push('depression');
        if (title.includes('sleep') || title.includes('नींद')) topics.push('sleep issues');
        if (title.includes('stress') || title.includes('तनाव')) topics.push('stress management');
      }
    });

    // If we have recent conversations, try to extract topics from recent messages
    if (conversations.length > 0 && conversations[0].messages) {
      const recentMessages = conversations[0].messages.slice(-5); // Last 5 messages
      const messageText = recentMessages.map(msg => msg.content || '').join(' ').toLowerCase();

      // Simple keyword-based topic extraction
      if (messageText.includes('family') || messageText.includes('परिवार')) topics.push('family concerns');
      if (messageText.includes('work') || messageText.includes('office') || messageText.includes('boss')) topics.push('workplace issues');
      if (messageText.includes('money') || messageText.includes('financial') || messageText.includes('पैसा')) topics.push('financial stress');
      if (messageText.includes('health') || messageText.includes('स्वास्थ्य')) topics.push('health concerns');
      if (messageText.includes('future') || messageText.includes('career') || messageText.includes('भविष्य')) topics.push('future planning');
    }

    // Remove duplicates and return top 5 most relevant topics
    return [...new Set(topics)].slice(0, 5);
  };


  // --- Loading State ---
  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        {/* Skeleton Loader */}
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }
  // --- End Loading State ---


  // --- Calculate scores after loading ---
  const wellnessScore = getWellnessScore();
  const riskAssessment = getRiskLevel();

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            {t.greeting[langKey] || t.greeting['en']} {userProfile?.displayName}!
          </h1>
          <p className="text-sm md:text-base text-gray-600">{t.title[langKey] || t.title['en']}</p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex flex-wrap gap-2 items-center">
          {(['week', 'month', 'year'] as const).map((period) => (
            <Button
              key={period}
              variant={timeframe === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeframe(period)}
              className="capitalize text-xs md:text-sm px-2 md:px-3"
            >
              {period === 'week' ? 'Week' :
                period === 'month' ? 'Month' :
                  'Year'}
            </Button>
          ))}

          {/* Data Refresh Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              try {
                toast.info('Refreshing dashboard data...');
                await loadDashboardData(); // Reload data
                toast.success('Dashboard refreshed!');
              } catch (error) {
                console.error('Refresh error:', error);
                toast.error('Failed to refresh data');
              }
            }}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 md:px-3"
            title="Refresh dashboard data"
          >
            🔄 <span className="hidden md:inline">Refresh</span>
          </Button>

          {/* Development Helper - Remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                toast.info('💡 To populate your dashboard:\n1. Go to /assessment - Complete PHQ-9 & GAD-7\n2. Go to /emotion - Click "Analyze Now" 5+ times\n3. Go to /voice - Complete therapy sessions', {
                  duration: 8000
                });
              }}
              className="text-xs text-blue-500 hover:text-blue-700"
              title="Show data generation tips"
            >
              💡 Tips
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* --- Wellness Score Card (Unchanged) --- */}
        <Tooltip>
          <TooltipTrigger> {/* Removed asChild */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 cursor-help">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">{t.wellnessScore[langKey] || t.wellnessScore['en']}</p>
                  <p className="text-2xl font-bold text-blue-900">{wellnessScore}/100</p>
                  <p className="text-xs text-blue-700">
                    {wellnessScore >= 80 ? 'Excellent' : wellnessScore >= 60 ? 'Good' : wellnessScore >= 40 ? 'Fair' : 'Needs Attention'}
                  </p>
                </div> <Heart className="w-8 h-8 text-blue-500" />
              </div>
            </Card>
          </TooltipTrigger>
          <TooltipContent><p className="text-xs max-w-xs">...</p></TooltipContent>
        </Tooltip>
        {/* --- Sessions Card (Unchanged) --- */}
        <Tooltip>
          <TooltipTrigger> {/* Removed asChild */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 cursor-help">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">{t.sessions[langKey] || t.sessions['en']}</p>
                  <p className="text-2xl font-bold text-blue-900">{progressData?.sessions.total || 0}</p>
                  <p className="text-xs text-blue-700">Avg: {Math.round((progressData?.sessions.averageDuration || 0) / 60000)} min</p>
                </div> <Clock className="w-8 h-8 text-blue-500" />
              </div>
            </Card>
          </TooltipTrigger>
          <TooltipContent><p className="text-xs max-w-xs">...</p></TooltipContent>
        </Tooltip>

        {/* --- Emotional Trend Card (Chart Added) --- */}
        <Tooltip>
          <TooltipTrigger> {/* Removed asChild */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 cursor-help">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">{t.emotionalTrend[langKey] || t.emotionalTrend['en']}</p>
                  <p className="text-lg font-bold text-blue-900 capitalize flex items-center gap-1">
                    {/* Trend Icons */}
                    {progressData?.sessions.emotionalTrend === 'improving' && <TrendingUp className="w-5 h-5 text-green-600" />}
                    {progressData?.sessions.emotionalTrend === 'declining' && <TrendingDown className="w-5 h-5 text-red-600" />}
                    {progressData?.sessions.emotionalTrend === 'stable' && <Minus className="w-5 h-5 text-gray-500" />}
                    {progressData?.sessions.emotionalTrend || 'Stable'}
                  </p>
                  <p className="text-xs text-blue-700">
                    {/* Trend Text */}
                    {progressData?.sessions.emotionalTrend === 'improving' ? '📈 बेहतर हो रहा / Improving' : progressData?.sessions.emotionalTrend === 'declining' ? '📉 ध्यान दें / Needs attention' : '➡️ स्थिर / Stable'}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
              {/* --- Emotional Trend Chart --- */}
              <div className="mt-4 h-20 w-full">
                {emotionalTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={emotionalTrendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#4b5563' }} axisLine={false} tickLine={false} />
                      <YAxis hide={true} domain={[0, 1]} />
                      <ChartTooltip contentStyle={{ fontSize: 12, padding: '4px 8px', borderRadius: '6px', border: '1px solid #e5e7eb' }} labelStyle={{ fontWeight: 'bold', color: '#1f2937' }} itemStyle={{ color: '#10b981' }} />
                      <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-gray-500">
                    No emotion data available
                  </div>
                )}
              </div>
              {/* --- End Chart --- */}
            </Card>
          </TooltipTrigger>
          <TooltipContent><p className="text-xs max-w-xs">...</p></TooltipContent>
        </Tooltip>

        {/* --- Risk Assessment Card (Unchanged) --- */}
        <Tooltip>
          <TooltipTrigger> {/* Removed asChild */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 cursor-help">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">{t.riskIndicator[langKey] || t.riskIndicator['en']}</p>
                  <p className={`text-lg font-bold ${riskAssessment.level.includes('High') ? 'text-red-900' : riskAssessment.level.includes('Moderate') ? 'text-yellow-900' : 'text-green-900'}`}> {riskAssessment.level} </p>
                  <p className="text-xs text-blue-700">{riskAssessment.message}</p>
                </div> <Shield className="w-8 h-8 text-blue-500" />
              </div>
            </Card>
          </TooltipTrigger>
          <TooltipContent><p className="text-xs max-w-xs">...</p></TooltipContent>
        </Tooltip>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* --- Recent Sessions (Unchanged) --- */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          {/* ... (Existing Recent Sessions JSX) ... */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Clock className="w-5 h-5 text-blue-500" /><span className="text-blue-700">{t.recentSessions[langKey] || t.recentSessions['en']}</span></h3>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">{recentSessions.length} sessions</Badge>
          </div>
          {/* ... */}
        </Card>

        {/* --- Assessment Scores Card (Charts Added) --- */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-500" />
              {t.assessmentScores[langKey] || t.assessmentScores['en']}
            </h3>
            <Button variant="outline" size="sm" onClick={() => navigateTo && navigateTo('assessment')} className="border-primary/30 hover:bg-primary/5 text-primary">
              Take Assessment
            </Button>
          </div>

          <div className="space-y-4">
            {/* PHQ-9 Score */}
            <Tooltip>
              <TooltipTrigger> {/* Removed asChild */}
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 rounded-lg cursor-help">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-blue-900">PHQ-9 (Depression)</span>
                    <Badge variant={userProfile?.mentalHealthProfile?.phq9Score === undefined || userProfile.mentalHealthProfile.phq9Score === null ? 'secondary' : userProfile.mentalHealthProfile.phq9Score < 5 ? 'default' : userProfile.mentalHealthProfile.phq9Score < 10 ? 'secondary' : 'destructive'}>
                      {userProfile?.mentalHealthProfile?.phq9Score ?? 'Not taken'}
                    </Badge>
                  </div>
                  <div className="text-sm text-blue-700 flex items-center gap-1">
                    {/* Trend Icons/Text */}
                    {progressData?.assessments.progressTrend.phq9 === 'improving' && <TrendingUp className="w-4 h-4 text-green-600" />}
                    {progressData?.assessments.progressTrend.phq9 === 'declining' && <TrendingDown className="w-4 h-4 text-red-600" />}
                    {progressData?.assessments.progressTrend.phq9 === 'stable' && <Minus className="w-4 h-4 text-gray-500" />}
                    {progressData?.assessments.progressTrend.phq9 === 'insufficient_data' && <BarChart3 className="w-4 h-4 text-gray-500" />}
                    {progressData?.assessments.progressTrend.phq9 === 'improving' && 'Improving'}
                    {/* ... other trend text ... */}
                    {progressData?.assessments.progressTrend.phq9 === 'stable' && 'Stable'}
                    {progressData?.assessments.progressTrend.phq9 === 'declining' && 'Needs attention'}
                    {progressData?.assessments.progressTrend.phq9 === 'insufficient_data' && 'Take more assessments'}
                  </div>
                  {/* --- PHQ-9 History Chart --- */}
                  <div className="mt-3 h-20 w-full">
                    {assessmentHistoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={assessmentHistoryData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#4b5563' }} axisLine={false} tickLine={false} />
                          <YAxis hide={true} domain={[0, 27]} />
                          <ChartTooltip contentStyle={{ fontSize: 12, padding: '4px 8px', borderRadius: '6px', border: '1px solid #e5e7eb' }} labelStyle={{ fontWeight: 'bold', color: '#1f2937' }} itemStyle={{ color: '#3b82f6' }} />
                          <Line type="monotone" dataKey="phq9" name="PHQ-9" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} activeDot={{ r: 5 }} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-gray-500">
                        No PHQ-9 data available
                      </div>
                    )}
                  </div>
                  {/* --- End Chart --- */}
                </div>
              </TooltipTrigger>
              <TooltipContent><p className="text-xs max-w-xs">...</p></TooltipContent>
            </Tooltip>

            {/* GAD-7 Score */}
            <Tooltip>
              <TooltipTrigger> {/* Removed asChild */}
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 rounded-lg cursor-help">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-blue-900">GAD-7 (Anxiety)</span>
                    <Badge variant={userProfile?.mentalHealthProfile?.gad7Score === undefined || userProfile.mentalHealthProfile.gad7Score === null ? 'secondary' : userProfile.mentalHealthProfile.gad7Score < 5 ? 'default' : userProfile.mentalHealthProfile.gad7Score < 10 ? 'secondary' : 'destructive'}>
                      {userProfile?.mentalHealthProfile?.gad7Score ?? 'Not taken'}
                    </Badge>
                  </div>
                  <div className="text-sm text-blue-700 flex items-center gap-1">
                    {/* Trend Icons/Text */}
                    {progressData?.assessments.progressTrend.gad7 === 'improving' && <TrendingUp className="w-4 h-4 text-green-600" />}
                    {progressData?.assessments.progressTrend.gad7 === 'declining' && <TrendingDown className="w-4 h-4 text-red-600" />}
                    {progressData?.assessments.progressTrend.gad7 === 'stable' && <Minus className="w-4 h-4 text-gray-500" />}
                    {progressData?.assessments.progressTrend.gad7 === 'insufficient_data' && <BarChart3 className="w-4 h-4 text-gray-500" />}
                    {progressData?.assessments.progressTrend.gad7 === 'improving' && 'Improving'}
                    {/* ... other trend text ... */}
                    {progressData?.assessments.progressTrend.gad7 === 'stable' && 'Stable'}
                    {progressData?.assessments.progressTrend.gad7 === 'declining' && 'Needs attention'}
                    {progressData?.assessments.progressTrend.gad7 === 'insufficient_data' && 'Take more assessments'}
                  </div>
                  {/* --- GAD-7 History Chart --- */}
                  <div className="mt-3 h-20 w-full">
                    {assessmentHistoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={assessmentHistoryData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#4b5563' }} axisLine={false} tickLine={false} />
                          <YAxis hide={true} domain={[0, 21]} />
                          <ChartTooltip contentStyle={{ fontSize: 12, padding: '4px 8px', borderRadius: '6px', border: '1px solid #e5e7eb' }} labelStyle={{ fontWeight: 'bold', color: '#1f2937' }} itemStyle={{ color: '#8b5cf6' }} />
                          <Line type="monotone" dataKey="gad7" name="GAD-7" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3, fill: '#8b5cf6' }} activeDot={{ r: 5 }} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-gray-500">
                        No GAD-7 data available
                      </div>
                    )}
                  </div>
                  {/* --- End Chart --- */}
                </div>
              </TooltipTrigger>
              <TooltipContent><p className="text-xs max-w-xs">...</p></TooltipContent>
            </Tooltip>
          </div>
        </Card>
      </div>

      {/* --- Insights and Recommendations --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* --- NEW: Today's AI Insight Card --- */}
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center mb-4">
            <Lightbulb className="w-5 h-5 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-green-900">{t.todaysInsight[langKey] || t.todaysInsight['en']}</h3>
          </div>
          <div className="space-y-3">
            {aiInsight ? (
              <p className="text-sm text-green-800 italic leading-relaxed">
                "{aiInsight}"
              </p>
            ) : (
              // Skeleton loader for the insight text
              <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-green-200 rounded w-full"></div>
                <div className="h-4 bg-green-200 rounded w-5/6"></div>
              </div>
            )}
          </div>
        </Card>
        {/* --- END: Today's AI Insight Card --- */}

        {/* Quick Actions Card */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <Activity className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">{t.quickActions[langKey] || t.quickActions['en']}</h3>
          </div>
          <div className="space-y-3">
            {suggestedActions.map((action, index) => (
              <Button
                key={action.id}
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={action.onClick}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity Card */}
      {(latestJournal.length > 0 || latestConvo.length > 0) && (
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <BookOpen className="w-5 h-5 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">{t.recentActivity[langKey] || t.recentActivity['en']}</h3>
          </div>
          <div className="space-y-4">
            {latestJournal.length > 0 && (
              <div
                className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => navigateTo && navigateTo('journal')}
              >
                <p className="text-xs font-medium text-gray-500 mb-1">
                  {langKey === 'hi' ? 'अंतिम डायरी प्रविष्टि' : langKey === 'mr' ? 'शेवटची डायरी नोंद' : 'Last Journal Entry'}
                </p>
                <p className="text-sm text-gray-800 truncate">{latestJournal[0].content}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(latestJournal[0].createdAt).toLocaleDateString()}
                </p>
              </div>
            )}
            {latestConvo.length > 0 && (
              <div
                className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => navigateTo && navigateTo('companion')}
              >
                <p className="text-xs font-medium text-gray-500 mb-1">
                  {langKey === 'hi' ? 'अंतिम बातचीत' : langKey === 'mr' ? 'शेवटचे संभाषण' : 'Last Conversation'}
                </p>
                <p className="text-sm text-gray-800 truncate">{latestConvo[0].title || 'Conversation with AI Companion'}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(latestConvo[0].createdAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* --- Crisis Events (Unchanged) --- */}
      {crisisEvents.length > 0 && (
        <Card className="p-6 bg-red-50 border-red-200">
          {/* ... (Existing Crisis Events JSX) ... */}
        </Card>
      )}
    </div>
  );
};