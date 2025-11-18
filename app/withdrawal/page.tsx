"use client";

import { useState, useEffect, useRef } from "react";
import {
  FaWallet,
  FaArrowDown,
  FaArrowUp,
  FaUniversity,
  FaCheckCircle,
  FaTimesCircle,
  FaPlus,
  FaArrowLeft,
} from "react-icons/fa";
import {
  getProfile,
  addBankAccount,
  getUserBankAccounts,
  requestWithdrawal,
  getUserWithdrawals,
  UserProfileResponse,
  BankAccountResponse,
  BankAccountRequest,
  WithdrawRequest,
  WithdrawalResponse,
} from "@/app/lib/api";

export default function WithdrawalPage() {
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const [bankAccounts, setBankAccounts] = useState<BankAccountResponse[]>([]);
  const [isBankLoading, setIsBankLoading] = useState(true);

  const [withdrawAmount, setWithdrawAmount] = useState<number | "">("");
  const [selectedBankId, setSelectedBankId] = useState<number | "">("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const [withdrawals, setWithdrawals] = useState<WithdrawalResponse[]>([]);
  const [isWithdrawalsLoading, setIsWithdrawalsLoading] = useState(true);

  // Add bank account modal
  const [isAddBankModalOpen, setIsAddBankModalOpen] = useState(false);
  const [bankForm, setBankForm] = useState<BankAccountRequest>({
    bankName: "",
    accountNumber: "",
    accountName: "",
  });
  const [isAddingBank, setIsAddingBank] = useState(false);

  // Success/Error modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [modalType, setModalType] = useState<"success" | "error">("success");

  const withdrawInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const profileData = await getProfile();
        setProfile(profileData);

        const accountsData = await getUserBankAccounts();
        setBankAccounts(accountsData);

        const withdrawalsData = await getUserWithdrawals();
        setWithdrawals(withdrawalsData);
      } catch (err) {
        console.error("Error loading withdrawal page:", err);
      } finally {
        setIsProfileLoading(false);
        setIsBankLoading(false);
        setIsWithdrawalsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Auto-focus input
  useEffect(() => {
    if (withdrawInputRef.current) {
      withdrawInputRef.current.focus();
    }
  }, []);

  const handleWithdraw = async () => {
    if (
      withdrawAmount === "" ||
      withdrawAmount <= 0 ||
      selectedBankId === ""
    ) {
      setModalType("error");
      setModalMessage("Please select a bank account and enter a valid amount");
      setIsModalOpen(true);
      return;
    }

    if (withdrawAmount < 200) {
      setModalType("error");
      setModalMessage("Minimum withdrawal amount is ₦200");
      setIsModalOpen(true);
      return;
    }

    if (profile && withdrawAmount > profile.balance) {
      setModalType("error");
      setModalMessage("Insufficient balance");
      setIsModalOpen(true);
      return;
    }

    setIsWithdrawing(true);

    try {
      const req: WithdrawRequest = {
        amount: withdrawAmount as number,
        bankAccountId: selectedBankId as number,
      };

      const res = await requestWithdrawal(req);

      setModalType("success");
      setModalMessage(`Withdrawal request submitted! Reference: #${res.id}.`);
      setIsModalOpen(true);

      // Reset form
      setWithdrawAmount("");
      setSelectedBankId("");

      // Refresh profile
      const profileData = await getProfile();
      setProfile(profileData);

      // Refresh withdrawals
      const withdrawalsData = await getUserWithdrawals();
      setWithdrawals(withdrawalsData);
    } catch (err: any) {
      console.error("Withdrawal failed:", err);
      setModalType("error");
      setModalMessage(
        err.response?.data?.message || "Failed to request withdrawal. Please try again."
      );
      setIsModalOpen(true);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleAddBank = async () => {
    if (!bankForm.bankName || !bankForm.accountNumber || !bankForm.accountName) {
      setModalType("error");
      setModalMessage("All fields are required");
      setIsModalOpen(true);
      return;
    }

    if (bankForm.accountNumber.length !== 10) {
      setModalType("error");
      setModalMessage("Account number must be exactly 10 digits");
      setIsModalOpen(true);
      return;
    }

    setIsAddingBank(true);

    try {
      const newAccount = await addBankAccount(bankForm);
      setBankAccounts([...bankAccounts, newAccount]);

      setModalType("success");
      setModalMessage("Bank account added successfully!");
      setIsModalOpen(true);

      setBankForm({ bankName: "", accountNumber: "", accountName: "" });
      setIsAddBankModalOpen(false);
    } catch (err: any) {
      console.error("Add bank failed:", err);
      setModalType("error");
      setModalMessage(
        err.response?.data?.message || "Failed to add bank account. Please try again."
      );
      setIsModalOpen(true);
    } finally {
      setIsAddingBank(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setModalMessage(null);
  };

  const handleBack = () => {
    window.history.back();
  };

  const isWithdrawFormValid =
    withdrawAmount !== "" && withdrawAmount > 0 && selectedBankId !== "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-black to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-black/40 border border-cyan-500/30 backdrop-blur-xl p-6 rounded-2xl shadow-xl shadow-cyan-500/20 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-white bg-red-500 hover:bg-red-600 px-3 py-2 rounded-xl transition"
          >
            <FaArrowLeft /> Back
          </button>
          <h1 className="text-3xl font-bold text-white">Withdrawal</h1>
        </div>

        {/* Profile Card */}
        {profile && (
          <div className="bg-black/30 border border-cyan-500/30 backdrop-blur-xl p-4 rounded-xl shadow-md shadow-cyan-500/20">
            <p className="text-slate-300 text-sm">Player</p>
            <p className="text-xl font-bold text-white">{profile.name}</p>
            <p className="text-slate-300 text-sm mt-2">Account Balance</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-red-400 text-transparent bg-clip-text drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]">
              ₦{profile.balance.toLocaleString()}
            </p>
          </div>
        )}

        {/* Withdraw Form */}
        <div className="space-y-4">
          <label className="block text-sm font-semibold">Select Bank Account</label>
          {isBankLoading ? (
            <div className="w-full p-3 rounded-lg bg-slate-800 border border-slate-600 text-slate-500">
              Loading bank accounts...
            </div>
          ) : bankAccounts.length > 0 ? (
            <select
              value={selectedBankId}
              onChange={(e) => setSelectedBankId(Number(e.target.value))}
              className="w-full p-3 rounded-lg bg-slate-800 border border-slate-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none text-white"
            >
              <option value="">Choose bank account...</option>
              {bankAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.bankName} - {account.accountNumber} ({account.accountName})
                </option>
              ))}
            </select>
          ) : (
            <button
              onClick={() => setIsAddBankModalOpen(true)}
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition"
            >
              + Add Bank Account
            </button>
          )}

          <label className="block text-sm font-semibold">Withdrawal Amount (₦)</label>
          <input
            ref={withdrawInputRef}
            type="number"
            placeholder="Enter amount"
            value={withdrawAmount}
            onChange={(e) =>
              setWithdrawAmount(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="w-full p-3 rounded-lg bg-slate-800 border border-slate-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none text-white placeholder:text-slate-400"
          />

          <button
            onClick={handleWithdraw}
            disabled={!isWithdrawFormValid || isWithdrawing || bankAccounts.length === 0}
            className={`w-full py-3 rounded-xl font-semibold transition ${
              isWithdrawFormValid && !isWithdrawing && bankAccounts.length > 0
                ? "bg-gradient-to-r from-cyan-400 to-red-400 hover:from-red-400 hover:to-cyan-400"
                : "bg-slate-700 cursor-not-allowed"
            }`}
          >
            {isWithdrawing ? "Processing..." : "Request Withdrawal"}
          </button>
        </div>

        {/* Withdrawal History */}
        <div className="mt-6">
          <h2 className="text-xl font-bold text-white mb-3">Withdrawal History</h2>
          {isWithdrawalsLoading ? (
            <p className="text-slate-400">Loading withdrawals...</p>
          ) : withdrawals.length === 0 ? (
            <p className="text-slate-400">No withdrawals yet.</p>
          ) : (
            <div className="space-y-2">
              {withdrawals.map((w) => (
                <div
                  key={w.id}
                  className="flex justify-between items-center p-3 bg-slate-800 border border-slate-600 rounded-lg"
                >
                  <div>
                    <p className="text-white font-semibold">
                      {w.bankName} - {w.accountNumber}
                    </p>
                    <p className="text-slate-400 text-sm">
                      Amount: ₦{w.amount.toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      w.status === "PAID"
                        ? "bg-green-500 text-white"
                        : w.status === "PENDING"
                        ? "bg-yellow-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {w.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Bank Modal */}
      {isAddBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
          <div className="bg-black/40 border border-cyan-500/30 backdrop-blur-xl p-6 rounded-2xl shadow-xl shadow-cyan-500/20 w-full max-w-md space-y-4">
            <button
              onClick={() => setIsAddBankModalOpen(false)}
              className="absolute top-4 right-4 text-white"
            >
              <FaTimesCircle className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <FaPlus /> Add Bank Account
            </h2>

            <input
              type="text"
              placeholder="Bank Name"
              value={bankForm.bankName}
              onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
              className="w-full p-3 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-slate-400"
            />
            <input
              type="text"
              placeholder="Account Number"
              value={bankForm.accountNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                if (val.length <= 10) setBankForm({ ...bankForm, accountNumber: val });
              }}
              className="w-full p-3 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-slate-400"
            />
            <input
              type="text"
              placeholder="Account Name"
              value={bankForm.accountName}
              onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
              className="w-full p-3 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-slate-400"
            />

            <button
              onClick={handleAddBank}
              disabled={isAddingBank}
              className={`w-full py-3 rounded-xl font-semibold transition ${
                !isAddingBank
                  ? "bg-gradient-to-r from-cyan-400 to-red-400 hover:from-red-400 hover:to-cyan-400"
                  : "bg-slate-700 cursor-not-allowed"
              }`}
            >
              {isAddingBank ? "Adding..." : "Add Bank Account"}
            </button>
          </div>
        </div>
      )}

      {/* Success/Error Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-black/40 border border-cyan-500/30 backdrop-blur-xl p-6 rounded-2xl shadow-xl shadow-cyan-500/20 w-full max-w-md text-center">
            {modalType === "success" ? (
              <FaCheckCircle className="mx-auto text-green-400 w-14 h-14 mb-4" />
            ) : (
              <FaTimesCircle className="mx-auto text-red-400 w-14 h-14 mb-4" />
            )}
            <p className="text-white text-lg mb-4">{modalMessage}</p>
            <button
              onClick={handleModalClose}
              className="px-6 py-3 rounded-xl font-semibold bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
