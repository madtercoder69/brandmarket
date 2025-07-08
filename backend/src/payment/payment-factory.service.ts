import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProviderInterface } from './interfaces/payment-provider.interface';
import { PaymentService } from './payment.service';
import { CryptoBotService } from './providers/cryptobot.service';
import { BTCPayService } from './providers/btcpay.service';

@Injectable()
export class PaymentFactoryService {
  private readonly logger = new Logger(PaymentFactoryService.name);
  private provider: PaymentProviderInterface;

  constructor(
    private westWalletService: PaymentService,
    private cryptoBotService: CryptoBotService,
    private btcPayService: BTCPayService,
    private configService: ConfigService
  ) {
    // Set WestWallet as default provider
    this.provider = this.westWalletService;
    this.logger.log('Initialized with WestWallet as default provider');
    
    // Log enabled payment methods
    const enabledPayments = this.getEnabledPayments();
    this.logger.log(`Enabled payment methods: ${enabledPayments.join(', ')}`);
  }

  private getEnabledPayments(): string[] {
    const enabledPaymentsEnv = this.configService.get<string>('ENABLED_PAYMENTS', 'westwallet,cryptobot');
    return enabledPaymentsEnv.split(',').map(method => method.trim().toLowerCase());
  }

  private isPaymentMethodEnabled(paymentMethod: string): boolean {
    const enabledPayments = this.getEnabledPayments();
    return enabledPayments.includes(paymentMethod.toLowerCase());
  }

  getProvider(paymentMethod?: string): PaymentProviderInterface {
    if (paymentMethod) {
      // Check if the payment method is enabled
      if (!this.isPaymentMethodEnabled(paymentMethod)) {
        this.logger.warn(`Payment method '${paymentMethod}' is disabled`);
        throw new HttpException(
          `Payment method '${paymentMethod}' is currently disabled`,
          HttpStatus.BAD_REQUEST
        );
      }

      switch (paymentMethod.toLowerCase()) {
        case 'cryptobot':
          return this.cryptoBotService;
        case 'btcpay':
        case 'btcpayserver':
          return this.btcPayService;
        case 'westwallet':
        default:
          return this.westWalletService;
      }
    }
    return this.provider;
  }

  // Delegate all methods to the selected provider
  async createInvoice(amountKZT: number, productId: string, description: string, currency?: string, paymentMethod?: string) {
    const provider = this.getProvider(paymentMethod);
    this.logger.log(`Creating invoice with payment method: ${paymentMethod}, using provider: ${provider.constructor.name}`);
    return provider.createInvoice(amountKZT, productId, description, currency);
  }

  async getInvoiceTransactions(token: string, paymentMethod?: string) {
    const provider = this.getProvider(paymentMethod);
    return provider.getInvoiceTransactions(token);
  }

  async getCurrenciesData(paymentMethod?: string) {
    const provider = this.getProvider(paymentMethod);
    return provider.getCurrenciesData();
  }

  async checkMinimumAmount(amountKZT: number, currencyCode: string, paymentMethod?: string) {
    const provider = this.getProvider(paymentMethod);
    return provider.checkMinimumAmount(amountKZT, currencyCode);
  }

  async validateWebhookRequest(ip: string, data?: any, paymentMethod?: string) {
    const provider = this.getProvider(paymentMethod);
    return provider.validateWebhookRequest(ip, data);
  }
} 