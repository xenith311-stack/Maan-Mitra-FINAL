import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Heart,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { AuthButton } from './AuthButton';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';
import './animations.css';

interface SignInFormProps {
  onSwitchToSignUp: () => void;
  onSuccess: () => void;
}

export const SignInForm: React.FC<SignInFormProps> = ({
  onSwitchToSignUp,
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [capsLockOn, setCapsLockOn] = useState(false);

  const { signIn, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setPasswordError('');
    setLoading(true);

    try {
      // lightweight client-side validation for clarity
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setEmailError('Please enter a valid email address');
        throw new Error('Invalid email');
      }
      if (password.length < 6) {
        setPasswordError('Password should be at least 6 characters');
        throw new Error('Weak password');
      }
      await signIn(email, password);
      toast.success('स्वागत है! / Welcome back!');
      onSuccess();
    } catch (error: any) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      toast.success(
        'Google से सफलतापूर्वक लॉगिन! / Successfully signed in with Google!'
      );
      onSuccess();
    } catch (error: any) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20"></div>
        {/* Floating Orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-indigo-500/25 to-purple-500/25 rounded-full blur-2xl animate-pulse delay-500"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div className="w-full flex flex-col justify-center px-16 py-12 relative overflow-hidden">
          {/* Glowing Border */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-indigo-500/10 backdrop-blur-3xl border-r border-white/10"></div>

          <div className="relative z-10">
            {/* Animated Logo */}
            <div className="mb-12 group">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-purple-500/25 group-hover:shadow-purple-500/50 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                <Heart className="w-10 h-10 text-white animate-pulse" />
              </div>
              <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-blue-200 mb-4 tracking-tight animate-fade-in">
                MannMitra
              </h1>
              <p className="text-2xl text-purple-200 mb-8 font-light animate-fade-in delay-200">
                आपका मानसिक स्वास्थ्य साथी
              </p>
            </div>

            {/* Animated Description */}
            <div className="mb-12 animate-fade-in delay-300">
              <p className="text-xl text-gray-300 leading-relaxed mb-8 font-light">
                Experience the future of mental wellness with our AI-powered companion designed for Indian youth.
              </p>
            </div>

            {/* Animated Features */}
            <div className="space-y-6">
              {[
                { icon: "🤖", text: "24/7 AI Companion Support", delay: "delay-500" },
                { icon: "🚨", text: "Crisis Detection & Intervention", delay: "delay-700" },
                { icon: "🗣️", text: "Hindi/English/Hinglish Support", delay: "delay-900" },
                { icon: "📊", text: "Professional-Grade Analytics", delay: "delay-1000" }
              ].map((feature, index) => (
                <div key={index} className={`flex items-center space-x-4 animate-slide-in-left ${feature.delay} group hover:translate-x-2 transition-transform duration-300`}>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/10 group-hover:border-purple-400/50 transition-all duration-300">
                    <span className="text-xl">{feature.icon}</span>
                  </div>
                  <span className="text-white/90 text-lg font-medium">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="mt-12 p-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm rounded-2xl border border-white/10 animate-fade-in delay-1200">
              <p className="text-purple-200 italic mb-3">
                "MannMitra transformed my mental health journey. The AI understands me better than I understand myself."
              </p>
              <p className="text-purple-300 text-sm font-semibold">- Arjun, 19, Mumbai</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-lg animate-fade-in delay-300">
          <Card className="p-10 bg-black/40 backdrop-blur-2xl shadow-2xl border border-white/20 rounded-3xl hover:border-purple-400/50 transition-all duration-500 hover:shadow-purple-500/25">
            {/* Mobile Header */}
            <div className="text-center mb-10 lg:hidden">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/25 animate-bounce">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-200 mb-3">MannMitra</h1>
              <p className="text-gray-300">Your mental wellness companion</p>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block text-center mb-10">
              <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-blue-200 mb-4 animate-fade-in">
                Welcome Back
              </h2>
              <p className="text-gray-300 text-lg animate-fade-in delay-200">
                Sign in to continue your wellness journey
              </p>
              <p className="mt-2 inline-block text-[10px] text-purple-300 px-2 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">UI v2</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-3 backdrop-blur-sm animate-shake">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-red-300 font-medium">Sign In Error</p>
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleSubmit} className="space-y-6" noValidate aria-labelledby="signin-title">
              {/* Email Field */}
              <div className="group">
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-3 group-focus-within:text-purple-300 transition-colors">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-400 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    placeholder="your.email@example.com"
                    className={`pl-12 pr-4 py-4 bg-white/5 border ${emailError ? 'border-red-400/60 focus:border-red-400 focus:ring-red-400/20' : 'border-white/20 focus:border-purple-400 focus:ring-purple-400/20'} focus:ring-2 rounded-xl transition-all duration-300 text-white placeholder-gray-400 backdrop-blur-sm hover:bg-white/10 focus:bg-white/10`}
                    required
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? 'email-error' : undefined}
                    disabled={loading}
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 via-purple-500/0 to-purple-500/0 group-focus-within:from-purple-500/10 group-focus-within:via-transparent group-focus-within:to-blue-500/10 transition-all duration-500 pointer-events-none"></div>
                </div>
                {emailError && (
                  <p id="email-error" className="mt-2 text-xs text-red-400">{emailError}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="group">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-3 group-focus-within:text-purple-300 transition-colors">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-400 transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder="Your password"
                    className={`pl-12 pr-12 py-4 bg-white/5 border ${passwordError ? 'border-red-400/60 focus:border-red-400 focus:ring-red-400/20' : 'border-white/20 focus:border-purple-400 focus:ring-purple-400/20'} focus:ring-2 rounded-xl transition-all duration-300 text-white placeholder-gray-400 backdrop-blur-sm hover:bg-white/10 focus:bg-white/10`}
                    required
                    onKeyUp={(e) => setCapsLockOn((e as any).getModifierState && (e as any).getModifierState('CapsLock'))}
                    aria-invalid={!!passwordError}
                    aria-describedby={passwordError ? 'password-error' : undefined}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-400 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 via-purple-500/0 to-purple-500/0 group-focus-within:from-purple-500/10 group-focus-within:via-transparent group-focus-within:to-blue-500/10 transition-all duration-500 pointer-events-none"></div>
                </div>
                {capsLockOn && (
                  <p className="mt-2 text-xs text-amber-300">Caps Lock is on</p>
                )}
                {passwordError && (
                  <p id="password-error" className="mt-2 text-xs text-red-400">{passwordError}</p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-purple-500 bg-white/10 border-white/30 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-purple-400 hover:text-purple-300 font-medium hover:underline transition-colors"
                  onClick={() => toast.info('Password reset feature coming soon!')}
                >
                  Forgot Password?
                </button>
              </div>

              {/* Sign In Button */}
              <AuthButton
                type="submit"
                variant="primary"
                loading={loading}
                disabled={loading || !email || !password}
              >
                {loading ? 'Signing in...' : (
                  <>
                    Sign In
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </AuthButton>
            </form>

            {/* Divider */}
            <div className="my-8 flex items-center">
              <div className="flex-1 border-t border-white/20" />
              <span className="px-6 text-sm text-gray-400 bg-black/20 rounded-full py-2">or continue with</span>
              <div className="flex-1 border-t border-white/20" />
            </div>

            {/* Google Sign In */}
            <AuthButton
              onClick={handleGoogleSignIn}
              variant="secondary"
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Connecting...' : (
                <>
                  <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </AuthButton>

            {/* Switch to Sign Up */}
            <div className="mt-8 text-center">
              <p className="text-gray-300">
                New to MannMitra?{' '}
                <button
                  onClick={onSwitchToSignUp}
                  className="text-purple-400 hover:text-purple-300 font-bold hover:underline transition-all duration-300 hover:scale-105 inline-block"
                  disabled={loading}
                >
                  Create Account
                </button>
              </p>
            </div>

            {/* Terms & Privacy */}
            <p className="mt-4 text-center text-[11px] text-gray-400">
              By signing in, you agree to our <span className="text-purple-300 hover:text-purple-200 cursor-pointer">Terms</span> and <span className="text-purple-300 hover:text-purple-200 cursor-pointer">Privacy Policy</span>.
            </p>

            {/* Help Text */}
            <div className="mt-8 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl backdrop-blur-sm">
              <p className="text-sm text-purple-200 text-center flex items-center justify-center">
                <Heart className="w-4 h-4 mr-2 text-pink-400 animate-pulse" />
                Your mental health mattersssss
              </p>
            </div>

            {/* Crisis Support */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400">
                In crisis? Call:{' '}
                <span className="font-bold text-red-400 hover:text-red-300 transition-colors cursor-pointer">9152987821</span> (24/7)
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
