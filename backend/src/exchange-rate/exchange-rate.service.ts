import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);
  
  private readonly KZT_RATE_TTL = 60 * 60 * 1000; 
  private readonly CRYPTO_RATE_TTL = 15 * 60 * 1000; 
  
  private readonly supportedCurrencies = [
    'BTC', 'ETH', 'XRP', 'SOL', 'DOGE', 'TON', 'BNB', 'LTC', 
    'XMR', 'ADA', 'DASH', 'BCH', 'ZEC', 'USDT'
  ];
  
  private readonly currencyMapping = {
    'USDTTRC': 'USDT',
    'USDTBEP': 'USDT',
    'USDTTON': 'USDT',
    'BNB20': 'BNB'
  };

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService
  ) {}

  async ensureKztRateUpdated(): Promise<void> {
    try {
      const kztRate = await this.prismaService.exchangeRate.findUnique({
        where: { currencyCode: 'KZT' }
      });
      
      const now = new Date();
      
      if (!kztRate || now.getTime() - kztRate.updatedAt.getTime() > this.KZT_RATE_TTL) {
        this.logger.log('KZT rate is outdated, updating...');
        await this.updateKztToUsdRate();
      }
    } catch (error) {
      this.logger.error(`Error checking KZT rate: ${error.message}`);
    }
  }
  
  async ensureCryptoRateUpdated(currencyCode: string): Promise<void> {
    try {
      const baseCode = this.currencyMapping[currencyCode] || currencyCode;
      
      const rate = await this.prismaService.exchangeRate.findUnique({
        where: { currencyCode: baseCode }
      });
      
      const now = new Date();
      
      if (!rate || now.getTime() - rate.updatedAt.getTime() > this.CRYPTO_RATE_TTL) {
        this.logger.log(`Rate for ${baseCode} is outdated, updating all crypto rates...`);
        await this.updateCryptoRates();
      }
    } catch (error) {
      this.logger.error(`Error checking crypto rate: ${error.message}`);
    }
  }

  private async updateKztToUsdRate(): Promise<void> {
    try {
      this.logger.log('Updating KZT to USD exchange rate');
      
      const response = await axios.get(
        'https://api.exchangerate-api.com/v4/latest/USD'
      );
      
      const responseData = response.data as any;
      
      if (responseData.success === false || !responseData.rates || !responseData.rates.KZT) {
        throw new Error('Failed to get KZT/USD exchange rate data');
      }
      
      const kztRate = responseData.rates.KZT;
      const kztToUsdRate = 1 / kztRate; 
      
      await this.prismaService.exchangeRate.upsert({
        where: { currencyCode: 'KZT' },
        update: { rateToUsd: kztToUsdRate },
        create: {
          currencyCode: 'KZT',
          rateToUsd: kztToUsdRate
        }
      });
      
      this.logger.log(`KZT to USD rate updated: 1 KZT = ${kztToUsdRate} USD`);
    } catch (error) {
      this.logger.error(`Error updating KZT to USD rate: ${error.message}`);
      
      await this.prismaService.exchangeRate.upsert({
        where: { currencyCode: 'KZT' },
        update: { rateToUsd: 0.00222 }, 
        create: {
          currencyCode: 'KZT',
          rateToUsd: 0.00222
        }
      });
    }
  }

  private async updateCryptoRates(): Promise<void> {
    try {
      this.logger.log('Updating cryptocurrency exchange rates');
      
      const cryptoSymbols = this.supportedCurrencies.join(',');
      
      const response = await axios.get(
        `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${cryptoSymbols}&tsyms=USD`
      );
      
      const responseData = response.data as any;
      
      if (!responseData) {
        throw new Error('Failed to get cryptocurrency rates');
      }
      
      for (const [symbol, rates] of Object.entries(responseData)) {
        const ratesObj = rates as any;
        const usdRate = ratesObj['USD']; 
        
        if (!usdRate) continue;
        
        await this.prismaService.exchangeRate.upsert({
          where: { currencyCode: symbol },
          update: { rateToUsd: usdRate },
          create: {
            currencyCode: symbol,
            rateToUsd: usdRate
          }
        });
        
        this.logger.log(`Rate updated: 1 ${symbol} = ${usdRate} USD`);
      }
      
      for (const [westCode, baseSymbol] of Object.entries(this.currencyMapping)) {
        const baseRate = await this.prismaService.exchangeRate.findUnique({
          where: { currencyCode: baseSymbol }
        });
        
        if (baseRate) {
          await this.prismaService.exchangeRate.upsert({
            where: { currencyCode: westCode },
            update: { rateToUsd: baseRate.rateToUsd },
            create: {
              currencyCode: westCode,
              rateToUsd: baseRate.rateToUsd
            }
          });
          
          this.logger.log(`WestWallet specific rate updated: 1 ${westCode} = ${baseRate.rateToUsd} USD`);
        }
      }
      
      this.logger.log('Cryptocurrency rates update completed');
    } catch (error) {
      this.logger.error(`Error updating cryptocurrency rates: ${error.message}`);
    }
  }

  async getRateToUsd(currencyCode: string): Promise<number> {
    try {
      if (currencyCode === 'KZT') {
        await this.ensureKztRateUpdated();
      } else if (this.supportedCurrencies.includes(currencyCode) || this.currencyMapping[currencyCode]) {
        await this.ensureCryptoRateUpdated(currencyCode);
      }
      
      const rate = await this.prismaService.exchangeRate.findUnique({
        where: { currencyCode }
      });
      
      if (rate) {
        return rate.rateToUsd;
      }
      
      if (this.currencyMapping[currencyCode]) {
        const baseRate = await this.prismaService.exchangeRate.findUnique({
          where: { currencyCode: this.currencyMapping[currencyCode] }
        });
        
        if (baseRate) {
          return baseRate.rateToUsd;
        }
      }
      
      if (currencyCode.includes('USDT')) {
        return 1;
      }
      
      const fallbackRates = {
        'BTC': 30000,
        'ETH': 2000,
        'XRP': 0.5,
        'SOL': 40,
        'DOGE': 0.1,
        'TON': 5,
        'BNB': 300,
        'LTC': 70,
        'XMR': 150,
        'ADA': 0.5,
        'DASH': 30,
        'BCH': 300,
        'ZEC': 60,
        'KZT': 0.00222 
      };
      
      return fallbackRates[currencyCode] || 1;
    } catch (error) {
      this.logger.error(`Error getting rate for ${currencyCode}: ${error.message}`);
      
      const fallbackRates = {
        'BTC': 30000,
        'ETH': 2000,
        'XRP': 0.5,
        'SOL': 40,
        'DOGE': 0.1,
        'TON': 5,
        'BNB': 300,
        'LTC': 70,
        'XMR': 150,
        'ADA': 0.5,
        'DASH': 30,
        'BCH': 300,
        'ZEC': 60,
        'KZT': 0.00222 
      };
      
      return fallbackRates[currencyCode] || 1;
    }
  }

  async convertKztToUsd(amountKzt: number): Promise<number> {
    const rate = await this.getRateToUsd('KZT');
    return amountKzt * rate;
  }
  
  async convertKztToCrypto(amountKzt: number, targetCurrency: string): Promise<number> {
    try {
      const kztToUsdRate = await this.getRateToUsd('KZT');
      
      const cryptoToUsdRate = await this.getRateToUsd(targetCurrency);
      
      const amountUsd = amountKzt * kztToUsdRate;
      
      if (targetCurrency.includes('USDT')) {
        return amountUsd;
      }
      
      return amountUsd / cryptoToUsdRate;
    } catch (error) {
      this.logger.error(`Error converting KZT to ${targetCurrency}: ${error.message}`);
      
      const fallbackKztToUsd = 0.00222;
      const amountUsd = amountKzt * fallbackKztToUsd;
      
      if (targetCurrency.includes('USDT')) {
        return amountUsd;
      }
      
      const fallbackRates = {
        'BTC': 30000,
        'ETH': 2000,
        'XRP': 0.5,
        'SOL': 40,
        'DOGE': 0.1,
        'TON': 5,
        'BNB': 300,
        'LTC': 70,
        'XMR': 150,
        'ADA': 0.5,
        'DASH': 30,
        'BCH': 300,
        'ZEC': 60
      };
      
      const cryptoRate = fallbackRates[targetCurrency] || 1;
      return amountUsd / cryptoRate;
    }
  }

  async getAllRates() {
    try {
      await Promise.all([
        this.ensureKztRateUpdated(),
        this.ensureCryptoRateUpdated('BTC')
      ]);
    } catch (error) {
      this.logger.error(`Error updating rates before getAllRates: ${error.message}`);
    }
    
    return this.prismaService.exchangeRate.findMany();
  }

  async initRates() {
    try {
      const count = await this.prismaService.exchangeRate.count();
      
      if (count === 0) {
        this.logger.log('Initial exchange rate data not found, creating...');
        
        const initialRates = [
          { currencyCode: 'KZT', rateToUsd: 0.00222 }, // 450 KZT = 1 USD
          { currencyCode: 'BTC', rateToUsd: 30000 },
          { currencyCode: 'ETH', rateToUsd: 2000 },
          { currencyCode: 'USDT', rateToUsd: 1 },
          { currencyCode: 'USDTTRC', rateToUsd: 1 },
          { currencyCode: 'USDTBEP', rateToUsd: 1 },
          { currencyCode: 'USDTTON', rateToUsd: 1 }
        ];
        
        for (const rate of initialRates) {
          await this.prismaService.exchangeRate.create({
            data: rate
          });
        }
        
        this.logger.log('Initial exchange rates created with fallback values');
        
        setTimeout(() => {
          this.updateKztToUsdRate().catch(error => 
            this.logger.error(`Background KZT rate update failed: ${error.message}`)
          );
          this.updateCryptoRates().catch(error => 
            this.logger.error(`Background crypto rates update failed: ${error.message}`)
          );
        }, 1000);
      }
    } catch (error) {
      this.logger.error(`Error initializing rates: ${error.message}`);
    }
  }
} 