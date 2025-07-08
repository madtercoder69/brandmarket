// BTCPay Server API interfaces
export interface BTCPayServerInvoiceRequest {
  amount: number;
  currency: string;
  orderId?: string;
  itemDesc?: string;
  redirectURL?: string;
  notificationURL?: string;
  metadata?: {
    [key: string]: any;
  };
}

export interface BTCPayServerInvoiceResponse {
  id: string;
  storeId: string;
  amount: number;
  currency: string;
  type: string;
  checkoutLink: string;
  createdTime: number;
  expirationTime: number;
  monitoringTime: number;
  status: BTCPayInvoiceStatus;
  additionalStatus: BTCPayAdditionalStatus;
  availableStatusesForManualMarking: string[];
  archived: boolean;
  orderId?: string;
  itemDesc?: string;
  metadata?: {
    [key: string]: any;
  };
}

export interface BTCPayServerApiResponse<T> {
  data?: T;
  error?: string;
}

export type BTCPayInvoiceStatus = 'New' | 'Processing' | 'Settled' | 'Expired' | 'Invalid';
export type BTCPayAdditionalStatus = 'None' | 'PaidLate' | 'PaidOver' | 'PaidPartial' | 'Marked' | 'Invalid';

export interface BTCPayServerStoreInfo {
  id: string;
  name: string;
  website?: string;
  defaultCurrency: string;
  defaultPaymentMethod: string;
}

export interface BTCPayServerPaymentMethod {
  paymentMethod: string;
  cryptoCode: string;
  destination: string;
  paymentLink: string;
  rate: number;
  paymentMethodPaid: number;
  totalPaid: number;
  due: number;
  amount: number;
  networkFee: number;
} 