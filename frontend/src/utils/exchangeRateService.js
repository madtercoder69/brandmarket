import axiosInstance from './axiosInstance';

// Кэш для данных
let cachedRate = null;
let cachedCurrencies = [];
let lastUpdateTime = 0;

/**
 * Сервис для работы с обменными курсами и минимальными суммами
 */
const ExchangeRateService = {
  /**
   * Получает текущий курс обмена KZT/USD и минимальные суммы для всех валют
   * @param {string} [currencyCode] - Код валюты (опционально)
   * @returns {Promise<Object>} Объект с информацией о курсе и минимальных суммах
   */
  async getMinAmount(currencyCode) {
    try {
      const now = Date.now();
      
      // Проверяем, нужно ли обновить данные (обновление раз в час)
      if (cachedCurrencies.length > 0 && (now - lastUpdateTime < 3600000)) {
        // Если запрошена конкретная валюта, возвращаем только её данные
        if (currencyCode) {
          const currencyInfo = cachedCurrencies.find(c => c.code === currencyCode);
          if (currencyInfo) {
            return {
              currency: currencyInfo.code,
              name: currencyInfo.name,
              minAmount: currencyInfo.minAmount,
              minAmountKZT: currencyInfo.minAmountKZT,
              rate: cachedRate,
              success: true,
              cached: true
            };
          }
        }
        
        return {
          currencies: cachedCurrencies,
          rate: cachedRate,
          success: true,
          cached: true
        };
      }

      // Получаем свежие данные с сервера
      const endpoint = currencyCode 
        ? `/payment/min-amount?currency=${currencyCode}` 
        : '/payment/min-amount';
        
      const response = await axiosInstance.get(endpoint);
      
      if (response.data && response.data.success) {
        // Обновляем кэшированные значения
        if (response.data.currencies) {
          cachedCurrencies = response.data.currencies;
          
          // Если есть поле rate, обновляем и его
          if (response.data.rate) {
            cachedRate = response.data.rate;
          }
          
          lastUpdateTime = now;
          
          return {
            currencies: cachedCurrencies,
            rate: cachedRate,
            success: true
          };
        } else if (response.data.currency) {
          // Если вернулась информация о конкретной валюте
          const currencyInfo = {
            code: response.data.currency,
            name: response.data.name,
            minAmount: response.data.minAmount,
            minAmountKZT: response.data.minAmountKZT
          };
          
          // Обновляем данные в кэше
          const existingIndex = cachedCurrencies.findIndex(c => c.code === currencyInfo.code);
          if (existingIndex >= 0) {
            cachedCurrencies[existingIndex] = currencyInfo;
          } else {
            cachedCurrencies.push(currencyInfo);
          }
          
          // Обновляем курс
          if (response.data.rate) {
            cachedRate = response.data.rate;
          }
          
          lastUpdateTime = now;
          
          return {
            currency: currencyInfo.code,
            name: currencyInfo.name,
            minAmount: currencyInfo.minAmount,
            minAmountKZT: currencyInfo.minAmountKZT,
            rate: cachedRate,
            success: true
          };
        }
      }
      
      // В случае ошибки используем кэшированные значения
      if (currencyCode && cachedCurrencies.length > 0) {
        const currencyInfo = cachedCurrencies.find(c => c.code === currencyCode);
        if (currencyInfo) {
          return {
            currency: currencyInfo.code,
            name: currencyInfo.name,
            minAmount: currencyInfo.minAmount,
            minAmountKZT: currencyInfo.minAmountKZT,
            rate: cachedRate,
            success: false,
            error: response.data?.error || 'Failed to get minimum amount'
          };
        }
      }
      
      // Используем кэшированные или дефолтные значения
      return {
        currencies: cachedCurrencies.length > 0 ? cachedCurrencies : [
          { code: 'USDTTRC', name: 'Tether TRC-20', minAmount: 1, minAmountKZT: 450 }
        ],
        rate: cachedRate || 0.00222,
        success: false,
        error: response.data?.error || 'Failed to get minimum amount'
      };
    } catch (error) {
      console.error('Error fetching minimum amount:', error);
      
      // В случае ошибки используем кэшированные значения
      if (currencyCode && cachedCurrencies.length > 0) {
        const currencyInfo = cachedCurrencies.find(c => c.code === currencyCode);
        if (currencyInfo) {
          return {
            currency: currencyInfo.code,
            name: currencyInfo.name,
            minAmount: currencyInfo.minAmount,
            minAmountKZT: currencyInfo.minAmountKZT,
            rate: cachedRate,
            success: false,
            error: error.message
          };
        }
      }
      
      return {
        currencies: cachedCurrencies.length > 0 ? cachedCurrencies : [
          { code: 'USDTTRC', name: 'Tether TRC-20', minAmount: 1, minAmountKZT: 450 }
        ],
        rate: cachedRate || 0.00222,
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Получает текущий курс обмена KZT на USD
   * @returns {number} Курс обмена (1 KZT = X USD)
   */
  getRate() {
    return cachedRate || 0.00222;
  },

  /**
   * Получает минимальную сумму платежа в KZT для указанной валюты
   * @param {string} currencyCode - Код валюты
   * @returns {number} Минимальная сумма в KZT
   */
  getMinAmountKZT(currencyCode = 'USDTTRC') {
    const currency = cachedCurrencies.find(c => c.code === currencyCode);
    return currency ? currency.minAmountKZT : 450;
  },

  /**
   * Получает минимальную сумму платежа в криптовалюте
   * @param {string} currencyCode - Код валюты
   * @returns {number} Минимальная сумма в указанной валюте
   */
  getMinAmount(currencyCode = 'USDTTRC') {
    const currency = cachedCurrencies.find(c => c.code === currencyCode);
    return currency ? currency.minAmount : 1;
  },

  /**
   * Конвертирует сумму из KZT в USD
   * @param {number} amountKZT - Сумма в KZT
   * @param {number} [customRate] - Опциональный курс обмена (1 KZT = X USD)
   * @returns {number} Сумма в USD
   */
  convertKZTtoUSD(amountKZT, customRate) {
    const rate = customRate || this.getRate();
    return amountKZT * rate;
  },

  /**
   * Конвертирует сумму из USD в KZT
   * @param {number} amountUSD - Сумма в USD
   * @param {number} [customRate] - Опциональный курс обмена (1 KZT = X USD)
   * @returns {number} Сумма в KZT
   */
  convertUSDtoKZT(amountUSD, customRate) {
    const rate = customRate || this.getRate();
    return Math.ceil(amountUSD / rate);
  },

  /**
   * Форматирует сообщение об ошибке минимальной суммы с использованием i18n
   * @param {Object} errorDetails - Детали ошибки (валюта, минимальная сумма)
   * @param {Function} t - Функция перевода i18n
   * @returns {string} Отформатированное сообщение об ошибке
   */
  formatMinAmountErrorMessage(errorDetails, t) {
    if (!errorDetails || !t) return t('minAmountError');
    
    const { currency, minAmount, minAmountKZT } = errorDetails;
    
    try {
      // Используем простой текст без форматирования
      const currencyMessage = t('currencyMinAmountError') + `: ${currency} ${minAmount}`;
      
      // Добавляем информацию о сумме в тенге
      const kztMessage = t('currencyMinAmountKZT') + `: ${minAmountKZT} KZT`;
      
      return `${currencyMessage}. ${kztMessage}`;
    } catch (error) {
      console.error('Error formatting min amount error message:', error);
      return t('minAmountError'); // Запасное сообщение
    }
  }
};

export default ExchangeRateService; 