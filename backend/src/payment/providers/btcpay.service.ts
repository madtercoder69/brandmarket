import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { 
  PaymentProviderInterface, 
  InvoiceResponse, 
  TransactionsResponse, 
  CurrencyData 
} from '../interfaces/payment-provider.interface';
import { 
  BTCPayServerInvoiceRequest, 
  BTCPayServerInvoiceResponse, 
  BTCPayInvoiceStatus 
} from '../interfaces/btcpay.interface';
import { ExchangeRateService } from '../../exchange-rate/exchange-rate.service';

@Injectable()
export class BTCPayService implements PaymentProviderInterface {
  private readonly logger = new Logger(BTCPayService.name);

  constructor(
    private configService: ConfigService,
    private exchangeRateService: ExchangeRateService
  ) {
    this.logger.log(`BTCPay Server URL: ${this.apiUrl}`);
    this.logger.log(`Store ID: ${this.storeId}`);
    this.logger.log(`API Key configured: ${!!this.apiKey}`);
  }

  private readonly apiUrl = this.configService.get<string>('BTCPAY_SERVER_URL', 'https://mainnet.demo.btcpayserver.org');
  private readonly apiKey = this.configService.get<string>('BTCPAY_API_KEY');
  private readonly storeId = this.configService.get<string>('BTCPAY_STORE_ID');

  // Supported cryptocurrencies for BTCPay Server
  private readonly supportedCurrencies = [
    { code: 'BTC', name: 'Bitcoin', min_receive: '0.00001' },
    { code: 'BTC_Lightning', name: 'Bitcoin Lightning', min_receive: '0.00000001' },
    { code: 'ETH', name: 'Ethereum', min_receive: '0.001' },
    { code: 'LTC', name: 'Litecoin', min_receive: '0.001' },
    { code: 'DOGE', name: 'Dogecoin', min_receive: '1' },
    { code: 'XMR', name: 'Monero', min_receive: '0.001' }
  ];

  async getCurrenciesData(): Promise<CurrencyData[]> {
    // Return supported currencies for BTCPay Server
    return this.supportedCurrencies.map(currency => ({
      active: true,
      address_regex: '',
      fee: '0',
      max_withdraw_per_transaction: '1000000',
      max_withdraw_transactions_per_day: 10,
      min_receive: currency.min_receive,
      min_withdraw: currency.min_receive,
      name: currency.name,
      receive_active: true,
      require_dest_tag: false,
      send_active: true,
      tickers: [currency.code]
    }));
  }

  async checkMinimumAmount(
    amountKZT: number, 
    currencyCode: string
  ): Promise<{isValid: boolean; minAmount: number; errorMessage?: string}> {
    try {
      // Convert KZT to USD for minimum amount checking
      const amountUSD = await this.exchangeRateService.getRateToUsd('KZT') * amountKZT;
      
      // BTCPay Server minimum is typically $0.01 equivalent
      const minAmountUSD = 0.01;
      
      if (amountUSD < minAmountUSD) {
        const kztToUsdRate = await this.exchangeRateService.getRateToUsd('KZT');
        const minAmountKZT = Math.ceil(minAmountUSD / kztToUsdRate);
        
        return { 
          isValid: false, 
          minAmount: minAmountKZT,
          errorMessage: `Minimum amount for BTCPay Server is $${minAmountUSD} (≈${minAmountKZT} KZT)` 
        };
      }
      
      return { isValid: true, minAmount: 0 };
    } catch (error) {
      this.logger.error(`Error checking minimum amount: ${error.message}`);
      return { isValid: true, minAmount: 0 }; // Allow payment in case of error
    }
  }

  async createInvoice(
    amountKZT: number, 
    productId: string, 
    description: string, 
    currency?: string
  ): Promise<InvoiceResponse> {
    try {
      if (!this.apiKey || !this.storeId) {
        throw new HttpException(
          'BTCPay Server not configured properly. Missing API key or store ID.',
          HttpStatus.SERVICE_UNAVAILABLE
        );
      }

      // Convert KZT to USD
      const amountUSD = await this.exchangeRateService.getRateToUsd('KZT') * amountKZT;
      
      this.logger.log(`Converting ${amountKZT} KZT to USD: ${amountUSD}`);
      
      if (amountUSD < 0.01) {
        throw new HttpException(
          `Amount too small: ${amountUSD.toFixed(4)} USD (minimum: $0.01)`,
          HttpStatus.BAD_REQUEST
        );
      }

      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:80');
      
      const invoiceData: BTCPayServerInvoiceRequest = {
        amount: parseFloat(amountUSD.toFixed(2)),
        currency: 'USD',
        orderId: productId,
        itemDesc: description,
        redirectURL: `${frontendUrl}/payment/success?productId=${productId}`,
        metadata: {
          productId: productId,
          amountKZT: amountKZT,
          description: description
        }
      };

      this.logger.log(`Creating BTCPay Server invoice with data: ${JSON.stringify(invoiceData)}`);

      const headers = {
        'Authorization': `token ${this.apiKey}`,
        'Content-Type': 'application/json'
      };

      const url = `${this.apiUrl}/api/v1/stores/${this.storeId}/invoices`;
      this.logger.log(`Sending request to: ${url}`);
      
      const response = await axios.post<BTCPayServerInvoiceResponse>(
        url,
        invoiceData,
        { headers }
      );

      const invoice = response.data;
      this.logger.log(`BTCPay Server invoice created: ${JSON.stringify(invoice)}`);
      
      // Map BTCPay Server response to our interface
      return {
        url: invoice.checkoutLink,
        token: invoice.id, // Use invoice ID as token for status checking
        amount: amountUSD.toFixed(2),
        description: description,
        success_url: `${frontendUrl}/payment/success?productId=${productId}`,
        currencies: ['BTC', 'BTC_Lightning', 'ETH', 'LTC'],
        // BTCPay Server specific fields for modal display
        invoiceId: invoice.id,
        btcpayServerUrl: this.apiUrl,
        supportModal: true
      };
    } catch (error) {
      this.logger.error(`BTCPay Server API error: ${error.message}`);
      if (error.response) {
        this.logger.error(`API response error: ${JSON.stringify(error.response.data)}`);
      }
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `BTCPay Server error: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getInvoiceTransactions(token: string): Promise<TransactionsResponse> {
    try {
      if (!this.apiKey || !this.storeId) {
        return {
          count: 0,
          error: 'BTCPay Server not configured properly',
          result: []
        };
      }

      this.logger.log(`Getting BTCPay Server invoice status for invoice ID: ${token}`);
      
      const headers = {
        'Authorization': `token ${this.apiKey}`,
        'Content-Type': 'application/json'
      };

      // Get invoice by ID
      const url = `${this.apiUrl}/api/v1/stores/${this.storeId}/invoices/${token}`;
      const response = await axios.get<BTCPayServerInvoiceResponse>(url, { headers });

      const invoice = response.data;
      this.logger.log(`BTCPay Server invoice status: ${JSON.stringify(invoice)}`);
      
      // Map BTCPay Server invoice to transaction format
      const transaction = {
        id: invoice.id,
        amount: invoice.amount.toString(),
        address: '',
        dest_tag: '',
        label: token,
        currency: invoice.currency,
        status: this.mapBTCPayStatus(invoice.status, invoice.additionalStatus),
        blockchain_confirmations: invoice.status === 'Settled' ? 1 : 0,
        blockchain_hash: '',
        fee: '0',
        created_at: new Date(invoice.createdTime * 1000).toISOString(),
        updated_at: null,
        type: 'receive',
        description: invoice.itemDesc || ''
      };
      
      return {
        count: 1,
        error: '',
        result: [transaction]
      };
    } catch (error) {
      this.logger.error(`Error getting BTCPay Server invoice status: ${error.message}`);
      if (error.response) {
        this.logger.error(`API response error: ${JSON.stringify(error.response.data)}`);
      }
      
      return {
        count: 0,
        error: `Failed to get invoice status: ${error.message}`,
        result: []
      };
    }
  }

  private mapBTCPayStatus(status: BTCPayInvoiceStatus, additionalStatus?: string): string {
    switch (status) {
      case 'New':
        return 'pending';
      case 'Processing':
        return 'pending';
      case 'Settled':
        return 'completed';
      case 'Expired':
        // Check if payment was received after expiration
        if (additionalStatus === 'PaidLate') {
          return 'completed'; // Consider late payments as completed
        }
        return 'failed';
      case 'Invalid':
        return 'failed';
      default:
        return 'pending';
    }
  }

  async validateWebhookRequest(ip: string, data?: any): Promise<boolean> {
    this.logger.log('BTCPay Server webhook validation skipped - using polling instead');
    return false;
  }
} 