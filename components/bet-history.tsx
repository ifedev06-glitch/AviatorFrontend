"use client"

interface Bet {
  amount: number
  multiplier: number
  result: "won" | "lost"
}

interface BetHistoryProps {
  bets: Bet[]
}

export default function BetHistory({ bets }: BetHistoryProps) {
  // Format amount in Naira
  const formatNaira = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Show only latest 4 bets (they're already in reverse order from parent)
  const displayBets = bets.slice(0, 4);

  return (
    <div className="glass rounded-2xl p-6 border-cyan-500/30 shadow-2xl">
      <h2 className="text-3xl font-black mb-6 text-cyan-400 text-glow">📊 BET HISTORY (Latest 4)</h2>

      {displayBets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg font-medium">No bets yet. Place your first bet to get started!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b-2 border-cyan-500/30">
              <tr>
                <th className="text-left py-4 px-4 font-bold text-cyan-400/80">ROUND</th>
                <th className="text-left py-4 px-4 font-bold text-cyan-400/80">BET</th>
                <th className="text-left py-4 px-4 font-bold text-cyan-400/80">MULTIPLIER</th>
                <th className="text-left py-4 px-4 font-bold text-cyan-400/80">WINNINGS</th>
                <th className="text-left py-4 px-4 font-bold text-cyan-400/80">RESULT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-500/10">
              {displayBets.map((bet, idx) => {
                const winnings = bet.result === "won" ? bet.amount * bet.multiplier : 0;
                return (
                  <tr key={idx} className="hover:bg-cyan-500/5 transition-colors">
                    <td className="py-4 px-4 text-gray-300 font-semibold">#{idx + 1}</td>
                    <td className="py-4 px-4 text-blue-400 font-bold">{formatNaira(bet.amount)}</td>
                    <td className="py-4 px-4 font-bold text-cyan-400">{bet.multiplier.toFixed(2)}x</td>
                    <td
                      className={`py-4 px-4 font-bold ${bet.result === "won" ? "text-emerald-400" : "text-gray-500"}`}
                    >
                      {formatNaira(winnings)}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                          bet.result === "won"
                            ? "bg-gradient-to-r from-emerald-500/30 to-green-500/20 text-emerald-400 border border-emerald-500/50"
                            : "bg-gradient-to-r from-red-500/30 to-red-600/20 text-red-400 border border-red-500/50"
                        }`}
                      >
                        {bet.result === "won" ? "✓ WON" : "✗ LOST"}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}