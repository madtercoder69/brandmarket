export interface CryptoBotInvoiceResponse {
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
  
  export interface CryptoBotTransaction {
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
  
  export interface CryptoBotTransactionsResponse {
    count: number;
    error: string;
    result: CryptoBotTransaction[];
  }
  
  export interface CryptoBotCurrencyData {
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
  
  // CryptoBot API specific interfaces
  export interface CryptoBotApiInvoice {
    invoice_id: number;
    status: string;
    hash: string;
    currency_type: string;
    asset: string;
    amount: string;
    pay_url: string;
    description: string;
    created_at: string;
    usd_rate: string;
    allow_comments: boolean;
    allow_anonymous: boolean;
    expiration_date: string;
  }
  
  export interface CryptoBotApiResponse<T> {
    ok: boolean;
    error?: string;
    result?: T;
  }
  
  export interface CryptoBotWebhookData {
    update_id: number;
    update_type: string;
    request_date: string;
    payload: {
      invoice_id: number;
      status: string;
      hash: string;
      currency_type: string;
      asset: string;
      amount: string;
      paid_at: string;
      paid_usd_rate: string;
      comment?: string;
      hidden_message?: string;
      paid_btn_name?: string;
      paid_btn_url?: string;
    };
  } 