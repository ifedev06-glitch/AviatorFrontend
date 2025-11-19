"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import SockJS from "sockjs-client";
import { Client, Stomp } from "@stomp/stompjs";

const WS_URL = "https://aviator-app-latest.onrender.com/ws";

interface RoundData {
  roundId: string;
  phase: string;
  currentMultiplier: number;
  crashPoint: number;
  bettingOpen: boolean;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [currentRound, setCurrentRound] = useState<RoundData | null>(null);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [gamePhase, setGamePhase] = useState<"BETTING" | "FLYING" | "CRASHED">("BETTING");
  const [crashHistory, setCrashHistory] = useState<Array<{ roundId: string; crashPoint: number; timestamp: string }>>([]);
  
  const stompClientRef = useRef<Client | null>(null);

  // ------------------ WebSocket Setup ------------------
  useEffect(() => {
    const socket = new SockJS(WS_URL);
    const stompClient = Stomp.over(socket);
    stompClientRef.current = stompClient;

    stompClient.connect({}, () => {
      console.log("✅ Admin connected to WebSocket");
      setIsConnected(true);

      // Listen for round updates (contains crash point)
      stompClient.subscribe("/topic/round", (message) => {
        const data: RoundData = JSON.parse(message.body);
        setCurrentRound(data);
        setGamePhase(data.phase as any);
        
        if (data.phase === "BETTING") {
          // New round started, add previous round to history
          if (currentRound && currentRound.crashPoint) {
            setCrashHistory(prev => [
              {
                roundId: currentRound.roundId,
                crashPoint: currentRound.crashPoint,
                timestamp: new Date().toLocaleTimeString()
              },
              ...prev.slice(0, 19) // Keep last 20 rounds
            ]);
          }
        }
      });

      // Listen for multiplier updates
      stompClient.subscribe("/topic/multiplier", (message) => {
        const data = JSON.parse(message.body);
        setCurrentMultiplier(Number(data.multiplier));
        setGamePhase("FLYING");
      });

      // Listen for crashes
      stompClient.subscribe("/topic/crash", (message) => {
        const data = JSON.parse(message.body);
        setGamePhase("CRASHED");
      });
    });

    return () => {
      stompClient.disconnect(() => {
        console.log("❌ Admin WebSocket disconnected");
        setIsConnected(false);
      });
    };
  }, []);

  const getPhaseColor = () => {
    switch (gamePhase) {
      case "BETTING": return "text-yellow-400";
      case "FLYING": return "text-green-400";
      case "CRASHED": return "text-red-400";
      default: return "text-gray-400";
    }
  };

  const getPhaseEmoji = () => {
    switch (gamePhase) {
      case "BETTING": return "⏳";
      case "FLYING": return "✈️";
      case "CRASHED": return "💥";
      default: return "❓";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-black to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg shadow-md shadow-cyan-500/50 transition"
          >
            ← Back to Dashboard
          </button>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className="text-white font-semibold">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>

        {/* Title */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl md:text-6xl font-black mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            🔐 Admin Dashboard
          </h1>
          <p className="text-gray-400 text-lg">Monitor game rounds and crash points in real-time</p>
        </div>

        {/* Current Round Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Live Game Status */}
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/30">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">🎮 Live Game Status</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Phase:</span>
                <span className={`font-bold text-xl ${getPhaseColor()}`}>
                  {getPhaseEmoji()} {gamePhase}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Current Multiplier:</span>
                <span className="font-bold text-2xl text-green-400">{currentMultiplier.toFixed(2)}x</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Round ID:</span>
                <span className="font-mono text-sm text-gray-300">{currentRound?.roundId.slice(0, 8) || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Crash Point Preview */}
          <div className="bg-gradient-to-br from-red-900/30 to-orange-900/30 backdrop-blur-sm rounded-xl p-6 border border-red-500/50">
            <h2 className="text-2xl font-bold text-red-400 mb-4">🎯 Crash Point (Secret)</h2>
            {currentRound ? (
              <div className="text-center">
                <div className="text-6xl font-black text-red-400 mb-2">
                  {currentRound.crashPoint.toFixed(2)}x
                </div>
                <p className="text-gray-400 text-sm">This round will crash at this multiplier</p>
                {gamePhase === "FLYING" && (
                  <div className="mt-4">
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-red-400 transition-all duration-300"
                        style={{ width: `${Math.min((currentMultiplier / currentRound.crashPoint) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {((currentMultiplier / currentRound.crashPoint) * 100).toFixed(1)}% to crash
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>Waiting for round data...</p>
              </div>
            )}
          </div>
        </div>

        {/* Crash History */}
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/30">
          <h2 className="text-2xl font-bold text-cyan-400 mb-4">📊 Crash History (Last 20 Rounds)</h2>
          {crashHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No crash history yet. Wait for rounds to complete.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b-2 border-cyan-500/30">
                  <tr>
                    <th className="text-left py-3 px-4 font-bold text-cyan-400/80">#</th>
                    <th className="text-left py-3 px-4 font-bold text-cyan-400/80">ROUND ID</th>
                    <th className="text-left py-3 px-4 font-bold text-cyan-400/80">CRASH POINT</th>
                    <th className="text-left py-3 px-4 font-bold text-cyan-400/80">TIME</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-500/10">
                  {crashHistory.map((round, idx) => (
                    <tr key={round.roundId} className="hover:bg-cyan-500/5 transition-colors">
                      <td className="py-3 px-4 text-gray-400 font-semibold">#{idx + 1}</td>
                      <td className="py-3 px-4 text-gray-300 font-mono text-xs">{round.roundId.slice(0, 12)}...</td>
                      <td className="py-3 px-4">
                        <span className={`font-bold text-lg ${
                          round.crashPoint < 2 ? 'text-red-400' : 
                          round.crashPoint < 5 ? 'text-yellow-400' : 
                          'text-green-400'
                        }`}>
                          {round.crashPoint.toFixed(2)}x
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-400">{round.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Warning */}
        <div className="mt-6 bg-red-900/20 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-400 text-sm font-semibold">
            ⚠️ <strong>Admin Only:</strong> This page reveals crash points before they happen. Do not share this information with players.
          </p>
        </div>
      </div>
    </div>
  );
}