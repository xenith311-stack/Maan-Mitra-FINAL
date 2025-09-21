import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  BarChart3,
  TrendingUp,
  Heart,
  Brain,

  Star,
  Target,
  Lightbulb,
  Activity,
  Shield,
  Users,
  Clock
} from 'lucide-react';
import { useAuth } from './auth/AuthProvider';
import { firebaseService } from '../services/firebaseService';
import { toast } from 'sonner';

interface AdvancedDashboardProps {
  userId: string;
  navigateTo?: (screen: string) => void;
}

interface ProgressData {
  timeframe: string;
  sessions: {
    total: number;
    averageDuration: number;
    emotionalTrend: string;
    engagementLevel: number;
  };
  assessments: {
    total: number;
    latestScores: {
      phq9: number | null;
      gad7: number | null;
    };
    progressTrend: {
      phq9: string;
      gad7: string;
    };
  };
  insights: string[];
}

export const AdvancedDashboard: React.FC<AdvancedDashboardProps> = ({ userId, navigateTo }) => {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [crisisEvents, setCrisisEvents] = useState<any[]>([]);

  const { userProfile } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, [userId, timeframe]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load progress analytics
      const analytics = await firebaseService.getUserProgressAnalytics(userId, timeframe);
      setProgressData(analytics);

      // Load recent sessions
      const sessions = await firebaseService.getUserSessions(userId, 5);
      setRecentSessions(sessions);

      // Load crisis events
      const crisis = await firebaseService.getUserCrisisEvents(userId);
      setCrisisEvents(crisis);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('डैशबोर्ड लोड करने में समस्या / Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getWellnessScore = (): number => {
    if (!progressData) return 0;

    const sessionScore = Math.min(progressData.sessions.total * 10, 40);
    const engagementScore = progressData.sessions.engagementLevel * 30;
    const trendScore = progressData.sessions.emotionalTrend === 'improving' ? 30 :
      progressData.sessions.emotionalTrend === 'stable' ? 20 : 10;

    return Math.round(sessionScore + engagementScore + trendScore);
  };

  const getRiskLevel = (): { level: string; color: string; message: string } => {
    const recentCrisis = crisisEvents.filter(event =>
      new Date(event.timestamp).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    if (recentCrisis.some(e => e.severity === 'severe')) {
      return {
        level: 'High',
        color: 'bg-red-100 text-red-800 border-red-200',
        message: 'कृपया professional help लें / Please seek professional help'
      };
    }

    if (recentCrisis.some(e => e.severity === 'high')) {
      return {
        level: 'Moderate',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        message: 'Extra care की जरूरत / Needs extra care'
      };
    }

    return {
      level: 'Low',
      color: 'bg-green-100 text-green-800 border-green-200',
      message: 'अच्छी स्थिति में / In good condition'
    };
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
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

  const wellnessScore = getWellnessScore();
  const riskAssessment = getRiskLevel();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            नमस्ते {userProfile?.displayName}! / Hello {userProfile?.displayName}!
          </h1>
          <p className="text-gray-600">आपकी मानसिक स्वास्थ्य यात्रा / Your mental wellness journey</p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex space-x-2">
          {(['week', 'month', 'year'] as const).map((period) => (
            <Button
              key={period}
              variant={timeframe === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeframe(period)}
              className="capitalize"
            >
              {period === 'week' ? 'सप्ताह / Week' :
                period === 'month' ? 'महीना / Month' :
                  'साल / Year'}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Wellness Score */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Wellness Score</p>
              <p className="text-2xl font-bold text-blue-900">{wellnessScore}/100</p>
              <p className="text-xs text-blue-700">
                {wellnessScore >= 80 ? 'Excellent' :
                  wellnessScore >= 60 ? 'Good' :
                    wellnessScore >= 40 ? 'Fair' : 'Needs Attention'}
              </p>
            </div>
            <Heart className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        {/* Sessions This Period */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Sessions</p>
              <p className="text-2xl font-bold text-blue-900">{progressData?.sessions.total || 0}</p>
              <p className="text-xs text-blue-700">
                Avg: {Math.round((progressData?.sessions.averageDuration || 0) / 60000)}min
              </p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        {/* Emotional Trend */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Emotional Trend</p>
              <p className="text-lg font-bold text-blue-900 capitalize">
                {progressData?.sessions.emotionalTrend || 'Stable'}
              </p>
              <p className="text-xs text-blue-700">
                {progressData?.sessions.emotionalTrend === 'improving' ? '📈 बेहतर हो रहा / Improving' :
                  progressData?.sessions.emotionalTrend === 'declining' ? '📉 ध्यान दें / Needs attention' :
                    '➡️ स्थिर / Stable'}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        {/* Risk Assessment */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Risk Level</p>
              <p className="text-lg font-bold text-blue-900">{riskAssessment.level}</p>
              <p className="text-xs text-blue-700">{riskAssessment.message}</p>
            </div>
            <Shield className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Recent Sessions */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-blue-700">Recent Sessions</span>
            </h3>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">{recentSessions.length} sessions</Badge>
          </div>

          <div className="space-y-3">
            {recentSessions.length > 0 ? (
              recentSessions.map((session) => (
                <div key={session.sessionId} className="flex items-center justify-between p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                  <div>
                    <p className="font-medium text-sm capitalize text-blue-700">{session.sessionType} Session</p>
                    <p className="text-xs text-blue-600">
                      {new Date(session.startTime).toLocaleDateString('en-IN')} •
                      {Math.round(session.duration / 60000)}min
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={session.outcomes?.overallMood === 'improved' ? 'default' : 'secondary'}
                      className={`text-xs ${session.outcomes?.overallMood === 'improved' ? 'bg-blue-100 text-blue-700' : 'bg-blue-50 text-blue-600'}`}
                    >
                      {session.outcomes?.overallMood || 'Completed'}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No sessions yet</p>
                <p className="text-sm">Start a conversation with your AI companion!</p>
              </div>
            )}
          </div>
        </Card>

        {/* Assessment Scores */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-500" />
              Assessment Scores
            </h3>
            <Button variant="outline" size="sm">
              Take Assessment
            </Button>
          </div>

          <div className="space-y-4">
            {/* PHQ-9 Score */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-blue-900">PHQ-9 (Depression)</span>
                <Badge variant={
                  !progressData?.assessments.latestScores.phq9 ? 'secondary' :
                    progressData.assessments.latestScores.phq9 < 5 ? 'default' :
                      progressData.assessments.latestScores.phq9 < 10 ? 'secondary' : 'destructive'
                }>
                  {progressData?.assessments.latestScores.phq9 || 'Not taken'}
                </Badge>
              </div>
              <div className="text-sm text-blue-700">
                {progressData?.assessments.progressTrend.phq9 === 'improving' && '📈 Improving'}
                {progressData?.assessments.progressTrend.phq9 === 'stable' && '➡️ Stable'}
                {progressData?.assessments.progressTrend.phq9 === 'declining' && '📉 Needs attention'}
                {progressData?.assessments.progressTrend.phq9 === 'insufficient_data' && '📊 Take more assessments'}
              </div>
            </div>

            {/* GAD-7 Score */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-blue-900">GAD-7 (Anxiety)</span>
                <Badge variant={
                  !progressData?.assessments.latestScores.gad7 ? 'secondary' :
                    progressData.assessments.latestScores.gad7 < 5 ? 'default' :
                      progressData.assessments.latestScores.gad7 < 10 ? 'secondary' : 'destructive'
                }>
                  {progressData?.assessments.latestScores.gad7 || 'Not taken'}
                </Badge>
              </div>
              <div className="text-sm text-blue-700">
                {progressData?.assessments.progressTrend.gad7 === 'improving' && '📈 Improving'}
                {progressData?.assessments.progressTrend.gad7 === 'stable' && '➡️ Stable'}
                {progressData?.assessments.progressTrend.gad7 === 'declining' && '📉 Needs attention'}
                {progressData?.assessments.progressTrend.gad7 === 'insufficient_data' && '📊 Take more assessments'}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Insights and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Insights */}
        <Card className="p-6 bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
          <div className="flex items-center mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-600 mr-2" />
            <h3 className="text-lg font-semibold text-yellow-900">Personal Insights</h3>
          </div>
          <div className="space-y-3">
            {progressData?.insights && progressData.insights.length > 0 ? (
              progressData.insights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <Star className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">{insight}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-yellow-700">
                Continue using MannMitra to generate personalized insights about your mental wellness journey.
              </p>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <Target className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => navigateTo && navigateTo('ai-companion')}
            >
              <Heart className="w-6 h-6 text-red-500" />
              <span className="text-sm">AI Companion</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => navigateTo && navigateTo('calm-down')}
            >
              <Brain className="w-6 h-6 text-purple-500" />
              <span className="text-sm">Calm Down</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => navigateTo && navigateTo('quiz')}
            >
              <BarChart3 className="w-6 h-6 text-blue-500" />
              <span className="text-sm">Take Quiz</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => navigateTo && navigateTo('journal')}
            >
              <Users className="w-6 h-6 text-green-500" />
              <span className="text-sm">Journal</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* Crisis Events (if any) */}
      {crisisEvents.length > 0 && (
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-center mb-4">
            <Shield className="w-5 h-5 text-red-600 mr-2" />
            <h3 className="text-lg font-semibold text-red-900">Recent Crisis Events</h3>
            <Badge variant="destructive" className="ml-2">{crisisEvents.length}</Badge>
          </div>
          <div className="space-y-3">
            {crisisEvents.slice(0, 3).map((event) => (
              <div key={event.eventId} className="p-3 bg-white rounded-lg border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-red-900 capitalize">{event.severity} Risk Event</p>
                    <p className="text-xs text-red-700">
                      {new Date(event.timestamp).toLocaleDateString('en-IN')} •
                      Status: {event.resolution}
                    </p>
                  </div>
                  <Badge variant={
                    event.resolution === 'resolved' ? 'default' :
                      event.resolution === 'monitoring' ? 'secondary' : 'destructive'
                  }>
                    {event.resolution}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-red-100 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Remember:</strong> If you're in crisis, please contact emergency services or call a helpline immediately.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};