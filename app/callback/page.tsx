// src/app/deposit/callback/page.tsx
"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getProfile, verifyDeposit, UserProfileResponse } from "@/app/lib/api";
import { FaWallet, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

function DepositCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Verifying payment...");
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get("reference");
      if (!reference) {
        setMessage("No payment reference found.");
        setIsSuccess(false);
        setLoading(false);
        setTimeout(() => router.push("/dashboard"), 2000);
        return;
      }

      try {
        const profileData = await getProfile();

        // Ensure id is defined
        if (!profileData.id) {
          throw new Error("User ID not found in profile.");
        }

        setProfile(profileData);

        // Verify deposit
        const res = await verifyDeposit({
          reference,
          userId: profileData.id,
          amount: 0,
        });

        setMessage(res || "Payment verified successfully!");
        setIsSuccess(true);
      } catch (err) {
        console.error("Verifying Payment", err);
        setMessage("Verifying Payment.");
        setIsSuccess(false);
      } finally {
        setLoading(false);
        setTimeout(() => router.push("/dashboard"), 2000);
      }
    };

    verifyPayment();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-black to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-black/40 border border-cyan-500/30 backdrop-blur-xl p-6 rounded-2xl shadow-xl shadow-cyan-500/20 text-center">
        <div className="flex justify-center mb-4">
          {isSuccess === true && <FaCheckCircle className="text-green-400 text-5xl" />}
          {isSuccess === false && <FaTimesCircle className="text-red-500 text-5xl" />}
          {isSuccess === null && <FaWallet className="text-cyan-400 text-5xl" />}
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">
          {isSuccess === null ? "Verifying Payment" : isSuccess ? "Payment Successful!" : "Payment Failed"}
        </h2>

        <p className="text-cyan-300/70 mb-4">{message}</p>

        {!loading && (
          <p className="text-sm text-slate-400">
            Redirecting to dashboard...
          </p>
        )}

        {profile && (
          <div className="mt-6 bg-black/30 border border-cyan-500/30 rounded-xl p-4 shadow-md shadow-cyan-500/20">
            <p className="text-slate-300 text-sm">Player</p>
            <p className="text-xl font-bold text-white">{profile.name}</p>
            <p className="text-slate-300 text-sm mt-2">Account Balance</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-red-400 text-transparent bg-clip-text drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]">
              ₦{profile.balance.toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DepositCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-black to-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-black/40 border border-cyan-500/30 backdrop-blur-xl p-6 rounded-2xl shadow-xl shadow-cyan-500/20 text-center">
          <div className="flex justify-center mb-4">
            <FaWallet className="text-cyan-400 text-5xl animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading...</h2>
          <p className="text-cyan-300/70">Please wait</p>
        </div>
      </div>
    }>
      <DepositCallbackContent />
    </Suspense>
  );
}