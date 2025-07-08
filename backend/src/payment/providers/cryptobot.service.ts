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
  CryptoBotApiInvoice, 
  CryptoBotApiResponse 
} from '../interfaces/cryptobot.interface';
import { ExchangeRateService } from 'src/exchange-rate/exchange-rate.service';

@Injectable()
export class CryptoBotService implements PaymentProviderInterface {
  private readonly logger = new Logger(CryptoBotService.name);
  
  private currenciesData: CurrencyData[] = [];
  private lastCurrenciesUpdate: number = 0;
  private readonly CURRENCIES_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  
  constructor(
    private configService: ConfigService,
    private exchangeRateService: ExchangeRateService
  ) {
    this.logger.log(`CryptoBot API URL: ${this.apiUrl}`);
    this.logger.log(`API Token configured: ${!!this.apiToken}`);
  }

  private readonly apiUrl = this.configService.get<string>('CRYPTOBOT_USE_TESTNET') === 'true' 
    ? 'https://testnet-pay.crypt.bot/api' 
    : 'https://pay.crypt.bot/api';
  private readonly apiToken = this.configService.get<string>('CRYPTOBOT_API_TOKEN');
  
  private readonly supportedCurrencies = [
    { code: 'BTC', name: 'Bitcoin', min_receive: '0.000001' },
    { code: 'ETH', name: 'Ethereum', min_receive: '0.00001' },
    { code: 'USDT', name: 'Tether', min_receive: '0.1' },
    { code: 'USDC', name: 'USD Coin', min_receive: '0.1' },
    { code: 'TON', name: 'Toncoin', min_receive: '0.01' },
    { code: 'BNB', name: 'BNB', min_receive: '0.001' },
    { code: 'TRX', name: 'TRON', min_receive: '1' },
    { code: 'LTC', name: 'Litecoin', min_receive: '0.0001' }
  ];

  async getCurrenciesData(): Promise<CurrencyData[]> {
    // CryptoBot handles currencies internally, return empty array
    return [];
  }

  async checkMinimumAmount(
    amountKZT: number, 
    currencyCode: string
  ): Promise<{isValid: boolean; minAmount: number; errorMessage?: string}> {
    // CryptoBot handles minimum amounts internally, always return valid
    return { isValid: true, minAmount: 0 };
  }

  async createInvoice(
    amountKZT: number, 
    productId: string, 
    description: string, 
    currency?: string
  ): Promise<InvoiceResponse> {
    try {
      const amountUSD = await this.exchangeRateService.getRateToUsd('KZT') * amountKZT;
      
      this.logger.log(`Converting ${amountKZT} KZT to USD: ${amountUSD}`);
      
      if (amountUSD < 0.01) {
        throw new HttpException(
          `Amount too small: ${amountUSD.toFixed(4)} USD (minimum: $0.01)`,
          HttpStatus.BAD_REQUEST
        );
      }
      
      const data = {
        asset: 'USDT', 
        amount: amountUSD.toFixed(2),
        description: description,
        hidden_message: `Payment for product: ${productId}`,
        paid_btn_name: 'callback',
        paid_btn_url: `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:80'}/payment/success?productId=${productId}`,
        allow_comments: false,
        allow_anonymous: true,
        accepted_assets: ['BTC', 'ETH', 'USDT', 'USDC', 'TON', 'BNB', 'TRX', 'LTC'],
        expires_in: 900 // 15 minutes
      };

      this.logger.log(`Creating CryptoBot invoice with data: ${JSON.stringify(data)}`);
      this.logger.log(`Frontend URL: ${this.configService.get<string>('FRONTEND_URL')}`);

      const headers = {
        'Crypto-Pay-API-Token': this.apiToken,
        'Content-Type': 'application/json'
      };

      this.logger.log(`Sending request to: ${this.apiUrl}/createInvoice`);
      
      const response = await axios.post<CryptoBotApiResponse<CryptoBotApiInvoice>>(
        `${this.apiUrl}/createInvoice`,
        data,
        { headers }
      );

      if (!response.data.ok || !response.data.result) {
        throw new Error(response.data.error || 'Failed to create invoice');
      }

      const invoice = response.data.result;
      this.logger.log(`CryptoBot invoice created: ${JSON.stringify(invoice)}`);
      
      // Map CryptoBot response to our interface
      return {
        url: invoice.pay_url,
        token: invoice.invoice_id.toString(), // Use invoice_id as token for status checking
        amount: amountUSD.toFixed(2),
        description: description,
        success_url: `${this.configService.get<string>('FRONTEND_URL')}/payment/success?productId=${productId}`
      };
    } catch (error) {
      this.logger.error(`CryptoBot API error: ${error.message}`);
      if (error.response) {
        this.logger.error(`API response error: ${JSON.stringify(error.response.data)}`);
      }
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `Payment service error: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getInvoiceTransactions(token: string): Promise<TransactionsResponse> {
    try {
      this.logger.log(`Getting CryptoBot invoice status for invoice_id: ${token}`);
      
      const headers = {
        'Crypto-Pay-API-Token': this.apiToken,
        'Content-Type': 'application/json'
      };

      // Get invoice by invoice_id
      const response = await axios.get<CryptoBotApiResponse<{items: CryptoBotApiInvoice[]}>>(
        `${this.apiUrl}/getInvoices`,
        { 
          headers,
          params: { invoice_ids: [parseInt(token)] } // CryptoBot expects array of numbers
        }
      );

      if (!response.data.ok || !response.data.result) {
        this.logger.error(`CryptoBot API error: ${JSON.stringify(response.data)}`);
        return {
          count: 0,
          error: response.data.error || 'Invoice not found',
          result: []
        };
      }

      this.logger.log(`CryptoBot API response: ${JSON.stringify(response.data)}`);
      
      const invoices = response.data.result.items;
      
      if (!Array.isArray(invoices)) {
        this.logger.error(`Expected array but got: ${typeof invoices}, value: ${JSON.stringify(invoices)}`);
        return {
          count: 0,
          error: 'Invalid response format from CryptoBot API',
          result: []
        };
      }
      
      const invoice = invoices.find(inv => inv.invoice_id.toString() === token);
      
      if (!invoice) {
        this.logger.warn(`Invoice not found in response. Looking for ID: ${token}, Available invoices: ${invoices.map(i => i.invoice_id).join(', ')}`);
        return {
          count: 0,
          error: 'Invoice not found',
          result: []
        };
      }

      this.logger.log(`CryptoBot invoice status: ${JSON.stringify(invoice)}`);
      
      // Map CryptoBot invoice to transaction format
      const transaction = {
        id: invoice.invoice_id.toString(),
        amount: invoice.amount,
        address: '',
        dest_tag: '',
        label: token,
        currency: invoice.asset,
        status: this.mapCryptoBotStatus(invoice.status),
        blockchain_confirmations: invoice.status === 'paid' ? 1 : 0,
        blockchain_hash: invoice.hash,
        fee: '0',
        created_at: invoice.created_at,
        updated_at: null,
        type: 'receive',
        description: invoice.description
      };
      
      return {
        count: 1,
        error: '',
        result: [transaction]
      };
    } catch (error) {
      this.logger.error(`Error getting CryptoBot invoice status: ${error.message}`);
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

  private mapCryptoBotStatus(cryptoBotStatus: string): string {
    switch (cryptoBotStatus) {
      case 'active':
        return 'pending';
      case 'paid':
        return 'completed';
      case 'expired':
        return 'failed';
      default:
        return 'pending';
    }
  }

  async validateWebhookRequest(ip: string, data?: any): Promise<boolean> {
    this.logger.log('CryptoBot webhook validation skipped - using polling instead');
    return false;
  }
} 
