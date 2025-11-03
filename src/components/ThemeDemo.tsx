import { useTheme } from '../contexts/ThemeContext';
import { ThemeSelector } from './ThemeSelector';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ThemeDebug } from './ThemeDebug';

export function ThemeDemo() {
  const { currentTheme } = useTheme();

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            🎨 Theme System Demo
          </h1>
          <p className="text-lg opacity-80">
            Experience the power of dynamic theming with WhatsApp, Forest, and Ocean themes
          </p>
          <div className="mt-4 p-3 rounded-lg bg-black/10 backdrop-blur-sm">
            <span className="text-sm font-medium">Current Theme: </span>
            <span className="text-lg font-bold capitalize">{currentTheme}</span>
          </div>
        </div>

        <ThemeSelector />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Theme Info Card */}
          <Card className={`p-6 ${currentTheme === 'whatsapp' ? 'whatsapp-card' :
            currentTheme === 'forest' ? 'card' :
              currentTheme === 'ocean' ? 'ocean-card' :
                'bg-white shadow-lg'
            }`}>
            <CardHeader>
              <CardTitle className="text-xl font-semibold mb-4">
                Theme Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Active Theme: </span>
                  <span className="capitalize font-bold">{currentTheme}</span>
                </div>
                <div>
                  <span className="font-medium">Description: </span>
                  <span className="text-sm">
                    {currentTheme === 'whatsapp' && 'Familiar green messaging theme'}
                    {currentTheme === 'forest' && 'Calming nature-inspired design'}
                    {currentTheme === 'ocean' && 'Serene blue glassmorphism theme'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Elements Card */}
          <Card className={`p-6 ${currentTheme === 'whatsapp' ? 'whatsapp-card' :
            currentTheme === 'forest' ? 'card' :
              currentTheme === 'ocean' ? 'ocean-card' :
                'bg-white shadow-lg'
            }`}>
            <CardHeader>
              <CardTitle className="text-xl font-semibold mb-4">
                Interactive Elements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className={
                  currentTheme === 'forest' ? 'button-primary' :
                    currentTheme === 'ocean' ? 'ocean-button-primary' :
                      'bg-green-600 hover:bg-green-700 text-white'
                }>
                  Primary Button
                </Button>
                <Button variant="outline" className="w-full">
                  Secondary Button
                </Button>
                <div className="p-3 rounded-lg bg-black/5 border">
                  <p className="text-sm">This is a sample text block that adapts to the current theme.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Color Palette Card */}
          <Card className={`p-6 ${currentTheme === 'whatsapp' ? 'whatsapp-card' :
            currentTheme === 'forest' ? 'card' :
              currentTheme === 'ocean' ? 'ocean-card' :
                'bg-white shadow-lg'
            }`}>
            <CardHeader>
              <CardTitle className="text-xl font-semibold mb-4">
                Color Palette
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {currentTheme === 'whatsapp' && (
                  <>
                    <div className="w-full h-8 bg-green-600 rounded" title="WhatsApp Green"></div>
                    <div className="w-full h-8 bg-green-500 rounded" title="Light Green"></div>
                    <div className="w-full h-8 bg-green-700 rounded" title="Dark Green"></div>
                  </>
                )}
                {currentTheme === 'forest' && (
                  <>
                    <div className="w-full h-8 bg-green-500 rounded" title="Forest Primary"></div>
                    <div className="w-full h-8 bg-green-400 rounded" title="Forest Secondary"></div>
                    <div className="w-full h-8 bg-lime-400 rounded" title="Forest Accent"></div>
                  </>
                )}
                {currentTheme === 'ocean' && (
                  <>
                    <div className="w-full h-8 bg-blue-500 rounded" title="Ocean Primary"></div>
                    <div className="w-full h-8 bg-sky-400 rounded" title="Ocean Secondary"></div>
                    <div className="w-full h-8 bg-cyan-400 rounded" title="Ocean Accent"></div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Theme Features Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Theme Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 rounded-lg bg-white/10 backdrop-blur-sm">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-semibold mb-2">WhatsApp Theme</h3>
              <p className="text-sm opacity-80">Familiar messaging interface with green accents and beige backgrounds</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-white/10 backdrop-blur-sm">
              <div className="text-4xl mb-4">🌲</div>
              <h3 className="text-lg font-semibold mb-2">Forest Theme</h3>
              <p className="text-sm opacity-80">Calming nature-inspired design with green gradients and natural elements</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-white/10 backdrop-blur-sm">
              <div className="text-4xl mb-4">🌊</div>
              <h3 className="text-lg font-semibold mb-2">Ocean Theme</h3>
              <p className="text-sm opacity-80">Serene blue theme with glassmorphism effects and ocean-inspired colors</p>
            </div>
          </div>
        </div>
      </div>
      <ThemeDebug />
    </div>
  );
}