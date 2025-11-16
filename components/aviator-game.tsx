"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import BettingPanel from "@/components/betting-panel";
import GameDisplay from "@/components/game-display";
import BetHistory from "@/components/bet-history";
import { getProfile, UserProfileResponse } from "@/app/lib/api";

// Backend URL
const BACKEND_URL = "http://localhost:8099";

export default function AviatorGame() {
  const router = useRouter();

  const [gameState, setGameState] = useState<"idle" | "playing" | "crashed">("idle");
  const [multiplier, setMultiplier] = useState(1.0);
  const [balance, setBalance] = useState(0);
  const [betAmount, setBetAmount] = useState(100);
  const [bets, setBets] = useState<Array<{ amount: number; multiplier: number; result: "won" | "lost" }>>([]);
  const [hasPlacedBet, setHasPlacedBet] = useState(false);
  const [timeToRestart, setTimeToRestart] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [backendError, setBackendError] = useState(false);

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentBetRef = useRef<number>(0);
  const gameStartTimeRef = useRef<number>(0);
  const crashPointRef = useRef<number>(0);
  const roundDurationRef = useRef<number>(10000); // default 10s

  // ------------------ Load User Profile ------------------
  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const profile: UserProfileResponse = await getProfile();
      setBalance(profile.balance);
    } catch (err: any) {
      console.error("Failed to load balance:", err);
      setBackendError(true);
      alert("❌ Cannot load user profile. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  // Reset hasPlacedBet when game crashes
  useEffect(() => {
    if (gameState === "crashed") setHasPlacedBet(false);
  }, [gameState]);

  // ------------------ Fetch Current Global Round ------------------
  const fetchCurrentRound = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/aviator/current`);
      if (!response.ok) throw new Error("Failed to fetch current round");

      const data = await response.json();
      crashPointRef.current = Number(data.crashPoint);
      gameStartTimeRef.current = new Date(data.startTime).getTime();
      roundDurationRef.current = data.duration || 10000;

    } catch (err) {
      console.error(err);
      setBackendError(true);
      alert("❌ Cannot fetch current round. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------ Game Loop ------------------
  const startGameLoop = async () => {
    if (backendError) return;
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);

    await fetchCurrentRound();

    setGameState("playing");
    setMultiplier(1.0);

    gameLoopRef.current = setInterval(() => {
      const elapsed = Date.now() - gameStartTimeRef.current;
      const progress = Math.min(elapsed / roundDurationRef.current, 1);
      const currentMultiplier = 1.0 + (crashPointRef.current - 1.0) * progress;

      setMultiplier(Number(currentMultiplier.toFixed(2)));

      if (progress >= 1) {
        handleCrash(crashPointRef.current);
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      }
    }, 100);
  };

  // ------------------ Handle Crash ------------------
  const handleCrash = (finalMultiplier: number) => {
    setGameState("crashed");

    if (hasPlacedBet && currentBetRef.current > 0) {
      setBets(prev => [
        ...prev,
        { amount: currentBetRef.current, multiplier: finalMultiplier, result: "lost" },
      ]);
      currentBetRef.current = 0;
    }

    setTimeToRestart(5);
    let countdown = 5;
    restartTimerRef.current = setInterval(() => {
      countdown -= 1;
      setTimeToRestart(countdown);

      if (countdown === 0) {
        if (restartTimerRef.current) clearInterval(restartTimerRef.current);
        startGameLoop();
      }
    }, 1000);
  };

  // ------------------ Betting ------------------
  const placeBet = (amount: number) => {
    if (balance < amount) {
      alert("Insufficient balance!");
      return;
    }
    if (gameState === "playing" && hasPlacedBet) {
      alert("You already have an active bet!");
      return;
    }

    setBalance(prev => prev - amount);
    setBetAmount(amount);
    setHasPlacedBet(true);
    currentBetRef.current = amount;
  };

  const cashOut = () => {
    if (!hasPlacedBet || gameState !== "playing") return;

    const winnings = currentBetRef.current * multiplier;
    setBalance(prev => prev + winnings);
    setBets(prev => [
      ...prev,
      { amount: currentBetRef.current, multiplier: multiplier, result: "won" },
    ]);

    setHasPlacedBet(false);
    currentBetRef.current = 0;
  };

  // ------------------ Initial Game Start ------------------
  useEffect(() => {
    const timer = setTimeout(() => startGameLoop(), 2000);
    return () => {
      clearTimeout(timer);
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      if (restartTimerRef.current) clearInterval(restartTimerRef.current);
    };
  }, []);

  // ------------------ Render ------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-black to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg shadow-md shadow-cyan-500/50 transition"
          >
            ← Dashboard
          </button>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-6xl md:text-7xl font-black mb-2 bg-gradient-to-r from-cyan-400 via-red-400 to-cyan-400 bg-clip-text text-transparent text-glow">
            CashGame
          </h1>
          <p className="text-cyan-400/80 text-lg font-semibold">Cash out before the plane crashes!</p>
          {isLoading && <p className="text-yellow-400 text-sm mt-2">⏳ Loading balance...</p>}
          {backendError && <p className="text-red-400 text-sm mt-2 font-bold">❌ Backend server is offline. Please start the server and refresh the page.</p>}
        </div>

        <div className="space-y-4">
          <div className="w-full rounded-2xl overflow-hidden border border-cyan-500/30 shadow-lg shadow-cyan-500/20" style={{ height: "220px" }}>
            <GameDisplay gameState={gameState} multiplier={multiplier} timeToRestart={timeToRestart} />
          </div>

          <BettingPanel
            balance={balance}
            gameState={gameState}
            hasPlacedBet={hasPlacedBet}
            multiplier={multiplier}
            onStartGame={placeBet}
            onCashOut={cashOut}
            betAmount={betAmount}
            setBetAmount={setBetAmount}
            timeToRestart={timeToRestart}
          />
        </div>

        <div className="mt-6">
          <BetHistory bets={bets} />
        </div>
      </div>
    </div>
  );
}
