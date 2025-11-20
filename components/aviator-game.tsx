"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import SockJS from "sockjs-client";
import { Client, Stomp } from "@stomp/stompjs";
import BettingPanel from "@/components/betting-panel";
import GameDisplay from "@/components/game-display";
import BetHistory from "@/components/bet-history";
import { getProfile, UserProfileResponse, placeBet as placeBetApi, cashout as cashoutApi } from "@/app/lib/api";

// Backend URL
const WS_URL = "https://aviator-app-latest.onrender.com/ws";

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

  const [waitingNextRound, setWaitingNextRound] = useState(false);
  const [nextRoundCountdown, setNextRoundCountdown] = useState(10);

  const [placingBet, setPlacingBet] = useState(false);
  const [cashingOut, setCashingOut] = useState(false);

  const currentBetRef = useRef<number>(0);
  const stompClientRef = useRef<Client | null>(null);

  // ⭐ Initial screen loading state (your request)
  const [showInitialLoading, setShowInitialLoading] = useState(true);

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

  // ------------------ WebSocket Setup ------------------
  useEffect(() => {
    const socket = new SockJS(WS_URL);
    const stompClient = Stomp.over(socket);
    stompClientRef.current = stompClient;

    stompClient.connect({}, () => {
      console.log("✅ Connected to WebSocket");

      // Listen for multiplier updates → FIRST UPDATE removes the loading screen
      stompClient.subscribe("/topic/multiplier", (message) => {
        const data = JSON.parse(message.body);
        setMultiplier(Number(data.multiplier));
        setGameState("playing");

        // Remove initial loading screen once plane starts
        if (showInitialLoading) {
          setShowInitialLoading(false);
        }
      });

      // Listen for crashes
      stompClient.subscribe("/topic/crash", (message) => {
        const data = JSON.parse(message.body);
        handleCrash(Number(data.crashPoint));
      });

      // Listen for new rounds
      stompClient.subscribe("/topic/round", (message) => {
        const data = JSON.parse(message.body);
        if (data.phase === "BETTING") {
          setGameState("idle");
          setMultiplier(1.0);
        }
      });
    });

    return () => {
      stompClient.disconnect(() => console.log("❌ WebSocket disconnected"));
    };
  }, [showInitialLoading]);

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

    setWaitingNextRound(true);
    setNextRoundCountdown(10);
    let countdown = 10;

    const interval = setInterval(() => {
      countdown -= 1;
      setNextRoundCountdown(countdown);

      if (countdown <= 0) {
        clearInterval(interval);
        setWaitingNextRound(false);
        setGameState("idle");
        setMultiplier(1.0);
      }
    }, 1000);
  };

  // ------------------ Betting ------------------
  const placeBet = async (amount: number) => {
    if (balance < amount) {
      alert("Insufficient balance!");
      return;
    }
    if (gameState === "playing" && hasPlacedBet) {
      alert("You already have an active bet!");
      return;
    }

    setBalance(prev => prev - amount);
    setHasPlacedBet(true);
    currentBetRef.current = amount;
    setBetAmount(amount);
    setPlacingBet(true);

    try {
      const response = await placeBetApi({ amount });
      setBalance(response.remainingBalance);
    } catch (err: any) {
      console.error("Failed to place bet:", err);
      alert(err.response?.data?.message || "❌ Failed to place bet. Try again.");
      setBalance(prev => prev + amount);
      setHasPlacedBet(false);
      currentBetRef.current = 0;
    } finally {
      setPlacingBet(false);
    }
  };

 const cashOut = async () => {
  if (!hasPlacedBet || gameState !== "playing") return;

  setCashingOut(true);

  try {
    // FIRST call backend
    const response = await cashoutApi();

    // Backend succeeded → now update UI safely
    const cashoutMultiplier = multiplier;
    const cashoutAmount = currentBetRef.current * cashoutMultiplier;

    setBalance(response.newBalance);

    setBets(prev => [
      ...prev,
      { amount: currentBetRef.current, multiplier: cashoutMultiplier, result: "won" },
    ]);

    setHasPlacedBet(false);
    currentBetRef.current = 0;

  } catch (err: any) {
    console.error("Cashout failed:", err);
    alert(err.response?.data?.message || "❌ Failed to cash out. Try again.");
  } finally {
    setCashingOut(false);
  }
};


  useEffect(() => {
    if (gameState === "crashed") setHasPlacedBet(false);
  }, [gameState]);

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
            CashGames
          </h1>
          <p className="text-cyan-400/80 text-lg font-semibold">Cash out before the plane crashes!</p>
          {isLoading && <p className="text-yellow-400 text-sm mt-2">⏳ Loading balance...</p>}
          {backendError && (
            <p className="text-red-400 text-sm mt-2 font-bold">
              ❌ Backend server is offline. Please start the server and refresh the page.
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div
            className="relative w-full rounded-2xl overflow-hidden border border-cyan-500/30 shadow-lg shadow-cyan-500/20"
            style={{ height: "220px" }}
          >
            <GameDisplay gameState={gameState} multiplier={multiplier} timeToRestart={timeToRestart} />

            {/* ⭐ INITIAL PAGE LOADING OVERLAY */}
            {showInitialLoading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black bg-opacity-90 text-white">
                <div className="animate-spin h-10 w-10 border-4 border-cyan-400 border-t-transparent rounded-full mb-3"></div>
                <p className="text-cyan-300 text-lg font-semibold">Connecting to live game...</p>
              </div>
            )}

            {/* Waiting next round */}
            {waitingNextRound && !showInitialLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black bg-opacity-80 text-white p-4">
                <p className="text-lg font-bold mb-2">Waiting for next round...</p>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-1000"
                    style={{ width: `${((10 - nextRoundCountdown) / 10) * 100}%` }}
                  ></div>
                </div>
                <p className="mt-1 text-sm">{nextRoundCountdown}s</p>
              </div>
            )}
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
            placingBet={placingBet}
            cashingOut={cashingOut}
          />
        </div>

        <div className="mt-6">
          <BetHistory bets={bets} />
        </div>
      </div>
    </div>
  );
}
