// Common interface for all payment providers
export interface PaymentProviderInterface {
  createInvoice(amountKZT: number, productId: string, description: string, currency?: string): Promise<InvoiceResponse>;
  getInvoiceTransactions(token: string): Promise<TransactionsResponse>;
  getCurrenciesData(): Promise<CurrencyData[]>;
  checkMinimumAmount(amountKZT: number, currencyCode: string): Promise<{isValid: boolean; minAmount: number; errorMessage?: string}>;
  validateWebhookRequest(ip: string, data?: any): Promise<boolean>;
}

// Common response types
export interface InvoiceResponse {
  url: string;
  token: string;
  address?: string;
  label?: string;
  currencies?: string[];
  amount?: string;
  ipn_url?: string;
  success_url?: string;
  description?: string;
  amount_in_usd?: boolean;
  // BTCPay Server specific fields for modal display
  invoiceId?: string;
  btcpayServerUrl?: string;
  supportModal?: boolean;
}

export interface TransactionsResponse {
  count: number;
  error: string;
  result: Transaction[];
}

export interface Transaction {
  id: string;
  amount: string;
  address: string;
  dest_tag: string;
  label: string;
  currency: string;
  status: string;
  blockchain_confirmations: number;
  blockchain_hash: string;
  fee: string;
  created_at: string;
  updated_at: string | null;
  type: string;
  description: string | null;
}

export interface CurrencyData {
  active: boolean;
  address_regex: string;
  fee: string;
  max_withdraw_per_transaction: string;
  max_withdraw_transactions_per_day: number;
  min_receive: string;
  min_withdraw: string;
  name: string;
  receive_active: boolean;
  require_dest_tag: boolean;
  send_active: boolean;
  tickers: string[];
} 