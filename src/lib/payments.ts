export type PayMethod = "bkash" | "nagad" | "bank" | "binance";

export const PAY_METHODS: { id: PayMethod; label: string; hint: string }[] = [
  { id: "bkash", label: "bKash", hint: "Send Money to merchant number" },
  { id: "nagad", label: "Nagad", hint: "Send Money to merchant number" },
  { id: "bank", label: "Bank Transfer", hint: "BEFTN / NPSB / branch deposit" },
  { id: "binance", label: "Binance / Crypto", hint: "Binance Pay or USDT address" },
];

export function methodAccount(method: PayMethod, payments: Record<PayMethod, string>): string {
  return payments[method] || "—";
}
