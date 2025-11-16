"use client"

import { useEffect, useState } from "react"
import { GiAirplane } from "react-icons/gi";

interface GameDisplayProps {
  gameState: "idle" | "playing" | "crashed"
  multiplier: number
  timeToRestart?: number
}

export default function GameDisplay({ gameState, multiplier, timeToRestart = 0 }: GameDisplayProps) {
  const [planeY, setPlaneY] = useState(85)
  const [planeX, setPlaneX] = useState(10)

  useEffect(() => {
    if (gameState === "playing") {
      // Adjusted for shorter container - start from bottom
      const flightDistance = Math.min((multiplier - 1) * 15, 65)
      setPlaneY(Math.max(85 - flightDistance, 20)) // Start at 85% (bottom), go up to 20%

      // Animate X-axis based on multiplier
      const newX = Math.min((multiplier - 1) * 8 + 10, 80) // Start at 10%, go to 80%
      setPlaneX(newX)
    } else if (gameState === "idle") {
      setPlaneY(85) // Start position at bottom
      setPlaneX(10) // Start position at left
    }
  }, [multiplier, gameState])

  return (
    <div className="w-full h-full relative bg-gradient-to-b from-slate-900 via-slate-950 to-black overflow-hidden border-2 border-cyan-500/30">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-500"
          style={{
            backgroundImage:
              "linear-gradient(0deg, transparent 24%, rgba(34, 211, 238, 0.05) 25%, rgba(34, 211, 238, 0.05) 26%, transparent 27%, transparent 74%, rgba(34, 211, 238, 0.05) 75%, rgba(34, 211, 238, 0.05) 76%, transparent 77%, transparent)",
          }}
        />
      </div>

      {/* Game Status Text */}
      <div className="absolute top-2 left-0 right-0 text-center z-10">
        <p
          className={`text-sm font-semibold text-glow transition-colors ${
            gameState === "idle" ? "text-gray-400" : gameState === "playing" ? "text-emerald-400" : "text-red-500"
          }`}
        >
          {gameState === "idle" ? "Place a bet to start" : gameState === "playing" ? "Flying..." : "💥 CRASHED!"}
        </p>
      </div>

      {/* Multiplier Display - centered and static */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
        <div
          className={`text-6xl font-black tracking-tighter text-glow transition-all ${
            gameState === "crashed" ? "text-red-500 scale-125" : "text-white"
          }`}
        >
          {multiplier.toFixed(2)}x
        </div>
      </div>

      {/* Flight Area */}
      <div className="w-full h-full relative">
        {/* Plane */}
        <div
          className="absolute transition-all duration-100 ease-linear z-20"
          style={{ 
            left: `${planeX}%`, 
            top: `${planeY}%`,
            transform: 'translate(-50%, -50%)' // Center the plane on its position
          }}
        >
          {/* Plane icon */}
          <GiAirplane className="text-red-500 text-7xl" style={{ transform: "rotate(-20deg)" }} />
          {gameState === "playing" && (
            <div className="absolute inset-0 -z-10">
              {/* Glow effect */}
              <div className="absolute inset-0 -top-4 -bottom-4 -left-8 -right-8 animate-pulse rounded-full bg-gradient-to-r from-cyan-500/30 to-blue-500/20 blur-2xl"></div>
              {/* Trail effect */}
              <div className="absolute -left-12 top-1/2 w-12 h-1 bg-gradient-to-r from-cyan-400/60 to-transparent blur-sm" />
            </div>
          )}
        </div>

        {/* Crash effect */}
        {gameState === "crashed" && (
          <div className="absolute" style={{ left: `${planeX}%`, top: `${planeY}%`, transform: 'translate(-50%, -50%)' }}>
            <div className="relative">
              <div className="absolute inset-0 w-8 h-8 -top-4 -left-4 bg-red-500/40 rounded-full blur-lg animate-pulse" />
              <div className="absolute inset-0 w-16 h-16 -top-8 -left-8 bg-red-500/20 rounded-full blur-xl animate-bounce" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status */}
      {gameState === "crashed" && (
        <div className="absolute bottom-2 left-0 right-0 text-center">
          <p className="text-white text-xs font-medium">
            Restarting in {timeToRestart}s...
          </p>
        </div>
      )}
    </div>
  )
}