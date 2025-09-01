"use client";

import { useState, useEffect } from "react";

interface LoadingScreenProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export default function LoadingScreen({ onComplete, onSkip }: LoadingScreenProps) {
  const [loadingState, setLoadingState] = useState<'initializing' | 'loading' | 'ready'>('initializing');
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setLoadingState('loading');
    }, 800);

    return () => clearTimeout(timer1);
  }, []);

  useEffect(() => {
    if (loadingState === 'loading') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setLoadingState('ready');
            }, 300);
            return 100;
          }
          // Realistic pacing with some variation
          const increment = prev < 30 ? 2 : prev < 70 ? 1.5 : prev < 95 ? 0.8 : 0.3;
          return Math.min(prev + increment, 100);
        });
      }, 60);

      return () => clearInterval(interval);
    }
  }, [loadingState]);

  useEffect(() => {
    if (loadingState === 'ready') {
      const timer = setTimeout(() => {
        handleComplete();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [loadingState]);

  const handleComplete = () => {
    setIsExiting(true);
    setTimeout(() => {
      onComplete?.();
    }, 500);
  };

  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(() => {
      onSkip?.();
    }, 300);
  };

  return (
    <div 
      className={`fixed inset-0 z-50 transition-all duration-1000 ${
        isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      } overflow-hidden`}
      style={{ 
        background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)'
      }}
      role="main"
      aria-live="polite"
      aria-label="Game loading screen"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Particles */}
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 4}s`
            }}
          />
        ))}
        
        {/* Geometric Shapes */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-cyan-500/20 rotate-45 animate-spin" style={{ animationDuration: '20s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 border border-purple-500/20 rotate-12 animate-pulse" />
        <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-full animate-bounce" style={{ animationDuration: '3s' }} />
        
        {/* Gradient Orbs */}
        <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Skip button */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 text-sm text-gray-400 hover:text-cyan-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-800 rounded-lg px-3 py-2 backdrop-blur-sm bg-black/20 border border-gray-700/50 hover:border-cyan-400/50 hover:bg-black/40 hover:scale-105"
        aria-label="Skip loading screen"
      >
        Skip →
      </button>

      <div className="h-full flex items-center justify-center p-6 relative z-10">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center space-x-16 max-w-6xl w-full">
          {/* Brand Section */}
          <div className="flex-1 text-center relative">
            {/* Glowing background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 blur-3xl rounded-full" />
            
            <div className="relative">
              <h1 className={`font-heading text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-6 transition-all duration-1000 ${
                loadingState === 'initializing' 
                  ? 'opacity-70 scale-95 animate-pulse' 
                  : 'opacity-100 scale-100'
              }`}
              style={{
                textShadow: '0 0 30px rgba(34, 211, 238, 0.3), 0 0 60px rgba(168, 85, 247, 0.2)',
                filter: 'drop-shadow(0 4px 20px rgba(34, 211, 238, 0.4))'
              }}>
                <span className="block animate-float">ASYLUM</span>
                <span className="block animate-float-delayed text-gradient-shine">GAMING</span>
              </h1>
              
              {/* Animated underline */}
              <div className="w-32 h-1 bg-gradient-to-r from-cyan-400 to-purple-400 mx-auto mb-4 rounded-full animate-pulse" />
              
              <p className="text-gray-300 text-xl font-semibold tracking-widest uppercase animate-fade-in">
                🎮 Predict • Play • Win 🏆
              </p>
              
              {/* Floating icons */}
              <div className="absolute -top-10 -left-10 text-4xl animate-bounce" style={{ animationDelay: '0.5s' }}>🎯</div>
              <div className="absolute -top-10 -right-10 text-4xl animate-bounce" style={{ animationDelay: '1.5s' }}>⚡</div>
              <div className="absolute -bottom-10 left-10 text-4xl animate-bounce" style={{ animationDelay: '2s' }}>💎</div>
              <div className="absolute -bottom-10 right-10 text-4xl animate-bounce" style={{ animationDelay: '1s' }}>🚀</div>
            </div>
          </div>

          {/* Enhanced Loader Card */}
          <div className="bg-gradient-to-br from-gray-900/80 via-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl p-10 border border-gray-700/50 shadow-2xl min-w-[320px] relative overflow-hidden">
            {/* Card glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5 animate-pulse" />
            
            {/* Animated border */}
            <div className="absolute inset-0 rounded-3xl border-2 border-transparent bg-gradient-to-r from-cyan-400/30 via-purple-400/30 to-pink-400/30 bg-clip-border animate-spin" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-0.5 rounded-3xl bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-xl" />
            
            <div className="relative z-10">
              <LoaderContent 
                loadingState={loadingState} 
                progress={progress}
                onComplete={handleComplete}
              />
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex flex-col items-center space-y-12 text-center w-full max-w-sm relative">
          {/* Glowing background effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 blur-3xl rounded-full" />
          
          {/* Brand Section */}
          <div className="relative">
            <h1 className={`font-heading text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-6 transition-all duration-1000 ${
              loadingState === 'initializing' 
                ? 'opacity-70 scale-95 animate-pulse' 
                : 'opacity-100 scale-100'
            }`}
            style={{
              textShadow: '0 0 30px rgba(34, 211, 238, 0.3)',
              filter: 'drop-shadow(0 4px 20px rgba(34, 211, 238, 0.4))'
            }}>
              <span className="block animate-float">ASYLUM</span>
              <span className="block animate-float-delayed">GAMING</span>
            </h1>
            
            <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-purple-400 mx-auto mb-4 rounded-full animate-pulse" />
            
            <p className="text-gray-300 text-lg font-semibold tracking-wide uppercase">
              🎮 Predict • Play • Win 🏆
            </p>
          </div>

          {/* Enhanced Loader Card */}
          <div className="bg-gradient-to-br from-gray-900/80 via-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50 shadow-2xl w-full relative overflow-hidden">
            {/* Card effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5 animate-pulse" />
            <div className="absolute inset-0 rounded-3xl border border-transparent bg-gradient-to-r from-cyan-400/20 via-purple-400/20 to-pink-400/20 bg-clip-border" />
            
            <div className="relative z-10">
              <LoaderContent 
                loadingState={loadingState} 
                progress={progress}
                onComplete={handleComplete}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface LoaderContentProps {
  loadingState: 'initializing' | 'loading' | 'ready';
  progress: number;
  onComplete: () => void;
}

function LoaderContent({ loadingState, progress, onComplete }: LoaderContentProps) {
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="text-center">
      {loadingState === 'initializing' && (
        <div className="space-y-6">
          {/* Enhanced spinning loader */}
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-gray-600/30" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-400 border-r-purple-400 animate-spin" />
            <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-pink-400 border-l-cyan-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
            
            {/* Center glow */}
            <div className="absolute inset-4 rounded-full bg-gradient-to-r from-cyan-400/20 to-purple-400/20 animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <p className="text-cyan-400 text-lg font-semibold animate-pulse">⚡ Initializing System...</p>
            <div className="flex justify-center space-x-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {loadingState === 'loading' && (
        <div className="space-y-8">
          {/* Enhanced Progress Ring */}
          <div className="relative w-28 h-28 mx-auto">
            {/* Outer glow ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400/20 to-purple-400/20 blur-lg animate-pulse" />
            
            {/* Main progress ring */}
            <svg className="w-28 h-28 transform -rotate-90 relative z-10" viewBox="0 0 112 112">
              {/* Background ring */}
              <circle
                cx="56"
                cy="56"
                r="50"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-gray-600/40"
              />
              
              {/* Progress ring with gradient */}
              <circle
                cx="56"
                cy="56"
                r="50"
                stroke="url(#progressGradient)"
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - progress / 100)}`}
                className={`transition-all duration-300 ${
                  prefersReducedMotion ? '' : 'ease-out'
                }`}
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 10px rgba(34, 211, 238, 0.6))' }}
              />
              
              {/* Gradient definition */}
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="50%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 font-mono">
                  {Math.round(progress)}%
                </div>
                <div className="text-xs text-gray-400 font-medium tracking-wider uppercase animate-pulse">
                  Loading
                </div>
              </div>
            </div>
            
            {/* Animated particles around ring */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-ping"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${i * 45}deg) translateY(-60px)`,
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '2s'
                }}
              />
            ))}
          </div>

          {/* Progress Text with enhanced styling */}
          <div className="space-y-3">
            <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 tabular-nums">
              {Math.round(progress)}% Complete
            </p>
            <p className="text-cyan-400 text-sm font-medium animate-pulse">🔄 Loading Game Assets...</p>
            
            {/* Loading phases */}
            <div className="text-xs text-gray-400 space-y-1">
              <div className={`transition-all duration-300 ${progress > 20 ? 'text-cyan-400' : ''}`}>
                ✓ {progress > 20 ? 'Game Engine Loaded' : 'Loading Game Engine...'}
              </div>
              <div className={`transition-all duration-300 ${progress > 50 ? 'text-cyan-400' : ''}`}>
                ✓ {progress > 50 ? 'Assets Initialized' : 'Initializing Assets...'}
              </div>
              <div className={`transition-all duration-300 ${progress > 80 ? 'text-cyan-400' : ''}`}>
                ✓ {progress > 80 ? 'Connection Established' : 'Establishing Connection...'}
              </div>
            </div>
          </div>
        </div>
      )}

      {loadingState === 'ready' && (
        <div className={`space-y-6 transition-all duration-500 ${
          prefersReducedMotion ? '' : 'animate-in zoom-in-105'
        }`}>
          {/* Enhanced Success Icon */}
          <div className="relative w-20 h-20 mx-auto">
            {/* Glowing background */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-400/30 to-emerald-400/30 rounded-full blur-xl animate-pulse" />
            
            {/* Success ring */}
            <div className="relative w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl">
              <div className="text-white text-3xl font-bold animate-bounce">✓</div>
            </div>
            
            {/* Success particles */}
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-green-400 rounded-full animate-ping"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${i * 60}deg) translateY(-40px)`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
          
          <div className="space-y-3">
            <p className="text-green-400 font-bold text-xl animate-pulse">🎉 System Ready!</p>
            <p className="text-gray-300 text-sm animate-fade-in">🚀 Launching Game Experience...</p>
            
            {/* Ready indicator */}
            <div className="flex justify-center items-center space-x-2 text-xs text-gray-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>All systems operational</span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}