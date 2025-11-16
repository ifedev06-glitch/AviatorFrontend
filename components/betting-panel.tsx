"use client"

interface BettingPanelProps {
  balance: number
  gameState: "idle" | "playing" | "crashed"
  hasPlacedBet: boolean
  multiplier: number
  onStartGame: (bet: number) => void
  onCashOut: (multiplier: number, bet: number) => void
  betAmount: number
  setBetAmount: (amount: number) => void
  timeToRestart?: number
}

export default function BettingPanel({
  balance,
  gameState,
  hasPlacedBet,
  multiplier,
  onStartGame,
  onCashOut,
  betAmount,
  setBetAmount,
  timeToRestart = 0,
}: BettingPanelProps) {
  const quickBets = [100, 200, 500, 1000]
  const potentialWin = (betAmount * multiplier).toFixed(2)

  // Determine if user can place a bet (before round starts)
  const canPlaceBet = (gameState === "idle" || gameState === "crashed") && !hasPlacedBet

  return (
    <div className="glass rounded-2xl p-4 space-y-4 border-cyan-500/30 shadow-2xl">
      {/* Balance Card */}
      <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl p-3 border border-cyan-500/30">
        <p className="text-xs text-gray-400 mb-1 font-semibold">YOUR BALANCE</p>
        <p className="text-2xl font-black text-cyan-400 text-glow">₦{balance.toFixed(2)}</p>
      </div>

      {/* Bet Amount Input */}
      <div>
        <label className="text-xs font-bold text-gray-300 mb-2 block">Bet Amount</label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBetAmount(Math.max(1, betAmount - 10))}
            disabled={gameState === "playing"}
            className="w-10 h-10 bg-slate-800/50 text-white rounded-lg font-bold hover:bg-slate-700/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            -
          </button>
          <input
            type="number"
            min="1"
            max={balance}
            value={betAmount}
            onChange={(e) => setBetAmount(Math.max(1, Number.parseInt(e.target.value) || 0))}
            disabled={gameState === "playing"}
            className="flex-1 py-2 px-3 bg-slate-900/50 border border-cyan-500/30 rounded-lg text-white text-center focus:outline-none focus:border-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={() => setBetAmount(Math.min(balance, betAmount + 10))}
            disabled={gameState === "playing"}
            className="w-10 h-10 bg-slate-800/50 text-white rounded-lg font-bold hover:bg-slate-700/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>
      </div>

      {/* Quick Bet Buttons */}
      <div>
        <p className="text-xs text-gray-400 mb-2 font-bold">QUICK SELECT</p>
        <div className="grid grid-cols-4 gap-2">
          {quickBets.map((bet) => (
            <button
              key={bet}
              onClick={() => setBetAmount(bet)}
              disabled={gameState === "playing" || bet > balance}
              className={`py-2 text-sm rounded-lg font-bold transition ${
                betAmount === bet
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50"
                  : "bg-slate-800/50 hover:bg-slate-700/50 text-cyan-300 border border-cyan-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
              }`}
            >
              ₦{bet}
            </button>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <div className="space-y-2">
        {gameState === "playing" ? (
          hasPlacedBet ? (
            <button
              onClick={() => onCashOut(multiplier, betAmount)}
              className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-slate-900 font-black rounded-xl text-sm shadow-lg shadow-yellow-500/50 transition-all transform hover:scale-105 active:scale-95"
            >
              💰 CASH OUT ₦{potentialWin}
            </button>
          ) : (
            <button
              disabled
              className="w-full py-3 bg-slate-800/50 text-gray-400 font-black rounded-xl text-sm opacity-50 cursor-not-allowed"
            >
              ⏳ WAITING FOR NEXT ROUND
            </button>
          )
        ) : canPlaceBet ? (
          <button
            onClick={() => onStartGame(betAmount)}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black rounded-xl text-sm shadow-lg shadow-emerald-500/50 transition-all transform hover:scale-105 active:scale-95"
          >
            {hasPlacedBet ? "✅ BET PLACED" : "🎯 PLACE BET"}
          </button>
        ) : (
          <button
            disabled
            className="w-full py-3 bg-slate-800/50 text-gray-400 font-black rounded-xl text-sm opacity-50 cursor-not-allowed"
          >
            ✅ BET PLACED
          </button>
        )}
      </div>

      {/* Info Footer */}
      <div className="text-xs text-gray-500 pt-2 border-t border-cyan-500/20 font-medium">
        <p>Min: ₦1 • Max: ₦{Math.floor(balance)}</p>
      </div>
    </div>
  )
}
