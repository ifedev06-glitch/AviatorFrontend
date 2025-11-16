"use client";

import { useEffect, useState, useRef } from "react";
import { FaWallet, FaArrowDown, FaArrowUp, FaGamepad, FaHistory, FaSignOutAlt } from "react-icons/fa";
import { getProfile, UserProfileResponse, initiateDeposit } from "@/app/lib/api";
import { useRouter } from "next/navigation";
import { removeToken } from "@/app/lib/auth";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDepositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState<string>(""); // <- string now
  const [depositLoading, setDepositLoading] = useState(false);
  const depositInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await getProfile();
        setProfile(data);
      } catch (err: any) {
        console.error("Failed to fetch profile:", err);
        setError("Failed to load profile");
        if (err.response?.status === 401) {
          router.push("/");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  const handleLogout = () => {
    removeToken();
    router.push("/");
  };

  const handleDeposit = async () => {
    const amount = Number(depositAmount);
    if (!amount || amount <= 0) return;
    setDepositLoading(true);
    try {
      const response = await initiateDeposit(amount);
      window.location.href = response.data.authorization_url;
    } catch (err) {
      console.error("Deposit failed:", err);
      alert("Failed to initiate deposit. Please try again.");
    } finally {
      setDepositLoading(false);
      setDepositOpen(false);
      setDepositAmount(""); // reset input after modal closes
    }
  };

  // Auto-focus the input when modal opens
  useEffect(() => {
    if (isDepositOpen) {
      setTimeout(() => depositInputRef.current?.focus(), 100);
    }
  }, [isDepositOpen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-black to-slate-950 flex items-center justify-center">
        <div className="text-cyan-400 text-xl">Loading...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-black to-slate-950 flex items-center justify-center">
        <div className="text-red-400 text-xl">{error || "Failed to load profile"}</div>
      </div>
    );
  }

  const username = profile.name;
  const balance = profile.balance;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-black to-slate-950 p-4 flex justify-center">
      <div className="w-full max-w-2xl space-y-6">

        {/* Header / Logo */}
        <div className="flex justify-between items-center mt-4">
          <div className="text-center flex-1">
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-cyan-400 via-red-400 to-cyan-400 text-transparent bg-clip-text drop-shadow-[0_0_10px_rgba(0,255,255,0.4)]">
              CashGame
            </h1>
            <p className="text-cyan-300/70 text-sm mt-1">Welcome back, player</p>
          </div>
          <button
            onClick={handleLogout}
            className="ml-4 bg-red-500 hover:bg-red-600 text-white p-2 rounded-xl shadow-md shadow-red-500/30 transition flex items-center gap-2"
          >
            <FaSignOutAlt />
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-black/40 border border-cyan-500/30 backdrop-blur-xl rounded-2xl p-6 shadow-xl shadow-cyan-500/20 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-slate-300 text-sm">Player</p>
              <p className="text-xl font-bold text-white">{username}</p>
            </div>
            <FaWallet className="text-cyan-400 text-3xl" />
          </div>

          <div>
            <p className="text-slate-300 text-sm">Account Balance</p>
            <p className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-red-400 text-transparent bg-clip-text drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]">
              ₦{balance.toLocaleString()}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => setDepositOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-cyan-400 text-white font-semibold py-3 rounded-xl shadow-md shadow-cyan-500/30 hover:opacity-90 transition"
            >
              <FaArrowDown /> Deposit
            </button>

            <button className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-400 text-white font-semibold py-3 rounded-xl shadow-md shadow-red-500/30 hover:opacity-90 transition">
              <FaArrowUp /> Withdraw
            </button>
          </div>
        </div>

        {/* Deposit Modal */}
        <Transition appear show={isDepositOpen} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={() => setDepositOpen(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-70" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-black/40 border border-cyan-500/30 backdrop-blur-xl p-6 text-left align-middle shadow-xl shadow-cyan-500/20 transition-all">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-white text-center mb-4"
                    >
                      Deposit Funds
                    </Dialog.Title>

                    <div className="mt-2">
                      <input
                        ref={depositInputRef} // auto-focus
                        type="number"
                        min={0}
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="w-full rounded-xl border border-cyan-500/50 bg-black/30 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 placeholder:text-slate-400"
                      />
                    </div>

                    <div className="mt-4 flex justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => setDepositOpen(false)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-xl transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleDeposit}
                        disabled={depositLoading}
                        className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 rounded-xl transition disabled:opacity-50"
                      >
                        {depositLoading ? "Processing..." : "Deposit"}
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* Go to Game Card */}
        <div className="bg-black/40 border border-cyan-500/30 backdrop-blur-xl rounded-2xl p-6 shadow-xl shadow-cyan-500/20">
          <button 
            onClick={() => router.push("/game")}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-400 to-red-500 text-white py-4 rounded-xl font-bold text-lg shadow-md shadow-cyan-500/30 hover:opacity-90 transition"
          >
            <FaGamepad className="text-xl" />
            Click to Go to Game
          </button>
        </div>

        {/* Withdrawal History Card */}
        <div className="bg-black/40 border border-cyan-500/30 backdrop-blur-xl rounded-2xl p-6 shadow-xl shadow-cyan-500/20 space-y-4">
          <div className="flex items-center gap-3">
            <FaHistory className="text-cyan-400 text-2xl" />
            <h2 className="text-white text-xl font-bold">Withdrawal History</h2>
          </div>

          <p className="text-slate-400 text-center py-6 text-sm">
            No withdrawal records yet.
          </p>
        </div>

      </div>
    </div>
  );
}
