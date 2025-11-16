// src/app/lib/api.ts
import axios from "axios";
import { BACKEND_BASE_URL, LOGIN_API, REGISTER_API } from "@/app/lib/constatnt";
import { getToken } from "./auth";

// ---------- Axios instance ----------
const apiClient = axios.create({
  baseURL: BACKEND_BASE_URL,
  timeout: 30000,
});

// Interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    console.log("[Axios Request] token:", token);
    if (token) {
      config.headers = config.headers ?? {};
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    console.log("[Axios Request] header about to be set:", config.headers?.["Authorization"]);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ---------- Auth Interfaces ----------
export interface LoginRequest { 
  phoneNumber: string; 
  password: string; 
}

export interface LoginResponse {  
  success: boolean;
  message: string;
  token: string;
  playerId?: string;
  balance?: number;
}

export interface SignupRequest { 
  name: string; 
  phoneNumber: string; 
  password: string; 
}

export interface SignupResponse { 
  success: boolean;
  message: string; 
  token: string;
  playerId?: string;
  balance?: number;
}

export interface UserProfileResponse {
  name: string;
  balance: number;
  id?: number; 
}

// ---------- Auth Functions ----------
export async function loginUser(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(LOGIN_API, credentials);
  return response.data;
}

export async function signupUser(credentials: SignupRequest): Promise<SignupResponse> {
  const response = await apiClient.post<SignupResponse>(REGISTER_API, credentials);
  return response.data;
}

export async function getProfile(): Promise<UserProfileResponse> {
  const response = await apiClient.get<UserProfileResponse>("/user/profile");
  return response.data;
}

// ---------- Aviator Game Interfaces ----------
export interface AviatorRoundResponse {
  multiplier: number;
  roundId: string;
}

export interface RoundInfo {
  roundId: string | null;
  bettingOpen: boolean;
  currentMultiplier: number;
  crashMultiplier: number | null;
}

// ---------- Aviator Game Functions ----------
export async function getNextMultiplier(): Promise<AviatorRoundResponse> {
  const response = await apiClient.get<AviatorRoundResponse>("/api/aviator/next");
  return response.data;
}

export async function getRoundInfo(): Promise<RoundInfo> {
  const response = await apiClient.get<RoundInfo>("/api/aviator/round-info");
  return response.data;
}

// ---------- Betting Interfaces ----------
export interface PlaceBetRequest {
  amount: number;
}

export interface BetResponse {
  betId: number;
  betAmount: number;
  roundId: string;
  status: "PENDING" | "ACTIVE" | "CASHED_OUT" | "LOST";
  message: string;
  remainingBalance: number;
}

export interface CashoutResponse {
  betId: number;
  cashoutMultiplier: number;
  winAmount: number;
  newBalance: number;
  message: string;
}

export interface BetHistoryItem {
  id: number;
  betAmount: number;
  multiplier: number | null;
  cashoutMultiplier: number | null;
  winAmount: number | null;
  status: "PENDING" | "ACTIVE" | "CASHED_OUT" | "LOST";
  roundId: string;
  placedAt: string;
  cashedOutAt: string | null;
}

// ---------- Betting Functions ----------
export async function placeBet(request: PlaceBetRequest): Promise<BetResponse> {
  const response = await apiClient.post<BetResponse>("/api/bets/place", request);
  return response.data;
}

export async function cashout(): Promise<CashoutResponse> {
  const response = await apiClient.post<CashoutResponse>("/api/bets/cashout");
  return response.data;
}

export async function getBetHistory(): Promise<BetHistoryItem[]> {
  const response = await apiClient.get<BetHistoryItem[]>("/api/bets/history");
  return response.data;
}

export async function getBetRoundInfo(): Promise<RoundInfo> {
  const response = await apiClient.get<RoundInfo>("/api/bets/round-info");
  return response.data;
}

// ---------- Deposit Interfaces ----------
export interface DepositRequest {
  amount: number;
}

export interface DepositResponse {
  message: string;
  newBalance: number;
}

export interface DepositPaystackResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface VerifyDepositRequest {
  reference: string;
  userId: number;
  amount: number;
}

// ---------- Deposit Functions ----------
export async function deposit(amount: number): Promise<DepositResponse> {
  const response = await apiClient.post<DepositResponse>("/api/payments/deposit", {
    amount
  });
  return response.data;
}

export async function initiateDeposit(amount: number): Promise<DepositPaystackResponse> {
  const response = await apiClient.post<DepositPaystackResponse>("/api/deposits/initiate", {
    amount
  });
  return response.data;
}

export async function verifyDeposit(req: VerifyDepositRequest): Promise<string> {
  const response = await apiClient.get<string>("/deposits/verify", {
    params: {
      reference: req.reference,
      userId: req.userId,
      amount: req.amount
    }
  });
  return response.data;
}

export async function getBalance(): Promise<number> {
  const response = await apiClient.get<number>("/api/payments/balance");
  return response.data;
}

// ---------- Bank Account & Withdrawal Interfaces ----------
export interface BankAccountRequest {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface BankAccountResponse {
  id: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface WithdrawRequest {
  amount: number;
  bankAccountId: number;
}

export interface WithdrawalResponse {
  id: number;
  userId: number;
  userName: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  status: "PENDING" | "PAID" | "REJECTED" | "CANCELLED";
}

// ---------- Bank Account & Withdrawal Functions ----------
export async function addBankAccount(request: BankAccountRequest): Promise<BankAccountResponse> {
  const response = await apiClient.post<BankAccountResponse>(
    "/api/v1/payments/bank-accounts",
    request
  );
  return response.data;
}

export async function getUserBankAccounts(): Promise<BankAccountResponse[]> {
  const response = await apiClient.get<BankAccountResponse[]>(
    "/api/v1/payments/bank-accounts"
  );
  return response.data;
}

export async function requestWithdrawal(request: WithdrawRequest): Promise<WithdrawalResponse> {
  const response = await apiClient.post<WithdrawalResponse>(
    "/api/v1/payments/withdraw",
    request
  );
  return response.data;
}

// ---------- Withdrawal History ----------
export async function getUserWithdrawals(): Promise<WithdrawalResponse[]> {
  const response = await apiClient.get<WithdrawalResponse[]>("/api/v1/payments/history");
  return response.data;
}
{}

export default apiClient;