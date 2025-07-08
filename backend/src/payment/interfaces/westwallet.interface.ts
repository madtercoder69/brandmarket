export interface WestWalletInvoiceResponse {
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
}

export interface WestWalletTransaction {
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

export interface WestWalletTransactionsResponse {
  count: number;
  error: string;
  result: WestWalletTransaction[];
}

export interface ExchangeRateResponse {
  success: boolean;
  result: {
    [currency: string]: number;
  };
  timestamp: number;
}

export interface WestWalletCurrencyData {
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