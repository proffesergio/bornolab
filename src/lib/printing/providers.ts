export interface PaymentProvider {
  createPayment(input: { orderId: string; amount: number;simulateFailure?:boolean }): Promise<{ reference: string; state: "demo_paid" | "pending" | "payment_failed"; demo: boolean }>;
}
export interface ShippingProvider {
  getRates(input: { district: string; quantity: number }): Promise<{ amount: number; days: number; demo: boolean }>;
  createShipment(input: { orderId: string }): Promise<{ tracking: string; provider: "mock"; demo: boolean }>;
  trackShipment(input: { tracking: string }): Promise<{ events: { at: number; status: string }[]; demo: boolean }>;
  cancelShipment(input: { tracking: string }): Promise<{ cancelled: boolean; demo: boolean }>;
}
export const mockPayment: PaymentProvider = {
  async createPayment({ orderId,simulateFailure }) { return { reference: `DEMO-${orderId}-${crypto.randomUUID().slice(0,8)}`, state: simulateFailure?"payment_failed":"demo_paid", demo: true }; },
};
export const mockShipping: ShippingProvider = {
  async getRates() { return { amount: 12000, days: 3, demo: true }; },
  async createShipment({ orderId }) { return { tracking: `DEMO-${orderId}`, provider: "mock", demo: true }; },
  async trackShipment() { return { events: [], demo: true }; },
  async cancelShipment() { return { cancelled: true, demo: true }; },
};
