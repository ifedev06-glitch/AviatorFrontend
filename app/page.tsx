"use client";

import { useState } from "react";
import { FaUserAlt, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { loginUser } from "@/app/lib/api";
import { saveToken } from "@/app/lib/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) return;

    setIsLoading(true);
    setFeedback(null);

    try {
      const response = await loginUser({
        phoneNumber: phone,
        password: password,
      });

      saveToken(response.token);

      setFeedback("Login successful!");

      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        "Invalid credentials. Please try again.";
      setFeedback(message);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = phone && password;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-black to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-black/40 p-8 rounded-2xl border border-cyan-500/30 shadow-xl shadow-cyan-500/20 backdrop-blur-xl space-y-6">

        {/* Logo */}
        <div className="text-center">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-cyan-400 via-red-400 to-cyan-400 text-transparent bg-clip-text drop-shadow-[0_0_10px_rgba(0,255,255,0.4)]">
            CashGames
          </h1>
          <p className="text-cyan-300/70 text-sm mt-2">
            Login to your account
          </p>
        </div>

        {/* Phone Number */}
        <div className="space-y-1">
          <label className="text-white text-sm font-semibold">Phone Number</label>
          <div className="relative">
            <FaUserAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400/60" />
            <input
              type="text"
              placeholder="e.g. 08012345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-3 pl-10 rounded-lg bg-slate-900 border border-cyan-500/20 text-white placeholder:text-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-400 outline-none"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label className="text-white text-sm font-semibold">Password</label>
          <div className="relative">
            <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400/60" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 pl-10 pr-12 rounded-lg bg-slate-900 border border-cyan-500/20 text-white placeholder:text-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-300/80 hover:text-white"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <p className="text-center text-sm text-cyan-300/90 font-semibold">
            {feedback}
          </p>
        )}

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={!isFormValid || isLoading}
          className={`w-full py-3 rounded-lg font-semibold transition ${
            isFormValid
              ? "bg-gradient-to-r from-cyan-500 to-red-500 hover:opacity-90 shadow-md shadow-cyan-500/30"
              : "bg-slate-700 cursor-not-allowed"
          } text-white`}
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>

        {/* Footer */}
        <p className="text-slate-400 text-xs text-center mt-2">
          Don’t have an account?{" "}
          <span
            className="text-cyan-400 font-semibold cursor-pointer"
            onClick={() => router.push("/register")}
          >
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
}
