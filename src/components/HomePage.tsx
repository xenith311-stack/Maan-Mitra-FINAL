
import { useNavigate } from 'react-router-dom';
import VantaBackground from './VantaBackground';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { BarChart, BookOpen, MessageCircle, Activity } from 'lucide-react';
// Import the meditation icon
const meditationIcon = new URL('../assets/819e0f5f94733abaa2536b7d855c8a7c099ea006.png', import.meta.url).href;
import type { Screen, UserData } from '../types';

interface HomePageProps {
  navigateTo?: (screen: Screen) => void;
  userData?: UserData;
}

export function HomePage({ navigateTo }: HomePageProps = {}) {
  const navigate = useNavigate();
  const go = (screen: string) => {
    switch (screen) {
      case 'stats':
        navigate('/analytics');
        break;
      case 'quiz':
        navigate('/quiz');
        break;
      case 'calm-down':
        navigate('/calm-down');
        break;
      case 'ai-companion':
        navigate('/companion');
        break;
      case 'journal':
        navigate('/journal');
        break;
      case 'dashboard':
        navigate('/dashboard');
        break;
      default:
        navigate('/');
    }
  };

  const onNav = (screen: string) => (navigateTo ? navigateTo(screen as any) : go(screen));

  return (
    <div className="relative p-6">
      <VantaBackground variant="local" />
      {/* Stats button in top-right */}
      <div className="absolute top-6 right-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNav('stats')}
          className="rounded-full border-primary/30 hover:bg-primary/5"
        >
          <BarChart className="w-4 h-4 mr-2" />
          Stats
        </Button>
      </div>

      {/* Central content */}
      <div className="flex flex-col items-center pt-12 md:pt-24 max-w-lg mx-auto px-4 md:px-6">
        {/* App name and central meditation icon */}
        <div className="text-center mb-8 md:mb-16 w-full">
          <h1 className="app-title text-3xl md:text-5xl mb-4 md:mb-8 text-foreground">MannMitra</h1>
          <div className="w-full max-w-xs md:max-w-sm mx-auto mb-6 md:mb-10 logo-container">
            <img
              src={meditationIcon}
              alt="MannMitra Logo"
              className="w-full h-48 md:h-80 object-contain logo-image"
            />
          </div>
          <h2 className="text-xl md:text-3xl mb-2 md:mb-4 text-foreground">Welcome back</h2>
          <p className="text-muted-foreground text-base md:text-lg">How are you feeling today?</p>
        </div>

        {/* Action buttons - positioned below the central element */}
        <div className="w-full space-y-3 md:space-y-4 max-w-sm">
          <Card className="p-4 md:p-6 hover:shadow-md transition-shadow cursor-pointer bg-card border-primary/20"
            onClick={() => onNav('quiz')}>
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Activity className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm md:text-base">Get Started Quiz</h3>
                <p className="text-xs md:text-sm text-muted-foreground">Quick wellness check-in</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6 hover:shadow-md transition-shadow cursor-pointer bg-card border-primary/20"
            onClick={() => onNav('calm-down')}>
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-secondary/50 rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm md:text-base">Calm-Down Session</h3>
                <p className="text-xs md:text-sm text-muted-foreground">5-minute guided breathing</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6 hover:shadow-md transition-shadow cursor-pointer bg-card border-primary/20"
            onClick={() => onNav('ai-companion')}>
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-accent/50 rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm md:text-base">AI मित्र / AI Companion</h3>
                <p className="text-xs md:text-sm text-muted-foreground">आपका सहायक साथी / Your supportive friend</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6 hover:shadow-md transition-shadow cursor-pointer bg-card border-primary/20"
            onClick={() => onNav('journal')}>
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-accent/50 rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm md:text-base">Journal & Vent</h3>
                <p className="text-xs md:text-sm text-muted-foreground">Express your thoughts</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Dashboard link at bottom */}
        <div className="mt-10">
          <Button
            variant="ghost"
            onClick={() => onNav('dashboard')}
            className="text-primary hover:bg-primary/10"
          >
            View Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

export default HomePage;