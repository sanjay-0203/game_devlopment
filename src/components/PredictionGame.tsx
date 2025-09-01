"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

type GameMode = "demo" | "live";
type RoundDuration = 10 | 15 | 20;
type PredictionType = "big" | "small" | "red" | "green" | "blue" | number;
type GamePhase = "betting" | "resolving" | "showing-result";

interface Prediction {
  type: PredictionType;
  category: "size" | "color" | "number";
  multiplier: number;
}

interface RoundResult {
  number: number;
  color: "red" | "green" | "blue";
  timestamp: number;
  duration: RoundDuration;
}

interface BettingActivity {
  id: string;
  playerName: string;
  betType: string;
  amount: number;
  timestamp: number;
}

interface GameState {
  currentRound: {
    duration: RoundDuration;
    timeRemaining: number;
    phase: GamePhase;
  };
  activePredictions: Prediction[];
  lockedPredictions: Prediction[];
  lastResult: RoundResult | null;
  history: RoundResult[];
  settings: {
    soundEnabled: boolean;
    animationsEnabled: boolean;
  };
  mode: GameMode;
  selectedDuration: RoundDuration;
  bettingActivity: BettingActivity[];
}

// Enhanced gambling colors with psychological impact
const COLOR_CLASSES = {
  red: "bg-gradient-to-br from-red-500 via-red-600 to-red-700 shadow-red-500/50",
  green: "bg-gradient-to-br from-emerald-500 via-green-600 to-green-700 shadow-green-500/50", 
  blue: "bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 shadow-blue-500/50"
};

const PREDICTION_MULTIPLIERS = {
  big: 1.9,
  small: 1.9,
  red: 2.8,
  green: 2.8,
  blue: 2.8,
  number: 9.0
};

// Random player names for betting activity
const PLAYER_NAMES = [
  "CryptoKing", "LuckyStar", "BetMaster", "GamePro", "WinnerX", "PredictorA1",
  "BullsEye", "ColorWiz", "NumberCruncher", "FortuneSeeker", "BigBettor", "SmallFish",
  "RedRanger", "GreenGuru", "BlueBlast", "MegaWin", "QuickBet", "SafePlay"
];

const BET_TYPES = ["Big", "Small", "Red", "Green", "Blue", "Number 7", "Number 3", "Number 9"];

export default function PredictionGame() {
  const [gameState, setGameState] = useState<GameState>({
    currentRound: {
      duration: 10,
      timeRemaining: 10,
      phase: "betting"
    },
    activePredictions: [],
    lockedPredictions: [],
    lastResult: null,
    history: [],
    settings: {
      soundEnabled: true,
      animationsEnabled: true
    },
    mode: "demo",
    selectedDuration: 10,
    bettingActivity: []
  });

  const [showHelp, setShowHelp] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<RoundResult | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const bettingActivityRef = useRef<NodeJS.Timeout | null>(null);

  // Generate random betting activity
  const generateBettingActivity = useCallback((): BettingActivity => {
    const playerName = PLAYER_NAMES[Math.floor(Math.random() * PLAYER_NAMES.length)];
    const betType = BET_TYPES[Math.floor(Math.random() * BET_TYPES.length)];
    const amount = Math.floor(Math.random() * 1000) + 10; // $10 - $1010
    
    return {
      id: `${Date.now()}-${Math.random()}`,
      playerName,
      betType,
      amount,
      timestamp: Date.now()
    };
  }, []);

  // Add betting activity periodically
  useEffect(() => {
    if (gameState.currentRound.phase === "betting" && gameState.currentRound.timeRemaining > 0) {
      bettingActivityRef.current = setInterval(() => {
        const newActivity = generateBettingActivity();
        setGameState(prev => ({
          ...prev,
          bettingActivity: [newActivity, ...prev.bettingActivity.slice(0, 4)] // Keep only 5 recent activities
        }));
      }, Math.random() * 3000 + 1000); // Random interval between 1-4 seconds
    }

    return () => {
      if (bettingActivityRef.current) {
        clearInterval(bettingActivityRef.current);
        bettingActivityRef.current = null;
      }
    };
  }, [gameState.currentRound.phase, gameState.currentRound.timeRemaining, generateBettingActivity]);

  // Generate truly independent random result for each round
  const generateResult = useCallback((): RoundResult => {
    // Use crypto.getRandomValues for true randomness if available, fallback to Math.random
    const getRandomInt = (max: number) => {
      if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
        const array = new Uint32Array(1);
        window.crypto.getRandomValues(array);
        return array[0] % max;
      }
      return Math.floor(Math.random() * max);
    };

    const number = getRandomInt(10);
    const colors: Array<"red" | "green" | "blue"> = ["red", "green", "blue"];
    const color = colors[getRandomInt(3)];
    
    return {
      number,
      color,
      timestamp: Date.now(),
      duration: gameState.currentRound.duration
    };
  }, [gameState.currentRound.duration]);

  // Check winning predictions
  const checkWinnings = useCallback((result: RoundResult, predictions: Prediction[]) => {
    const winners: Prediction[] = [];
    
    predictions.forEach(prediction => {
      let isWin = false;
      
      if (prediction.category === "size") {
        if (prediction.type === "big" && result.number >= 5) isWin = true;
        if (prediction.type === "small" && result.number < 5) isWin = true;
      } else if (prediction.category === "color") {
        if (prediction.type === result.color) isWin = true;
      } else if (prediction.category === "number") {
        if (prediction.type === result.number) isWin = true;
      }
      
      if (isWin) winners.push(prediction);
    });
    
    return winners;
  }, []);

  // Start new round with user's selected duration
  const startNewRound = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      currentRound: {
        duration: prev.selectedDuration,
        timeRemaining: prev.selectedDuration,
        phase: "betting"
      },
      activePredictions: [],
      lockedPredictions: [],
      bettingActivity: [] // Clear betting activity for new round
    }));
  }, []);

  // Change round duration immediately
  const changeDuration = useCallback((newDuration: RoundDuration) => {
    setGameState(prev => ({
      ...prev,
      selectedDuration: newDuration,
      // If in betting phase, immediately apply the new duration
      currentRound: prev.currentRound.phase === "betting" ? {
        ...prev.currentRound,
        duration: newDuration,
        timeRemaining: newDuration
      } : prev.currentRound
    }));
    
    toast.success(`⏱️ Round duration changed to ${newDuration} seconds!`);
  }, []);

  // End round and show result
  const endRound = useCallback(() => {
    const result = generateResult();
    const winners = checkWinnings(result, gameState.lockedPredictions);
    
    setGameState(prev => ({
      ...prev,
      currentRound: {
        ...prev.currentRound,
        phase: "showing-result"
      },
      lastResult: result,
      history: [result, ...prev.history.slice(0, 9)]
    }));

    if (winners.length > 0) {
      const totalWinnings = winners.reduce((sum, w) => sum + w.multiplier, 0);
      toast.success(`🎉 WINNER! ${winners.length} correct prediction${winners.length > 1 ? 's' : ''} • ${totalWinnings.toFixed(1)}x multiplier`, {
        style: {
          background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
          color: '#000',
          fontWeight: 'bold'
        }
      });
    } else if (gameState.lockedPredictions.length > 0) {
      toast.error("💔 Try again next round!", {
        style: {
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          color: '#fff'
        }
      });
    }

    // Auto start next round after result display
    setTimeout(() => {
      startNewRound();
    }, 3000);
  }, [gameState.lockedPredictions, generateResult, checkWinnings, startNewRound]);

  // Timer logic
  useEffect(() => {
    if (gameState.currentRound.phase === "betting") {
      intervalRef.current = setInterval(() => {
        setGameState(prev => {
          const newTime = prev.currentRound.timeRemaining - 1;
          
          if (newTime <= 0) {
            // Switch to resolving phase
            return {
              ...prev,
              currentRound: {
                ...prev.currentRound,
                timeRemaining: 0,
                phase: "resolving"
              },
              lockedPredictions: prev.activePredictions
            };
          }
          
          return {
            ...prev,
            currentRound: {
              ...prev.currentRound,
              timeRemaining: newTime
            }
          };
        });
      }, 1000);
    } else if (gameState.currentRound.phase === "resolving") {
      // Short delay before showing result
      setTimeout(() => {
        endRound();
      }, 1500);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [gameState.currentRound.phase, endRound]);

  // Add prediction
  const addPrediction = useCallback((type: PredictionType) => {
    if (gameState.currentRound.phase !== "betting" || gameState.currentRound.timeRemaining === 0) {
      toast.error("⏰ Betting is closed for this round");
      return;
    }

    let category: "size" | "color" | "number";
    if (type === "big" || type === "small") category = "size";
    else if (type === "red" || type === "green" || type === "blue") category = "color";
    else category = "number";

    const multiplier = typeof type === "number" ? PREDICTION_MULTIPLIERS.number : PREDICTION_MULTIPLIERS[type as keyof typeof PREDICTION_MULTIPLIERS];

    setGameState(prev => {
      // Remove existing predictions in same category
      const filtered = prev.activePredictions.filter(p => p.category !== category);
      
      return {
        ...prev,
        activePredictions: [...filtered, { type, category, multiplier }]
      };
    });
  }, [gameState.currentRound.phase, gameState.currentRound.timeRemaining]);

  // Place predictions
  const placePredictions = useCallback(() => {
    if (gameState.activePredictions.length === 0) {
      toast.error("🎯 Select at least one prediction");
      return;
    }

    if (gameState.currentRound.timeRemaining === 0) {
      toast.error("⏰ Time is up!");
      return;
    }

    setGameState(prev => ({
      ...prev,
      lockedPredictions: [...prev.activePredictions]
    }));

    toast.success(`🚀 ${gameState.activePredictions.length} prediction${gameState.activePredictions.length > 1 ? 's' : ''} placed!`, {
      style: {
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: '#fff'
      }
    });
  }, [gameState.activePredictions, gameState.currentRound.timeRemaining]);

  // Clear predictions
  const clearPredictions = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      activePredictions: []
    }));
  }, []);

  // Get timer urgency with enhanced color therapy
  const isUrgent = gameState.currentRound.timeRemaining <= 5 && gameState.currentRound.phase === "betting";
  const isCritical = gameState.currentRound.timeRemaining <= 3 && gameState.currentRound.phase === "betting";
  const progress = (gameState.currentRound.timeRemaining / gameState.currentRound.duration) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-red-950 p-4 flex items-center justify-center">
      <Card className="w-full max-w-5xl bg-gradient-to-br from-gray-900/95 via-black/90 to-red-950/85 backdrop-blur-xl border-2 border-amber-500/30 shadow-2xl shadow-amber-500/20">
        <div className="p-6 space-y-8">
          {/* Enhanced Header with Gambling Aesthetics */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full animate-pulse ${gameState.mode === 'live' ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-amber-400 shadow-lg shadow-amber-400/50'}`} />
                <Badge variant={gameState.mode === 'live' ? 'default' : 'secondary'} className="text-sm font-bold bg-gradient-to-r from-amber-600 to-yellow-600 text-black border-amber-400">
                  {gameState.mode === 'live' ? '🔴 LIVE CASINO' : '🎰 DEMO MODE'}
                </Badge>
              </div>
              <Badge variant="outline" className="text-sm bg-gradient-to-r from-red-600/20 to-amber-600/20 border-amber-500/50 text-amber-300 font-bold">
                🎯 {gameState.currentRound.duration}s Round
              </Badge>
            </div>

            {/* Enhanced Duration Mode Selector */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-black/60 to-red-950/60 p-2 rounded-xl border border-amber-500/30">
              <span className="text-amber-400 font-bold text-sm mr-2">⚡ SPEED:</span>
              {[10, 15, 20].map((duration) => (
                <Button
                  key={duration}
                  variant={gameState.selectedDuration === duration ? "default" : "outline"}
                  size="sm"
                  onClick={() => changeDuration(duration as RoundDuration)}
                  disabled={gameState.currentRound.phase === "resolving" || gameState.currentRound.phase === "showing-result"}
                  className={`text-sm font-black transition-all duration-300 min-w-[60px] ${
                    gameState.selectedDuration === duration 
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black shadow-lg shadow-amber-500/50 animate-pulse border-2 border-amber-400' 
                      : 'border-amber-600/50 text-amber-300 hover:border-amber-400 hover:bg-amber-500/10 hover:text-amber-200'
                  }`}
                >
                  {duration}s
                </Button>
              ))}
            </div>
          </div>

          {/* Main Game Area with Enhanced Casino Colors */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Ultra Enhanced Casino-Style Timer */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center space-y-8">
              {/* Casino-Style Circular Timer */}
              <div className="relative">
                {/* Multiple glow layers for casino effect */}
                <div className="absolute inset-0 rounded-full">
                  <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
                    isCritical 
                      ? 'bg-gradient-to-r from-red-600/60 via-red-500/70 to-orange-600/60 animate-pulse' 
                      : isUrgent
                      ? 'bg-gradient-to-r from-orange-500/50 via-amber-500/60 to-red-500/50 animate-pulse'
                      : 'bg-gradient-to-r from-amber-500/40 via-yellow-500/50 to-emerald-500/40'
                  }`} style={{ filter: 'blur(25px)' }} />
                  
                  {/* Rotating casino ring */}
                  <div className={`absolute inset-6 rounded-full border-4 transition-all duration-300 ${
                    isCritical 
                      ? 'border-red-400/60 shadow-lg shadow-red-500/50' 
                      : isUrgent
                      ? 'border-amber-400/60 shadow-lg shadow-amber-500/50'
                      : 'border-amber-400/40 shadow-lg shadow-amber-500/30'
                  } animate-spin`} style={{ animationDuration: isCritical ? '2s' : isUrgent ? '4s' : '8s' }} />
                </div>
                
                {/* Main casino timer container */}
                <div className="relative w-52 h-52 rounded-full">
                  {/* Outer decorative casino ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-amber-600/40 bg-gradient-to-br from-black/90 via-red-950/80 to-black/90 backdrop-blur-xl shadow-2xl shadow-amber-500/30">
                    {/* Animated progress ring with casino colors */}
                    <div className={`absolute inset-0 rounded-full border-4 border-transparent transition-all duration-300 ${
                      isCritical 
                        ? 'shadow-2xl shadow-red-500/70' 
                        : isUrgent
                        ? 'shadow-2xl shadow-amber-500/60'
                        : 'shadow-xl shadow-amber-500/40'
                    }`}
                    style={{
                      background: `conic-gradient(${
                        isCritical 
                          ? `#dc2626 0deg, #ea580c ${progress * 3.6}deg, transparent 0deg` 
                          : isUrgent
                          ? `#d97706 0deg, #eab308 ${progress * 3.6}deg, transparent 0deg`
                          : `#eab308 0deg, #16a34a ${progress * 3.6}deg, transparent 0deg`
                      })`,
                      mask: 'radial-gradient(circle, transparent 82%, black 86%)'
                    }} />
                  </div>
                  
                  {/* Inner timer display with enhanced casino styling */}
                  <div className="absolute inset-8 rounded-full bg-gradient-to-br from-black via-red-950/50 to-black border-2 border-amber-500/30 shadow-inner shadow-amber-500/20 flex items-center justify-center backdrop-blur-sm">
                    {/* Ultra inner glow with casino ambiance */}
                    <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
                      isCritical 
                        ? 'bg-gradient-to-r from-red-600/20 to-orange-600/20 animate-pulse' 
                        : isUrgent
                        ? 'bg-gradient-to-r from-amber-600/15 to-yellow-600/15 animate-pulse'
                        : 'bg-gradient-to-r from-amber-600/10 to-emerald-600/10'
                    }`} />
                    
                    {/* Timer content with gambling aesthetics */}
                    <div className={`text-center relative z-10 transition-all duration-300 ${isCritical ? 'animate-bounce' : isUrgent ? 'animate-pulse' : ''}`}>
                      <div className={`text-6xl font-black font-mono mb-2 transition-all duration-300 ${
                        isCritical 
                          ? 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400' 
                          : isUrgent
                          ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400'
                          : 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-400'
                      }`}
                      style={{
                        filter: isCritical 
                          ? 'drop-shadow(0 0 15px rgba(239, 68, 68, 0.9))' 
                          : isUrgent
                          ? 'drop-shadow(0 0 12px rgba(245, 158, 11, 0.8))'
                          : 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.6))'
                      }}>
                        {gameState.currentRound.phase === "resolving" ? "🎰" : gameState.currentRound.timeRemaining}
                      </div>
                      
                      <div className={`text-sm font-bold tracking-widest uppercase transition-all duration-300 ${
                        gameState.currentRound.phase === "resolving" 
                          ? 'text-amber-400 animate-pulse' 
                          : gameState.currentRound.phase === "showing-result" 
                          ? 'text-emerald-400' 
                          : isCritical 
                          ? 'text-red-400 animate-pulse' 
                          : isUrgent
                          ? 'text-amber-400 animate-pulse'
                          : 'text-amber-300'
                      }`}>
                        {gameState.currentRound.phase === "resolving" ? "🎲 SPINNING" : 
                         gameState.currentRound.phase === "showing-result" ? "🏆 RESULT" : "⏰ SECONDS"}
                      </div>
                      
                      {/* Enhanced phase indicator dots */}
                      <div className="flex justify-center space-x-2 mt-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                              gameState.currentRound.phase === "betting" && i === 0 ? 'bg-amber-400 animate-pulse shadow-lg shadow-amber-400/50' :
                              gameState.currentRound.phase === "resolving" && i === 1 ? 'bg-yellow-400 animate-pulse shadow-lg shadow-yellow-400/50' :
                              gameState.currentRound.phase === "showing-result" && i === 2 ? 'bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50' :
                              'bg-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Enhanced floating particles with casino colors */}
                    {gameState.currentRound.phase === "betting" && Array.from({ length: 16 }).map((_, i) => (
                      <div
                        key={i}
                        className={`absolute w-1.5 h-1.5 rounded-full transition-all duration-1000 ${
                          isCritical ? 'bg-red-400' : isUrgent ? 'bg-amber-400' : 'bg-yellow-400'
                        } animate-ping`}
                        style={{
                          top: '50%',
                          left: '50%',
                          transform: `rotate(${i * 22.5}deg) translateY(-90px)`,
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: isCritical ? '0.3s' : isUrgent ? '0.8s' : '1.5s'
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Casino corner accent diamonds */}
                  <div className="absolute -top-3 -left-3 w-6 h-6 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full animate-pulse shadow-lg shadow-amber-400/50" />
                  <div className="absolute -top-3 -right-3 w-6 h-6 bg-gradient-to-r from-yellow-400 to-emerald-400 rounded-full animate-pulse shadow-lg shadow-yellow-400/50" style={{ animationDelay: '0.3s' }} />
                  <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-gradient-to-r from-emerald-400 to-amber-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" style={{ animationDelay: '0.6s' }} />
                  <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full animate-pulse shadow-lg shadow-amber-400/50" style={{ animationDelay: '0.9s' }} />
                </div>
              </div>

              {/* Enhanced Live Betting Activity Feed with Casino Theme */}
              <div className="w-full max-w-md">
                <div className="bg-gradient-to-br from-black/90 via-red-950/80 to-black/90 backdrop-blur-xl rounded-2xl border-2 border-amber-500/40 p-5 shadow-2xl shadow-amber-500/20 relative overflow-hidden">
                  {/* Casino background pattern */}
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-red-500/5 to-amber-500/5 animate-pulse" />
                  <div className="absolute top-2 right-2 text-amber-400/20 text-xs">♦♠♣♥</div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <div className="w-4 h-4 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />
                        <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping" />
                      </div>
                      <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-amber-400 to-emerald-400">
                        🎰 LIVE CASINO BETS
                      </span>
                    </div>
                    
                    <div className="space-y-3 max-h-36 overflow-y-auto custom-scrollbar">
                      {gameState.bettingActivity.length === 0 ? (
                        <div className="text-xs text-amber-400/60 text-center py-4 animate-pulse">
                          🎲 Waiting for high rollers...
                        </div>
                      ) : (
                        gameState.bettingActivity.map((activity) => (
                          <div key={activity.id} className="group relative">
                            {/* Casino glow background */}
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 to-red-600/20 rounded-xl blur-sm group-hover:from-amber-500/30 group-hover:to-emerald-500/30 transition-all duration-300" />
                            
                            <div className="relative flex items-center justify-between text-xs bg-gradient-to-r from-black/80 to-red-950/60 hover:from-amber-950/40 hover:to-red-950/60 rounded-xl p-3 border border-amber-500/30 hover:border-amber-400/60 transition-all duration-300 backdrop-blur-sm shadow-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 bg-gradient-to-r from-emerald-400 to-amber-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />
                                <span className="text-amber-100 font-bold">{activity.playerName}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-amber-400 font-black text-sm shadow-lg">${activity.amount}</div>
                                <div className="text-amber-300/80 text-xs font-semibold">{activity.betType}</div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Result Display with Celebration */}
              {gameState.lastResult && gameState.currentRound.phase === "showing-result" && (
                <div className="text-center space-y-6 animate-fade-in relative">
                  {/* Enhanced celebration background */}
                  <div className="absolute inset-0 -m-12 bg-gradient-to-r from-amber-500/20 via-emerald-500/30 to-amber-500/20 rounded-3xl blur-2xl animate-pulse" />
                  
                  <div className="relative">
                    <div className="flex items-center justify-center gap-10">
                      {/* Enhanced color display with casino styling */}
                      <div className="relative">
                        <div className={`w-24 h-24 rounded-3xl ${COLOR_CLASSES[gameState.lastResult.color]} shadow-2xl flex items-center justify-center relative overflow-hidden border-2 border-amber-400/50`}>
                          {/* Inner shine effect */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-3xl" />
                          <div className="w-12 h-12 bg-white/40 rounded-2xl animate-pulse shadow-lg" />
                          
                          {/* Color label */}
                          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 px-3 py-1 rounded-full border border-amber-400/50">
                            <span className="text-amber-400 font-black text-xs uppercase">{gameState.lastResult.color}</span>
                          </div>
                        </div>
                        
                        {/* Enhanced floating particles around color */}
                        {Array.from({ length: 8 }).map((_, i) => (
                          <div
                            key={i}
                            className="absolute w-3 h-3 bg-amber-400/80 rounded-full animate-ping shadow-lg shadow-amber-400/50"
                            style={{
                              top: '50%',
                              left: '50%',
                              transform: `rotate(${i * 45}deg) translateY(-50px)`,
                              animationDelay: `${i * 0.2}s`
                            }}
                          />
                        ))}
                      </div>
                      
                      {/* Enhanced number display */}
                      <div className="relative">
                        <div className="bg-gradient-to-br from-black via-amber-950/50 to-black px-10 py-8 rounded-3xl shadow-2xl border-4 border-amber-500/60 backdrop-blur-xl relative overflow-hidden">
                          {/* Casino number glow effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 via-yellow-400/20 to-amber-400/10 rounded-3xl animate-pulse" />
                          
                          <div className="relative text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 font-mono shadow-2xl">
                            {gameState.lastResult.number}
                          </div>
                          
                          {/* Size indicator */}
                          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 px-4 py-1 rounded-full border border-amber-400/50">
                            <span className="text-amber-400 font-black text-xs uppercase">
                              {gameState.lastResult.number >= 5 ? 'BIG' : 'SMALL'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Enhanced number celebration particles */}
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div
                            key={i}
                            className="absolute w-2 h-2 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full animate-ping shadow-lg shadow-amber-400/60"
                            style={{
                              top: '50%',
                              left: '50%',
                              transform: `rotate(${i * 30}deg) translateY(-60px)`,
                              animationDelay: `${i * 0.1}s`
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Enhanced result summary with casino styling */}
                    <div className="bg-gradient-to-r from-black/80 via-red-950/60 to-black/80 backdrop-blur-xl rounded-2xl p-6 border-2 border-amber-500/40 shadow-2xl shadow-amber-500/20 mt-8">
                      <p className="text-2xl font-black text-amber-100 mb-4">
                        🎯 WINNING NUMBER: <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400 text-3xl">{gameState.lastResult.number}</span> — <span className={`${gameState.lastResult.color === 'red' ? 'text-red-400' : gameState.lastResult.color === 'green' ? 'text-emerald-400' : 'text-blue-400'} text-3xl font-black`}>{gameState.lastResult.color.toUpperCase()}</span>
                      </p>
                      
                      {/* Enhanced winning/losing predictions display */}
                      {gameState.lockedPredictions.length > 0 && (
                        <div className="space-y-3">
                          {gameState.lockedPredictions.map((pred, idx) => {
                            const winners = checkWinnings(gameState.lastResult!, [pred]);
                            const isWin = winners.length > 0;
                            return (
                              <div key={idx} className={`relative px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-500 overflow-hidden border-2 ${
                                isWin 
                                  ? 'bg-gradient-to-r from-emerald-600/40 via-green-600/40 to-emerald-600/40 text-emerald-300 border-emerald-400/60 shadow-lg shadow-emerald-500/30' 
                                  : 'bg-gradient-to-r from-red-600/40 via-red-700/40 to-red-600/40 text-red-300 border-red-400/60 shadow-lg shadow-red-500/30'
                              }`}>
                                {/* Background casino effect */}
                                <div className={`absolute inset-0 ${
                                  isWin 
                                    ? 'bg-gradient-to-r from-emerald-400/10 to-green-400/10 animate-pulse' 
                                    : 'bg-gradient-to-r from-red-400/10 to-red-500/10'
                                }`} />
                                
                                <div className="relative flex items-center justify-between">
                                  <span className="font-black">
                                    {typeof pred.type === 'number' ? `🎯 NUMBER ${pred.type}` : `🎰 ${pred.type.toUpperCase()}`}
                                  </span>
                                  {isWin ? (
                                    <span className="text-amber-400 font-black text-lg animate-bounce">
                                      💰 WIN +{pred.multiplier}x 🎉
                                    </span>
                                  ) : (
                                    <span className="text-red-400 font-black text-lg">
                                      💔 LOSE
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Prediction Controls with Casino Styling */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full animate-pulse shadow-lg shadow-amber-400/50" />
                <h3 className="text-xl font-black text-amber-100 font-heading">🎰 PLACE YOUR BETS</h3>
              </div>
              
              {/* Size Predictions with Enhanced Casino Colors */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                  SIZE BETS (5+ = Big, 0-4 = Small)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={gameState.activePredictions.some(p => p.type === "big") ? "default" : "outline"}
                    onClick={() => addPrediction("big")}
                    disabled={gameState.currentRound.phase !== "betting" || gameState.currentRound.timeRemaining === 0}
                    className={`w-full font-black transition-all duration-300 ${
                      gameState.activePredictions.some(p => p.type === "big")
                        ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg shadow-emerald-500/40 animate-pulse border-2 border-emerald-400'
                        : 'border-2 border-amber-600/50 text-amber-300 hover:border-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-200 bg-black/60'
                    }`}
                  >
                    📈 BIG (1.9x)
                  </Button>
                  <Button
                    variant={gameState.activePredictions.some(p => p.type === "small") ? "default" : "outline"}
                    onClick={() => addPrediction("small")}
                    disabled={gameState.currentRound.phase !== "betting" || gameState.currentRound.timeRemaining === 0}
                    className={`w-full font-black transition-all duration-300 ${
                      gameState.activePredictions.some(p => p.type === "small")
                        ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg shadow-blue-500/40 animate-pulse border-2 border-blue-400'
                        : 'border-2 border-amber-600/50 text-amber-300 hover:border-blue-400 hover:bg-blue-500/20 hover:text-blue-200 bg-black/60'
                    }`}
                  >
                    📉 SMALL (1.9x)
                  </Button>
                </div>
              </div>

              {/* Color Predictions with Enhanced Casino Styling */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                  COLOR BETS (2.8x Payout)
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {(["red", "green", "blue"] as const).map((color) => (
                    <Button
                      key={color}
                      variant={gameState.activePredictions.some(p => p.type === color) ? "default" : "outline"}
                      onClick={() => addPrediction(color)}
                      disabled={gameState.currentRound.phase !== "betting" || gameState.currentRound.timeRemaining === 0}
                      className={`w-full font-black transition-all duration-300 text-xs ${
                        gameState.activePredictions.some(p => p.type === color) 
                          ? `${COLOR_CLASSES[color]} hover:opacity-90 text-white animate-pulse border-2 border-white/50` 
                          : 'border-2 border-amber-600/50 text-amber-300 hover:border-amber-400 hover:bg-amber-500/20 hover:text-amber-200 bg-black/60'
                      }`}
                    >
                      🎨 {color.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Number Predictions with Casino Grid */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                  EXACT NUMBER (9x Jackpot!)
                </h4>
                <div className="grid grid-cols-5 gap-1">
                  {Array.from({ length: 10 }, (_, i) => (
                    <Button
                      key={i}
                      variant={gameState.activePredictions.some(p => p.type === i) ? "default" : "outline"}
                      onClick={() => addPrediction(i)}
                      disabled={gameState.currentRound.phase !== "betting" || gameState.currentRound.timeRemaining === 0}
                      size="sm"
                      className={`aspect-square p-0 font-black transition-all duration-300 ${
                        gameState.activePredictions.some(p => p.type === i)
                          ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-yellow-600 text-black shadow-lg shadow-amber-500/50 animate-pulse border-2 border-amber-300'
                          : 'border-2 border-amber-600/50 text-amber-300 hover:border-amber-400 hover:bg-amber-500/20 hover:text-amber-200 bg-black/60'
                      }`}
                    >
                      {i}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Enhanced Bet Preview with Casino Styling */}
              {gameState.activePredictions.length > 0 && (
                <div className="bg-gradient-to-r from-black/90 via-amber-950/30 to-black/90 backdrop-blur-sm rounded-xl border-2 border-amber-500/50 p-4 shadow-xl shadow-amber-500/20">
                  <h5 className="text-sm font-black text-amber-400 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                    🎯 YOUR ACTIVE BETS
                  </h5>
                  <div className="text-xs text-amber-200 space-y-2">
                    {gameState.activePredictions.map((pred, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-gradient-to-r from-amber-950/40 to-red-950/40 rounded-lg p-2 border border-amber-500/30">
                        <span className="font-bold">{typeof pred.type === 'number' ? `🎯 Number ${pred.type}` : `🎰 ${pred.type.toUpperCase()}`}</span>
                        <span className="text-amber-400 font-black shadow-lg">{pred.multiplier}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Enhanced Action Buttons with Casino Theme */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={placePredictions}
                  disabled={gameState.activePredictions.length === 0 || gameState.currentRound.phase !== "betting" || gameState.currentRound.timeRemaining === 0}
                  className="bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-600 hover:to-green-600 text-white font-black shadow-lg shadow-emerald-500/40 transition-all duration-300 hover:scale-105 border-2 border-emerald-400 text-lg py-6"
                >
                  🚀 PLACE BETS
                </Button>
                <Button
                  variant="outline"
                  onClick={clearPredictions}
                  disabled={gameState.activePredictions.length === 0 || gameState.currentRound.phase !== "betting"}
                  className="border-2 border-red-600/50 text-red-300 hover:border-red-400 hover:bg-red-500/20 hover:text-red-200 transition-all duration-300 bg-black/60 font-black text-lg py-6"
                >
                  🗑️ CLEAR ALL
                </Button>
              </div>
            </div>
          </div>

          {/* Enhanced History and Settings with Casino Theme */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-amber-100 font-heading flex items-center gap-2">
                <span className="w-3 h-3 bg-amber-400 rounded-full animate-pulse" />
                🏆 RECENT WINS & RESULTS
              </h3>
              
              {/* Settings with Casino Styling */}
              <div className="flex items-center gap-4">
                <Popover open={showHelp} onOpenChange={setShowHelp}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="border-amber-600/50 text-amber-300 hover:border-amber-400 hover:bg-amber-500/20 bg-black/60 font-bold">
                      🎰 RULES
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 bg-gradient-to-br from-black to-red-950 border-2 border-amber-500/50 shadow-2xl shadow-amber-500/20">
                    <div className="space-y-3 text-sm text-amber-200">
                      <h4 className="font-black text-amber-400 text-lg">🎰 HOW TO PLAY</h4>
                      <div className="space-y-2 text-xs">
                        <p><strong className="text-emerald-400">BIG/SMALL:</strong> Predict if result is 5-9 (Big) or 0-4 (Small) - <span className="text-amber-400 font-bold">1.9x payout</span></p>
                        <p><strong className="text-red-400">COLOR:</strong> Predict Red, Green, or Blue - <span className="text-amber-400 font-bold">2.8x payout</span></p>
                        <p><strong className="text-yellow-400">EXACT NUMBER:</strong> Predict exact number 0-9 - <span className="text-amber-400 font-bold">9x JACKPOT!</span></p>
                        <p><strong className="text-amber-400">MODES:</strong> Switch between 10s, 15s, and 20s rounds anytime</p>
                        <p><strong className="text-emerald-400">INDEPENDENT:</strong> Each round result is completely random</p>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-amber-400 font-bold">🔊 Sound</span>
                  <Switch 
                    checked={gameState.settings.soundEnabled}
                    onCheckedChange={(checked) => 
                      setGameState(prev => ({
                        ...prev,
                        settings: { ...prev.settings, soundEnabled: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-amber-400 font-bold">✨ Effects</span>
                  <Switch 
                    checked={gameState.settings.animationsEnabled}
                    onCheckedChange={(checked) => 
                      setGameState(prev => ({
                        ...prev,
                        settings: { ...prev.settings, animationsEnabled: checked }
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Enhanced History Strip with Casino Styling */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {gameState.history.length === 0 ? (
                <p className="text-amber-400/60 text-sm font-bold">🎲 No results yet - start betting!</p>
              ) : (
                gameState.history.map((result, idx) => (
                  <Popover key={idx}>
                    <PopoverTrigger asChild>
                      <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-gradient-to-br from-black via-amber-950/50 to-black border-2 border-amber-500/40 flex items-center justify-center cursor-pointer hover:bg-gradient-to-br hover:from-amber-950/30 hover:to-red-950/30 transition-all duration-300 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-105">
                        <div className="text-center">
                          <div className={`w-5 h-5 rounded-lg mx-auto mb-1 ${COLOR_CLASSES[result.color]} border border-white/30`} />
                          <div className="text-sm font-black text-amber-400">{result.number}</div>
                          <div className="text-xs font-bold text-amber-300/80">{result.number >= 5 ? 'BIG' : 'SML'}</div>
                        </div>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 bg-gradient-to-br from-black to-red-950 border-2 border-amber-500/50 shadow-2xl shadow-amber-500/20">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg ${COLOR_CLASSES[result.color]} border-2 border-white/30`} />
                          <span className="font-black text-amber-400 text-2xl">{result.number}</span>
                          <span className="font-black text-amber-300">{result.number >= 5 ? 'BIG' : 'SMALL'}</span>
                        </div>
                        <p className="text-amber-300 font-bold">Duration: {result.duration}s round</p>
                        <p className="text-amber-400/80 text-xs">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </p>
                        <div className="text-xs text-amber-200 bg-black/40 p-2 rounded border border-amber-500/30">
                          <p className="font-bold">Winning Bets:</p>
                          <p>🔸 Big: {result.number >= 5 ? '✅ WIN (1.9x)' : '❌ Lose'}</p>
                          <p>🔸 Small: {result.number < 5 ? '✅ WIN (1.9x)' : '❌ Lose'}</p>
                          <p>🔸 {result.color}: ✅ WIN (2.8x)</p>
                          <p>🔸 Number {result.number}: ✅ WIN (9x)</p>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                ))
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}