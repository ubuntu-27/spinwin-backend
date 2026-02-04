import axios from "axios";

const PASSIMPAY_API_URL = "https://api.passimpay.io/v1"; // Base URL

export class PassimPayService {
  private apiKey: string;
  private merchantId: string;

  constructor(apiKey: string, merchantId: string) {
    this.apiKey = apiKey;
    this.merchantId = merchantId;
  }

  // ✅ 1. Generate Payment URL for Bets
  async createPayment(amount: number, currency: string, orderId: string) {
    try {
      const response = await axios.post(`${PASSIMPAY_API_URL}/invoices`, {
        merchant: this.merchantId,
        amount,
        currency,
        order_id: orderId,
      }, {
        headers: { "Authorization": `Bearer ${this.apiKey}` }
      });

      return response.data; // Contains payment URL
    } catch (error) {
      console.error("PassimPay Payment Error:", error);
      throw new Error("Failed to create payment");
    }
  }

  // ✅ 2. Verify Payment Status
  async checkPaymentStatus(invoiceId: string) {
    try {
      const response = await axios.get(`${PASSIMPAY_API_URL}/invoices/${invoiceId}`, {
        headers: { "Authorization": `Bearer ${this.apiKey}` }
      });

      return response.data; // Contains payment status
    } catch (error) {
      console.error("PassimPay Status Error:", error);
      throw new Error("Failed to check payment status");
    }
  }
}


