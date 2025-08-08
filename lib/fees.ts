import type { PaymentMethod } from "./types"

// Define fee policy per method
export function calculateFee(amount: number, method: PaymentMethod) {
  // Example fees: you can tune these numbers
  const base = 2 // THB
  const rateByMethod: Record<PaymentMethod, number> = {
    "truemoney-angpao": 0.05,
    "truemoney": 0.035,
    "promptpay": 0.01,
  }
  const rate = rateByMethod[method] ?? 0
  const fee = Math.ceil(base + amount * rate)
  const total = amount + fee
  return { fee, total }
}
