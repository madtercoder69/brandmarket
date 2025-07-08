import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import { WestWalletInvoiceResponse, WestWalletTransactionsResponse, WestWalletCurrencyData } from './interfaces/westwallet.interface';
import { 
  PaymentProviderInterface, 
  InvoiceResponse, 
  TransactionsResponse, 
  CurrencyData 
} from './interfaces/payment-provider.interface';
import { ExchangeRateService } from 'src/exchange-rate/exchange-rate.service';

@Injectable()
export class PaymentService implements PaymentProviderInterface {
  private readonly logger = new Logger(PaymentService.name);
  
  // Кэш для данных о валютах WestWallet
  private currenciesData: WestWalletCurrencyData[] = [];
  private lastCurrenciesUpdate: number = 0;
  private readonly CURRENCIES_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 часа
  
  constructor(
    private configService: ConfigService,
    private exchangeRateService: ExchangeRateService
  ) {
    this.logger.log(`WestWallet API URL: ${this.apiUrl}`);
    this.logger.log(`API Key configured: ${!!this.apiKey}`);
    this.logger.log(`Secret Key configured: ${!!this.secretKey}`);
    
    // Загружаем данные о валютах при старте
    this.updateCurrenciesData().catch(error => 
      this.logger.error(`Failed to load initial currencies data: ${error.message}`)
    );
  }

  private readonly apiUrl = 'https://api.westwallet.io';
  private readonly apiKey = this.configService.get<string>('WESTWALLET_API_KEY');
  private readonly secretKey = this.configService.get<string>('WESTWALLET_SECRET_KEY');
  
  // Получение данных о валютах WestWallet
  async getCurrenciesData(): Promise<CurrencyData[]> {
    // Only return USDT TRC with minimum 10 USDT configuration
    return [{
      active: true,
      address_regex: '',
      fee: '0.1',
      max_withdraw_per_transaction: '100000',
      max_withdraw_transactions_per_day: 10,
      min_receive: '10',
      min_withdraw: '10',
      name: 'Tether TRC-20',
      receive_active: true,
      require_dest_tag: false,
      send_active: true,
      tickers: ['USDTTRC']
    }];
  }
  
  // Проверка и обновление данных о валютах
  private async ensureCurrenciesDataUpdated(): Promise<void> {
    const now = Date.now();
    
    // Если данные устарели или отсутствуют, обновляем
    if (this.currenciesData.length === 0 || now - this.lastCurrenciesUpdate > this.CURRENCIES_CACHE_TTL) {
      await this.updateCurrenciesData();
    }
  }
  
  // Обновление данных о валютах
  private async updateCurrenciesData(): Promise<void> {
    try {
      this.logger.log('Updating WestWallet currencies data');
      
      const timestamp = Math.floor(Date.now() / 1000);
      const dumped = JSON.stringify({}); // Пустой объект для GET запроса
      const sign = crypto
        .createHmac('sha256', this.secretKey)
        .update(`${timestamp}${dumped}`)
        .digest('hex');
      
      const headers = {
        'Content-Type': 'application/json',
        'X-API-KEY': this.apiKey,
        'X-ACCESS-SIGN': sign,
        'X-ACCESS-TIMESTAMP': timestamp.toString()
      };
      
      const response = await axios.get<WestWalletCurrencyData[]>(
        `${this.apiUrl}/wallet/currencies_data`,
        { headers }
      );
      
      this.currenciesData = response.data;
      this.lastCurrenciesUpdate = Date.now();
      this.logger.log(`Updated currencies data: ${this.currenciesData.length} currencies`);
    } catch (error) {
      this.logger.error(`Error updating currencies data: ${error.message}`);
      // Ошибка не должна прерывать работу
    }
  }
  
  // Проверка минимальной суммы для валюты
  async checkMinimumAmount(amountKZT: number, currencyCode: string): Promise<{isValid: boolean; minAmount: number; errorMessage?: string}> {
    try {
      // Получаем данные о валюте
      const currenciesData = await this.getCurrenciesData();
      
      // Находим валюту по тикеру
      const currencyData = currenciesData.find(c => 
        c.tickers.includes(currencyCode) || 
        (currencyCode === 'USDTTRC' && c.tickers.includes('USDT'))
      );
      
      if (!currencyData) {
        return { 
          isValid: false, 
          minAmount: 0,
          errorMessage: `Currency ${currencyCode} not supported` 
        };
      }
      
      // Получаем минимальную сумму для приема в этой валюте
      const minReceiveInCrypto = parseFloat(currencyData.min_receive);
      
      // Конвертируем сумму из KZT в выбранную криптовалюту
      const amountInCrypto = await this.exchangeRateService.convertKztToCrypto(amountKZT, currencyCode);
      
      this.logger.log(`Checking min amount: ${amountInCrypto} ${currencyCode} (min: ${minReceiveInCrypto})`);
      
      if (amountInCrypto < minReceiveInCrypto) {
        // Рассчитываем минимальную сумму в KZT
        const kztToUsdRate = await this.exchangeRateService.getRateToUsd('KZT');
        const usdToCryptoRate = await this.getRateUsdToCryptoInternal(currencyCode);
        
        // Минимальная сумма в KZT = минимальная сумма в крипте / (курс KZT к USD * курс USD к крипте)
        const minAmountKZT = Math.ceil(minReceiveInCrypto / (kztToUsdRate * usdToCryptoRate));
        
        return { 
          isValid: false, 
          minAmount: minAmountKZT,
          errorMessage: `Minimum amount for ${currencyCode} is ${minReceiveInCrypto} (${minAmountKZT} KZT)` 
        };
      }
      
      return { isValid: true, minAmount: 0 };
    } catch (error) {
      this.logger.error(`Error checking minimum amount: ${error.message}`);
      return { isValid: true, minAmount: 0 }; // В случае ошибки разрешаем платеж
    }
  }
  
  // Маппинг кодов валют WestWallet в коды для CryptoCompare
  private mapCurrencyCode(westWalletCode: string): string {
    const mapping = {
      'USDTTRC': 'USDT',
      'USDTERC': 'USDT',
      'USDTBEP': 'USDT',
      'BNB20': 'BNB'
    };
    
    return mapping[westWalletCode] || westWalletCode;
  }
  
  // Публичный метод для получения курса USD к криптовалюте
  async getRateUsdToCrypto(currencyCode: string): Promise<number> {
    return this.getRateUsdToCryptoInternal(currencyCode);
  }
  
  // Получение курса USD к криптовалюте (внутренний метод)
  private async getRateUsdToCryptoInternal(currencyCode: string): Promise<number> {
    try {
      // Для стейблкоинов курс к USD = 1
      if (currencyCode.includes('USDT')) {
        return 1;
      }
      
      // Для других валют получаем курс из API CryptoCompare
      const mappedCode = this.mapCurrencyCode(currencyCode);
      const response = await axios.get(`https://min-api.cryptocompare.com/data/price?fsym=USD&tsyms=${mappedCode}`);
      
      if (!response.data || !response.data[mappedCode]) {
        throw new Error(`Failed to get exchange rate for ${mappedCode}`);
      }
      
      return response.data[mappedCode];
    } catch (error) {
      this.logger.error(`Error getting USD to crypto rate: ${error.message}`);
      
      // Запасные значения
      const fallbackRates = {
        'BTC': 0.000033, // Примерно 1 USD = 0.000033 BTC
        'ETH': 0.0005,   // Примерно 1 USD = 0.0005 ETH
        'XRP': 2,        // Примерно 1 USD = 2 XRP
        'USDT': 1,       // 1 USD = 1 USDT
        'USDTTRC': 1,    // 1 USD = 1 USDT
        'USDTERC': 1,    // 1 USD = 1 USDT
      };
      
      return fallbackRates[currencyCode] || 1;
    }
  }

  // Get current exchange rate of KZT to USD
  async getExchangeRate(): Promise<number> {
    return this.exchangeRateService.getRateToUsd('KZT');
  }
  
  // Convert KZT to USD
  private async convertKZTtoUSD(amountKZT: number): Promise<number> {
    const result = await this.exchangeRateService.convertKztToUsd(amountKZT);
    this.logger.log(`Converting ${amountKZT} KZT to USD: ${result} USD`);
    return result;
  }

  // Get exchange rate between KZT and selected cryptocurrency
  private async getExchangeRateToTargetCurrency(targetCurrency: string): Promise<number> {
    try {
      const amountInKZT = 1; // 1 KZT
      const amountInCrypto = await this.exchangeRateService.convertKztToCrypto(amountInKZT, targetCurrency);
      
      this.logger.log(`Exchange rate: 1 KZT = ${amountInCrypto} ${targetCurrency}`);
      return amountInCrypto;
    } catch (error) {
      this.logger.error(`Error getting exchange rate to crypto: ${error.message}`);
      
      try {
        const kztToUsdRate = await this.exchangeRateService.getRateToUsd('KZT');
        return kztToUsdRate; 
      } catch {
        return 0.00222; 
      }
    }
  }

  async createInvoice(amountKZT: number, productId: string, description: string, currency?: string): Promise<InvoiceResponse> {
    try {
      const targetCurrency = currency || 'USDTTRC';
      
      // Проверяем минимальную сумму для выбранной валюты
      const minAmountCheck = await this.checkMinimumAmount(amountKZT, targetCurrency);
      if (!minAmountCheck.isValid) {
        throw new HttpException(minAmountCheck.errorMessage, HttpStatus.BAD_REQUEST);
      }
      
      const amountUSD = await this.convertKZTtoUSD(amountKZT);
      
      const exchangeRateToTarget = await this.getExchangeRateToTargetCurrency(targetCurrency);
      const amountInTargetCurrency = amountKZT * exchangeRateToTarget;
      
      this.logger.log(`Converting ${amountKZT} KZT to ${targetCurrency}: ${amountInTargetCurrency}`);
      
      const data = {
        currencies: [targetCurrency],
        amount: amountInTargetCurrency.toFixed(8), 
        amount_in_usd: false, 
        ipn_url: `${this.configService.get<string>('API_URL')}/payment/webhook?productId=${productId}`,
        success_url: `${this.configService.get<string>('FRONTEND_URL')}/payment/success?productId=${productId}`,
        description: description,
        label: productId,
        ttl: 15
      };

      this.logger.log(`Creating invoice with data: ${JSON.stringify(data)}`);
      this.logger.log(`Original amount in KZT: ${amountKZT}, Converted to USD: ${amountUSD}`);
      this.logger.log(`Target currency: ${targetCurrency}, Amount: ${amountInTargetCurrency}`);
      this.logger.log(`IPN URL: ${data.ipn_url}`);
      this.logger.log(`Success URL: ${data.success_url}`);

      const timestamp = Math.floor(Date.now() / 1000);
      const dumped = JSON.stringify(data);
      const sign = crypto
        .createHmac('sha256', this.secretKey)
        .update(`${timestamp}${dumped}`)
        .digest('hex');

      const headers = {
        'Content-Type': 'application/json',
        'X-API-KEY': this.apiKey,
        'X-ACCESS-SIGN': sign,
        'X-ACCESS-TIMESTAMP': timestamp.toString()
      };

      this.logger.log(`Sending request to: ${this.apiUrl}/address/create_invoice`);
      
      const response = await axios.post<WestWalletInvoiceResponse>(
        `${this.apiUrl}/address/create_invoice`,
        data,
        { headers }
      );

      this.logger.log(`Response received: ${JSON.stringify(response.data)}`);
      
      return response.data;
    } catch (error) {
      this.logger.error(`WestWallet API error: ${error.message}`);
      if (error.response) {
        this.logger.error(`API response error: ${JSON.stringify(error.response.data)}`);
        
        if (error.response.data && error.response.data.error === 'amount_in_usd_lower_than_50') {
          throw new HttpException(
            'Payment amount is insufficient',
            HttpStatus.BAD_REQUEST
          );
        }
      }
      
      // Check if this is our own exception, just rethrow it
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
      this.logger.log(`Getting transactions for token: ${token}`);
      
      const data = { token };
      const timestamp = Math.floor(Date.now() / 1000);
      const dumped = JSON.stringify(data);
      const sign = crypto
        .createHmac('sha256', this.secretKey)
        .update(`${timestamp}${dumped}`)
        .digest('hex');

      const headers = {
        'Content-Type': 'application/json',
        'X-API-KEY': this.apiKey,
        'X-ACCESS-SIGN': sign,
        'X-ACCESS-TIMESTAMP': timestamp.toString()
      };

      this.logger.log(`Sending request to: ${this.apiUrl}/address/invoice_transactions?token=${token}`);
      
      const response = await axios.get<WestWalletTransactionsResponse>(
        `${this.apiUrl}/address/invoice_transactions?token=${token}`,
        { headers }
      );

      this.logger.log(`Transactions response: ${JSON.stringify(response.data)}`);
      
      return response.data;
    } catch (error) {
      this.logger.error(`Error getting invoice transactions: ${error.message}`);
      if (error.response) {
        this.logger.error(`API response error: ${JSON.stringify(error.response.data)}`);
      }
      throw new HttpException(
        `Failed to get invoice transactions: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async validateWebhookRequest(ip: string) {
    const allowedIp = '5.188.51.47'; // Notifications from WestWallet are sent only from this IP
    this.logger.log(`Validating webhook IP: ${ip}, allowed IP: ${allowedIp}`);
    
    if (ip !== allowedIp) {
      this.logger.warn(`Unauthorized webhook IP: ${ip}`);
      throw new HttpException('Unauthorized IP', HttpStatus.UNAUTHORIZED);
    }
    
    return true;
  }
} 