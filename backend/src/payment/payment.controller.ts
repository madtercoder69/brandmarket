import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Ip,
  Post,
  Query,
  Req,
  UseGuards,
  Param,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentService } from './payment.service';
import { PaymentFactoryService } from './payment-factory.service';
import { PrismaService } from 'src/prisma.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { StoreOwnerGuard } from 'src/auth/guards/store-owner.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { ChatService } from 'src/chat/chat.service';

@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);
  
  constructor(
    private readonly paymentService: PaymentService,
    private readonly paymentFactory: PaymentFactoryService,
    private readonly prismaService: PrismaService,
    private readonly chatService: ChatService,
    private readonly configService: ConfigService,
  ) {}

  @Get('supported-currencies')
  async getSupportedCurrencies() {
    try {
      // Получаем данные о валютах
      const currenciesData = await this.paymentFactory.getCurrenciesData();
      
      // Фильтруем только активные валюты для приема платежей
      const supportedCurrencies = currenciesData
        .filter(c => c.active && c.receive_active)
        .flatMap(currency => {
          return currency.tickers.map(ticker => ({
            code: ticker,
            name: currency.name,
            minReceive: currency.min_receive
          }));
        });
      
      // Удаляем дубликаты (если один и тот же ticker присутствует в нескольких валютах)
      const uniqueCurrencies = [];
      const seenCodes = new Set();
      
      for (const currency of supportedCurrencies) {
        if (!seenCodes.has(currency.code)) {
          seenCodes.add(currency.code);
          uniqueCurrencies.push(currency);
        }
      }
      
      return {
        success: true,
        currencies: uniqueCurrencies
      };
    } catch (error) {
      console.error('Error getting supported currencies:', error);
      
      // В случае ошибки возвращаем статический список основных валют
      return { 
        success: false, 
        error: 'Failed to get supported currencies',
        currencies: [
          { code: 'BTC', name: 'Bitcoin' },
          { code: 'ETH', name: 'Ethereum' },
          { code: 'USDTTRC', name: 'USDT TRC-20' },
          { code: 'XRP', name: 'Ripple' },
          { code: 'SOL', name: 'Solana' },
          { code: 'DOGE', name: 'Dogecoin' },
          { code: 'TON', name: 'Toncoin' }
        ]
      };
    }
  }

  @Get('min-amount')
  async getMinimumAmount(@Query('currency') currency?: string) {
    try {
      const defaultCurrency = currency || 'USDTTRC';
      
      // Получаем курс обмена KZT к USD
      const rate = await this.paymentService.getExchangeRate();
      
      // Получаем данные о валютах WestWallet
      const currenciesData = await this.paymentService.getCurrenciesData();
      
      const result = {
        success: true,
        currencies: []
      };
      
      // Получаем информацию о минимальных суммах для всех поддерживаемых валют
      for (const currencyData of currenciesData) {
        if (currencyData.active && currencyData.receive_active) {
          for (const ticker of currencyData.tickers) {
            try {
              // Проверяем, есть ли уже эта валюта в результате
              const existingCurrency = result.currencies.find(c => c.code === ticker);
              if (existingCurrency) continue;
              
              const minReceiveInCrypto = parseFloat(currencyData.min_receive);
              
              // Рассчитываем минимальную сумму в KZT
              const kztToUsdRate = await this.paymentService.getExchangeRate();
              const usdToCryptoRate = await this.paymentService.getRateUsdToCrypto(ticker);
              
              // Минимальная сумма в KZT = минимальная сумма в крипте / (курс KZT к USD * курс USD к крипте)
              const minAmountKZT = Math.ceil(minReceiveInCrypto / (kztToUsdRate * usdToCryptoRate));
              
              result.currencies.push({
                code: ticker,
                name: currencyData.name,
                minAmount: minReceiveInCrypto,
                minAmountKZT: minAmountKZT
              });
            } catch (error) {
              console.error(`Error calculating min amount for ${ticker}: ${error.message}`);
            }
          }
        }
      }
      
      // Если указана конкретная валюта, возвращаем только её данные
      if (currency) {
        const currencyInfo = result.currencies.find(c => c.code === currency);
        if (currencyInfo) {
          return {
            success: true,
            currency: currencyInfo.code,
            name: currencyInfo.name,
            minAmount: currencyInfo.minAmount,
            minAmountKZT: currencyInfo.minAmountKZT,
            rate: rate
          };
        } else {
          return { 
            success: false, 
            error: `Currency ${currency} not supported or not active`,
            currencies: result.currencies
          };
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error getting minimum amount:', error);
      return { 
        success: false, 
        error: 'Failed to get minimum amount'
      };
    }
  }

  @Get('payment-methods')
  async getPaymentMethods() {
    try {
      // Get enabled payment methods from environment variable
      const enabledPaymentsEnv = this.configService.get<string>('ENABLED_PAYMENTS', 'westwallet,cryptobot');
      const enabledPayments = enabledPaymentsEnv.split(',').map(method => method.trim().toLowerCase());
      
      // Get current KZT to USD exchange rate for accurate conversion
      const kztToUsdRate = await this.paymentService.getExchangeRate();
      
      // Calculate minimum amount in KZT for WestWallet (10 USDT)
      const westWalletMinUSDT = 10;
      const westWalletMinKZT = Math.ceil(westWalletMinUSDT / kztToUsdRate);
      
      // Define all available payment methods
      const allPaymentMethods = [
        {
          id: 'westwallet',
          name: 'WestWallet',
          description: 'USDT TRC-20',
          supportedCurrencies: ['USDTTRC'],
          minAmount: westWalletMinUSDT,
          minAmountKZT: westWalletMinKZT,
          minAmountDisplay: `${westWalletMinUSDT} USDT (≈${westWalletMinKZT} KZT)`,
          icon: 'wallet'
        },
        {
          id: 'cryptobot',
          name: 'CryptoBot',
          description: 'KZT / USDT',
          supportedCurrencies: ['BTC', 'ETH', 'USDT', 'USDC', 'TON', 'BNB', 'TRX', 'LTC'],
          minAmount: 0.01,
          minAmountKZT: Math.ceil(0.01 / kztToUsdRate),
          minAmountDisplay: `$0.01`,
          icon: 'bot'
        },
        {
          id: 'btcpay',
          name: 'BTCPay Server',
          description: 'Bitcoin / Lightning / Crypto',
          supportedCurrencies: ['BTC', 'BTC_Lightning', 'ETH', 'LTC', 'DOGE', 'XMR'],
          minAmount: 0.01,
          minAmountKZT: Math.ceil(0.01 / kztToUsdRate),
          minAmountDisplay: `$0.01`,
          icon: 'bitcoin'
        }
      ];
      
      // Filter methods based on enabled payments
      const enabledMethods = allPaymentMethods.filter(method => 
        enabledPayments.includes(method.id)
      );
      
      this.logger.log(`Enabled payment methods: ${enabledPayments.join(', ')}`);
      this.logger.log(`Returning ${enabledMethods.length} payment methods`);
      
      return {
        success: true,
        methods: enabledMethods
      };
    } catch (error) {
      console.error('Error getting payment methods:', error);
      
      // Fallback: also respect enabled payments in error case
      const enabledPaymentsEnv = this.configService.get<string>('ENABLED_PAYMENTS', 'westwallet,cryptobot');
      const enabledPayments = enabledPaymentsEnv.split(',').map(method => method.trim().toLowerCase());
      
      const fallbackMethods = [
        {
          id: 'westwallet',
          name: 'WestWallet',
          description: 'USDT TRC-20',
          supportedCurrencies: ['USDTTRC'],
          minAmount: 10,
          minAmountKZT: 4500, // Fallback value
          minAmountDisplay: '10 USDT (≈4500 KZT)',
          icon: 'wallet'
        },
        {
          id: 'cryptobot',
          name: 'CryptoBot',
          description: 'KZT / USDT',
          supportedCurrencies: ['BTC', 'ETH', 'USDT', 'USDC', 'TON', 'BNB', 'TRX', 'LTC'],
          minAmount: 0.01,
          minAmountKZT: 5, // Fallback value
          minAmountDisplay: '$0.01',
          icon: 'bot'
        },
        {
          id: 'btcpay',
          name: 'BTCPay Server',
          description: 'Bitcoin / Lightning / Crypto',
          supportedCurrencies: ['BTC', 'BTC_Lightning', 'ETH', 'LTC', 'DOGE', 'XMR'],
          minAmount: 0.01,
          minAmountKZT: 5, // Fallback value
          minAmountDisplay: '$0.01',
          icon: 'bitcoin'
        }
      ].filter(method => enabledPayments.includes(method.id));
      
      return { 
        success: true, 
        methods: fallbackMethods
      };
    }
  }

  @Post('create-invoice')
  async createInvoice(@Body() body: { productId: string; lang?: string; paymentMethod?: string }, @Query('userId') userId?: string) {
    try {
      const { productId, lang = 'ru', paymentMethod } = body;
      
      // Check if product is already purchased
      const existingCompletedPayment = await this.prismaService.payment.findFirst({
        where: {
          productId,
          status: 'COMPLETED'
        }
      });

      if (existingCompletedPayment) {
        console.log('Product already purchased:', productId);
        return {
          success: false,
          error: 'This product has already been purchased'
        };
      }
      
      const product = await this.prismaService.product.findUnique({
        where: { id: productId },
        include: { store: true },
      });

      if (!product) {
        console.log('Product not found:', productId);
        return { success: false, error: 'Product not found' };
      }

      console.log('Creating invoice for product:', product.name, 'with price:', product.price);
      console.log('Language:', lang);
      console.log('Selected payment method:', paymentMethod);
      
      try {
        const invoice = await this.paymentFactory.createInvoice(
          product.price,
          productId,
          `Payment for ${product.name}`,
          'USDTTRC', // Default currency for WestWallet
          paymentMethod
        );

        console.log('Invoice created:', invoice);

        if (!invoice || !invoice.token) {
          console.error('No token in invoice response:', invoice);
          return { success: false, error: 'Invalid invoice response from payment gateway' };
        }

        const payment = await this.prismaService.payment.create({
          data: {
            invoiceToken: invoice.token,
            productId: product.id,
            amount: product.price,
            paymentMethod: paymentMethod || 'westwallet',
            status: 'PENDING',
          },
        });
        
        console.log('Payment record created:', payment);

        return {
          success: true,
          invoiceUrl: invoice.url,
          invoiceToken: invoice.token,
          // BTCPay Server modal support
          ...(invoice.supportModal && {
            supportModal: invoice.supportModal,
            invoiceId: invoice.invoiceId,
            btcpayServerUrl: invoice.btcpayServerUrl
          })
        };
      } catch (error) {
        if (error instanceof HttpException && error.getStatus() === HttpStatus.BAD_REQUEST) {
          // Если сообщение об ошибке содержит информацию о минимальной сумме
          if (error.message.includes('Minimum amount for')) {
            // Извлекаем код валюты и минимальную сумму из сообщения
            const matches = error.message.match(/Minimum amount for (\w+) is (\d+\.?\d*) \((\d+) KZT\)/);
            
            if (matches && matches.length >= 4) {
              const [, currencyCode, minAmount, minAmountKZT] = matches;
              
              // Возвращаем структурированную ошибку с информацией о минимальной сумме
              return { 
                success: false, 
                error: 'minAmountError',
                errorDetails: {
                  currency: currencyCode,
                  minAmount: minAmount,
                  minAmountKZT: minAmountKZT
                }
              };
            }
          }
          
          return { success: false, error: error.message };
        }
        throw error;
      }
    } catch (error) {
      console.error('Create invoice error details:', error.message);
      if (error.response) {
        console.error('API response error:', error.response.data);
      }
      
              // Handle other API errors
      if (error.response && error.response.data) {
        const errorData = error.response.data;
          return { success: false, error: errorData.error || 'Failed to create invoice' };
      }
      
      return { success: false, error: 'Failed to create invoice' };
    }
  }

  @Post('webhook')
  @HttpCode(200)
  async handlePaymentWebhook(
    @Ip() ip: string,
    @Body() webhookData: any,
    @Query('productId') productId: string,
  ) {
    try {
      console.log('Received webhook from IP:', ip, 'for product:', productId);
      console.log('Webhook data:', webhookData);
      
      // We'll need to get the payment method from the payment record for webhook validation
      const payment = await this.prismaService.payment.findFirst({
        where: { productId, status: 'PENDING' }
      });
      
      await this.paymentFactory.validateWebhookRequest(ip, webhookData, payment?.paymentMethod);

      const { id, status, amount, blockchain_hash, currency } = webhookData;

      if (status === 'completed') {
        console.log('Payment completed, updating status in DB');
        
        const product = await this.prismaService.product.findUnique({
          where: { id: productId },
          include: {
            store: {
              include: {
                owner: true
              }
            }
          }
        });

        if (!product) {
          console.error('Product not found for payment update:', productId);
          return { received: true, error: 'Product not found' };
        }
        
        const paymentRecord = await this.prismaService.payment.findFirst({
          where: { productId, status: 'PENDING' },
          include: {
            product: true
          }
        });
        
        if (paymentRecord) {
          await this.prismaService.payment.update({
            where: { id: paymentRecord.id },
            data: {
              status: 'COMPLETED',
              transactionId: id,
              transactionHash: blockchain_hash,
              currency,
            },
          });
        }

        await this.prismaService.user.update({
          where: { id: product.store.owner.id },
          data: {
            balance: {
              increment: product.price
            }
          }
        });

        console.log(`Updated balance for store owner ${product.store.owner.id} with amount ${product.price}`);
        
        if (paymentRecord) {
          const transactions = await this.paymentFactory.getInvoiceTransactions(paymentRecord.invoiceToken, paymentRecord.paymentMethod);
          if (transactions && transactions.result && transactions.result.length > 0) {
            const transaction = transactions.result[0];
            
            try {
              const buyers = await this.prismaService.user.findMany({
                where: { role: 'USER' },
                take: 1,
              });
              
              if (buyers.length > 0) {
                const buyerId = buyers[0].id;
                
                const user = await this.prismaService.user.findUnique({
                  where: { id: buyerId },
                  select: { id: true }
                });
                
                const userLang = 'ru';
                
                const chat = await this.chatService.findOrCreateChat(
                  buyerId,
                  product.store.owner.id,
                  productId,
                );
                
                let paymentMessage = '';
                
                switch(userLang as string) {
                  case 'en':
                    paymentMessage = `Payment for ${product.name} was successfully completed. Amount: ${product.price} KZT, Transaction ID: ${id}`;
                    break;
                  case 'ru':
                    paymentMessage = `Оплата за ${product.name} успешно завершена. Сумма: ${product.price} KZT, ID транзакции: ${id}`;
                    break;
                  case 'kk':
                    paymentMessage = `${product.name} үшін төлем сәтті аяқталды. Сома: ${product.price} KZT, Транзакция идентификаторы: ${id}`;
                    break;
                  default:
                    paymentMessage = `Оплата за ${product.name} успешно завершена. Сумма: ${product.price} KZT, ID транзакции: ${id}`;
                }
                
                await this.chatService.createMessage(
                  chat.id,
                  product.store.owner.id,
                  paymentMessage
                );
                
                // Send product files and comment to buyer after successful payment
                if (product.attachedFiles && product.attachedFiles.length > 0) {
                  const filesMessage = product.attachedFiles.map(file => 
                    `📎 <a href="/files/products/${encodeURIComponent(file)}" download target="_blank">${file}</a>`
                  ).join('\n');
                  await this.chatService.createMessage(
                    chat.id,
                    product.store.owner.id,
                    filesMessage
                  );
                }
                
                if (product.comment) {
                  await this.chatService.createMessage(
                    chat.id,
                    product.store.owner.id,
                    `💬 ${product.comment}`
                  );
                }
                
                console.log(`Created payment confirmation message in chat ${chat.id} in language ${userLang}`);
              }
            } catch (chatError) {
              console.error('Error creating chat or message after payment:', chatError);
            }
          }
        }
      }

      return { received: true };
    } catch (error) {
      console.error('Webhook error:', error);
      return { received: false, error: error.message };
    }
  }

  @Get('check-status')
  async checkPaymentStatus(
    @Query('token') token: string, 
    @Query('userId') userId: string,
    @Query('lang') lang: string = 'ru'
  ) {
    try {
      console.log('Checking payment status for token:', token);
      console.log('User language:', lang);
      
      const payment = await this.prismaService.payment.findFirst({
        where: { invoiceToken: token },
        include: {
          product: {
            include: {
              store: {
                include: {
                  owner: true
                }
              }
            }
          }
        }
      });

      if (!payment) {
        console.log('Payment not found for token:', token);
        return { error: 'Payment not found' };
      }

      console.log('Payment found:', payment);

      if (payment.status === 'PENDING') {
        console.log('Payment is pending, checking transactions via API');
        console.log('Using payment method:', payment.paymentMethod);
        
        const transactions = await this.paymentFactory.getInvoiceTransactions(token, payment.paymentMethod);
        console.log('Transactions for token:', transactions);
        
        if (transactions.count > 0 && transactions.result.some(tx => tx.status === 'completed')) {
          console.log('Completed transaction found, updating payment status');
          
          await this.prismaService.payment.update({
            where: { id: payment.id },
            data: { status: 'COMPLETED' },
          });
          
          await this.prismaService.user.update({
            where: { id: payment.product.store.owner.id },
            data: {
              balance: {
                increment: payment.amount
              }
            }
          });
          
          console.log(`Updated balance for store owner ${payment.product.store.owner.id} with amount ${payment.amount}`);
          
          if (userId) {
            try {
              const chat = await this.chatService.findOrCreateChat(
                userId,
                payment.product.store.owner.id,
                payment.product.id,
              );
              
              let paymentMessage = '';
              
              switch(lang as string) {
                case 'en':
                  paymentMessage = `Payment for ${payment.product.name} was successfully completed. Amount: ${payment.amount} KZT`;
                  break;
                case 'ru':
                  paymentMessage = `Оплата за ${payment.product.name} успешно завершена. Сумма: ${payment.amount} KZT`;
                  break;
                case 'kk':
                  paymentMessage = `${payment.product.name} үшін төлем сәтті аяқталды. Сома: ${payment.amount} KZT`;
                  break;
                default:
                  paymentMessage = `Оплата за ${payment.product.name} успешно завершена. Сумма: ${payment.amount} KZT`;
              }
              
              await this.chatService.createMessage(
                chat.id,
                payment.product.store.owner.id,
                paymentMessage
              );
              
              // Send product files and comment to buyer after successful payment
              if (payment.product.attachedFiles && payment.product.attachedFiles.length > 0) {
                const filesMessage = payment.product.attachedFiles.map(file => 
                  `📎 <a href="/files/products/${encodeURIComponent(file)}" download target="_blank">${file}</a>`
                ).join('\n');
                await this.chatService.createMessage(
                  chat.id,
                  payment.product.store.owner.id,
                  filesMessage
                );
              }
              
              if (payment.product.comment) {
                await this.chatService.createMessage(
                  chat.id,
                  payment.product.store.owner.id,
                  `💬 ${payment.product.comment}`
                );
              }
              
              console.log(`Created payment confirmation message in chat ${chat.id} in language ${lang}`);
            } catch (chatError) {
              console.error('Error creating chat or message after payment status check:', chatError);
            }
          }
          
          return { status: 'COMPLETED' };
        }
      }
      
      return { status: payment.status };
    } catch (error) {
      console.error('Error checking payment status:', error);
      return { error: 'Failed to check payment status' };
    }
  }

  @Get('balance')
  @UseGuards(AuthGuard, StoreOwnerGuard)
  async getBalance(@GetUser() user) {
    try {
      const userWithBalance = await this.prismaService.user.findUnique({
        where: { id: user.id },
        select: { balance: true }
      });
      
      return {
        success: true,
        balance: userWithBalance.balance
      };
    } catch (error) {
      console.error('Error getting balance:', error);
      return { success: false, error: 'Failed to get balance' };
    }
  }

  @Get('store-balance/:ownerId')
  async getStoreOwnerBalance(@Param('ownerId') ownerId: string) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { id: ownerId },
        select: { balance: true }
      });
      
      if (!user) {
        return { success: false, error: 'User not found' };
      }
      
      return {
        success: true,
        balance: user.balance
      };
    } catch (error) {
      console.error('Error getting store owner balance:', error);
      return { success: false, error: 'Failed to get balance' };
    }
  }

  @Get('test-complete-payment')
  async testCompletePayment(@Query('token') token: string, @Query('userId') userId: string, @Query('lang') lang: string = 'ru') {
    try {
      console.log('TEST: Completing payment for token:', token);
      
      const payment = await this.prismaService.payment.findFirst({
        where: { invoiceToken: token },
        include: {
          product: {
            include: {
              store: {
                include: {
                  owner: true
                }
              }
            }
          }
        }
      });

      if (!payment) {
        console.log('Payment not found for token:', token);
        return { error: 'Payment not found' };
      }

      console.log('Payment found:', payment);

      await this.prismaService.payment.update({
        where: { id: payment.id },
        data: { 
          status: 'COMPLETED',
          transactionId: 'test-' + Math.random().toString(36).substring(2, 15),
          transactionHash: 'test-hash-' + Date.now()
        },
      });
      
      await this.prismaService.user.update({
        where: { id: payment.product.store.owner.id },
        data: {
          balance: {
            increment: payment.amount
          }
        }
      });
      
      console.log(`TEST: Updated balance for store owner ${payment.product.store.owner.id} with amount ${payment.amount}`);
      
      if (userId) {
        try {
          const chat = await this.chatService.findOrCreateChat(
            userId,
            payment.product.store.owner.id,
            payment.product.id,
          );
          
          let paymentMessage = '';
          
          switch(lang as string) {
            case 'en':
              paymentMessage = `Payment for ${payment.product.name} was successfully completed. Amount: ${payment.amount} KZT`;
              break;
            case 'ru':
              paymentMessage = `Оплата за ${payment.product.name} успешно завершена. Сумма: ${payment.amount} KZT`;
              break;
            case 'kk':
              paymentMessage = `${payment.product.name} үшін төлем сәтті аяқталды. Сома: ${payment.amount} KZT`;
              break;
            default:
              paymentMessage = `Оплата за ${payment.product.name} успешно завершена. Сумма: ${payment.amount} KZT`;
          }
          
          await this.chatService.createMessage(
            chat.id,
            payment.product.store.owner.id,
            paymentMessage
          );
          
          // Send product files and comment to buyer after successful payment
          if (payment.product.attachedFiles && payment.product.attachedFiles.length > 0) {
            const filesMessage = payment.product.attachedFiles.map(file => 
              `📎 <a href="/files/products/${encodeURIComponent(file)}" download target="_blank">${file}</a>`
            ).join('\n');
            await this.chatService.createMessage(
              chat.id,
              payment.product.store.owner.id,
              filesMessage
            );
          }
          
          if (payment.product.comment) {
            await this.chatService.createMessage(
              chat.id,
              payment.product.store.owner.id,
              `💬 ${payment.product.comment}`
            );
          }
          
          console.log(`TEST: Created payment confirmation message in chat ${chat.id} in language ${lang}`);
        } catch (chatError) {
          console.error('Error creating chat or message after payment status check:', chatError);
        }
      }
      
      return { status: 'COMPLETED', message: 'TEST: Payment was marked as completed' };
    } catch (error) {
      console.error('Error in test completion of payment:', error);
      return { error: 'Failed to test complete payment' };
    }
  }

  @Get('purchased-products')
  async getPurchasedProducts(@Query('storeId') storeId?: string) {
    try {
      const whereCondition: any = {
        status: 'COMPLETED'
      };

      // If storeId is provided, filter by products from that store
      if (storeId) {
        whereCondition.product = {
          storeId: storeId
        };
      }

      const purchasedPayments = await this.prismaService.payment.findMany({
        where: whereCondition,
        select: {
          productId: true,
          createdAt: true
        },
        distinct: ['productId']
      });

      const purchasedProductIds = purchasedPayments.map(payment => payment.productId);

      return {
        success: true,
        purchasedProductIds
      };
    } catch (error) {
      console.error('Error getting purchased products:', error);
      return {
        success: false,
        error: 'Failed to get purchased products'
      };
    }
  }

  @Post('check-product-availability')
  async checkProductAvailability(@Body() body: { productId: string }) {
    try {
      const { productId } = body;

      const existingCompletedPayment = await this.prismaService.payment.findFirst({
        where: {
          productId,
          status: 'COMPLETED'
        }
      });

      if (existingCompletedPayment) {
        return {
          success: false,
          available: false,
          message: 'This product has already been purchased'
        };
      }

      return {
        success: true,
        available: true,
        message: 'Product is available for purchase'
      };
    } catch (error) {
      console.error('Error checking product availability:', error);
      return {
        success: false,
        available: false,
        error: 'Failed to check product availability'
      };
    }
  }
} 