import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
// --- Import Recharts Components ---
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip as ChartTooltip } from 'recharts';
// --- Import Icons ---
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Heart,
  Activity,
  Shield,
  Clock
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
// --- End Interfaces ---


export const AdvancedDashboard: React.FC<AdvancedDashboardProps> = ({ userId, navigateTo }) => {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const [recentSessions, setRecentSessions] = useState<any[]>([]); // Define a more specific type if possible
  const [crisisEvents, setCrisisEvents] = useState<any[]>([]); // Define a more specific type if possible

  const { userProfile } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, [userId, timeframe]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load progress analytics with chart data
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
        {/* --- Wellness Score Card (Unchanged) --- */}
        <Tooltip>
          <TooltipTrigger> {/* Removed asChild */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 cursor-help">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Wellness Score</p>
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
                  <p className="text-sm font-medium text-blue-600">Sessions</p>
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
                  <p className="text-sm font-medium text-blue-600">Emotional Trend</p>
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
                  <p className="text-sm font-medium text-blue-600">Clinical Risk Indicator</p>
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
              <h3 className="text-lg font-semibold flex items-center gap-2"><Clock className="w-5 h-5 text-blue-500" /><span className="text-blue-700">Recent Sessions</span></h3>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">{recentSessions.length} sessions</Badge>
            </div>
             {/* ... */}
        </Card>

        {/* --- Assessment Scores Card (Charts Added) --- */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-500" />
              Assessment Scores
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
                    <Badge variant={ userProfile?.mentalHealthProfile?.phq9Score === undefined || userProfile.mentalHealthProfile.phq9Score === null ? 'secondary' : userProfile.mentalHealthProfile.phq9Score < 5 ? 'default' : userProfile.mentalHealthProfile.phq9Score < 10 ? 'secondary' : 'destructive' }>
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
                    <Badge variant={ userProfile?.mentalHealthProfile?.gad7Score === undefined || userProfile.mentalHealthProfile.gad7Score === null ? 'secondary' : userProfile.mentalHealthProfile.gad7Score < 5 ? 'default' : userProfile.mentalHealthProfile.gad7Score < 10 ? 'secondary' : 'destructive' }>
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

      {/* --- Insights and Recommendations (Unchanged) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* ... (Existing Personal Insights JSX) ... */}
         {/* ... (Existing Quick Actions JSX) ... */}
      </div>

      {/* --- Crisis Events (Unchanged) --- */}
      {crisisEvents.length > 0 && (
         <Card className="p-6 bg-red-50 border-red-200">
           {/* ... (Existing Crisis Events JSX) ... */}
         </Card>
      )}
    </div>
  );
};