"use client";

import { useState } from "react";
import LoadingScreen from "@/components/LoadingScreen";
import PredictionGame from "@/components/PredictionGame";

export default function Page() {
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);

  const handleLoadingComplete = () => {
    setIsLoadingComplete(true);
  };

  const handleSkipLoading = () => {
    setIsLoadingComplete(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {!isLoadingComplete && (
        <LoadingScreen 
          onComplete={handleLoadingComplete}
          onSkip={handleSkipLoading}
        />
      )}
      
      {isLoadingComplete && (
        <div className="min-h-screen flex items-center justify-center p-4 lg:p-6">
          <div className="w-full max-w-6xl mx-auto">
            <PredictionGame />
          </div>
        </div>
      )}
    </div>
  );
}