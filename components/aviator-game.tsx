"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import BettingPanel from "@/components/betting-panel";
import GameDisplay from "@/components/game-display";
import BetHistory from "@/components/bet-history";
import { getProfile, UserProfileResponse } from "@/app/lib/api";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL!;

export default function AviatorGame() {
  const router = useRouter();

  const [gameState, setGameState] = useState<"idle" | "playing" | "crashed">("idle");
  const [multiplier, setMultiplier] = useState(1.0);
  const [balance, setBalance] = useState(0);
  const [betAmount, setBetAmount] = useState(100);
  const [bets, setBets] = useState<
    Array<{ amount: number; multiplier: number; result: "won" | "lost" }>
  >([]);
  const [hasPlacedBet, setHasPlacedBet] = useState(false);
  const [timeToRestart, setTimeToRestart] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [backendError, setBackendError] = useState(false);

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentBetRef = useRef<number>(0);
  const gameStartTimeRef = useRef<number>(0);
  const crashPointRef = useRef<number>(0);
  const roundDurationRef = useRef<number>(10000);

  // ===============================
  // LOAD USER PROFILE
  // ===============================
  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const profile: UserProfileResponse = await getProfile();
      setBalance(profile.balance);
    } catch (err) {
      console.error("Failed to load profile:", err);
      setBackendError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  useEffect(() => {
    if (gameState === "crashed") setHasPlacedBet(false);
  }, [gameState]);

  // ===============================
  // FETCH CURRENT ROUND
  // ===============================
  const fetchCurrentRound = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/aviator/current`);
      if (!response.ok) throw new Error("Failed to fetch round");

      const data = await response.json();

      crashPointRef.current = Number(data.crashPoint);
      gameStartTimeRef.current = new Date(data.startTime).getTime();
      roundDurationRef.current = data.duration ?? 10000;
    } catch (err) {
      console.error(err);
      setBackendError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // ===============================
  // GAME LOOP
  // ===============================
  const startGameLoop = async () => {
    if (backendError) return;

    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    await fetchCurrentRound();

    setGameState("playing");
    setMultiplier(1.0);

    gameLoopRef.current = setInterval(() => {
      const elapsed = Date.now() - gameStartTimeRef.current;
      const progress = Math.min(elapsed / roundDurationRef.current, 1);
      const currentMultiplier = 1 + (crashPointRef.current - 1) * progress;

      setMultiplier(Number(currentMultiplier.toFixed(2)));

      if (progress >= 1) {
        handleCrash(crashPointRef.current);
        clearInterval(gameLoopRef.current!);
      }
    }, 100);
  };

  // ===============================
  // CRASH HANDLER
  // ===============================
  const handleCrash = (finalMultiplier: number) => {
    setGameState("crashed");

    if (hasPlacedBet && currentBetRef.current > 0) {
      setBets((prev) => [
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
        clearInterval(restartTimerRef.current!);
        startGameLoop();
      }
    }, 1000);
  };

  // ===============================
  // BETTING
  // ===============================
  const placeBet = (amount: number) => {
    if (balance < amount) return alert("Insufficient balance!");
    if (gameState === "playing" && hasPlacedBet)
      return alert("You already placed a bet!");

    setBalance((prev) => prev - amount);
    setBetAmount(amount);
    setHasPlacedBet(true);
    currentBetRef.current = amount;
  };

  const cashOut = () => {
    if (!hasPlacedBet || gameState !== "playing") return;

    const winnings = currentBetRef.current * multiplier;

    setBalance((prev) => prev + winnings);
    setBets((prev) => [
      ...prev,
      { amount: currentBetRef.current, multiplier, result: "won" },
    ]);

    setHasPlacedBet(false);
    currentBetRef.current = 0;
  };

  // ===============================
  // INITIAL GAME START
  // ===============================
  useEffect(() => {
    const timer = setTimeout(startGameLoop, 2000);
    return () => {
      clearTimeout(timer);
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      if (restartTimerRef.current) clearInterval(restartTimerRef.current);
    };
  }, []);

  // ===============================
  // UI
  // ===============================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-black to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg shadow-md shadow-cyan-500/50"
          >
            ← Dashboard
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-cyan-400 via-red-400 to-cyan-400 bg-clip-text text-transparent">
            CashGame
          </h1>

          {isLoading && <p className="text-yellow-400 text-sm">Loading...</p>}
          {backendError && (
            <p className="text-red-400 text-sm font-bold">
              Backend offline — please refresh.
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div
            className="w-full border border-cyan-500/30 shadow-lg shadow-cyan-500/20 rounded-2xl overflow-hidden"
            style={{ height: "220px" }}
          >
            <GameDisplay
              gameState={gameState}
              multiplier={multiplier}
              timeToRestart={timeToRestart}
            />
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
