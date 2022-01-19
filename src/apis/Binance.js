import axios from 'axios';
import crypto from 'crypto';

const roundToPrecision = (num, precision) => {
  return +(Math.round(num + `e+${precision}`) + `e-${precision}`);
};

const apis = {
  // exchangeInfo: {
  //   method: 'get',
  //   pathname: '/api/v3/exchangeInfo',
  // },
  // allOrders: {
  //   method: 'get',
  //   pathname: '/api/v3/account',
  // },
  // historicalTrades: {
  //   method: 'get',
  //   pathname: '/api/v3/historicalTrades',
  // },

  // // MARKET_DATA
  // bookTicker: {
  //   method: 'get',
  //   pathname: '/api/v3/ticker/bookTicker',
  //   securityType: 'NONE',
  //   format: (data) =>
  //     data
  //       .map(({ symbol }) => ({
  //         base: symbol.slice(0, 3),
  //         quote: symbol.replace(symbol.slice(0, 3), ''),
  //       }))
  //       .filter(({ quote }) => quote === 'USDT'),
  // },
  // klines: {
  //   method: 'get',
  //   pathname: '/api/v3/klines',
  //   securityType: 'MARKET_DATA',
  //   format: (data) =>
  //     data.map((ohlcv) => ({
  //       time: new Date(ohlcv[0]),
  //       open: ohlcv[1],
  //       high: ohlcv[2],
  //       low: ohlcv[3],
  //       close: ohlcv[4],
  //       volume: ohlcv[5],
  //       trades: ohlcv[8],
  //       taker_volume: ohlcv[9],
  //     })),
  // },

  // USER_DATA
  account: {
    method: 'get',
    pathname: '/api/v3/account',
    securityType: 'USER_DATA',
  },

  // TRADE
  order: {
    method: 'post',
    pathname: '/api/v3/order',
    securityType: 'TRADE',
  },
  candleOrder: {
    method: 'delete',
    pathname: '/api/v3/openOrders',
    securityType: 'TRADE',
  },

  // USER_STREAM
  createListenKey: {
    method: 'post',
    pathname: '/api/v3/userDataStream',
    securityType: 'USER_STREAM',
    format: (data) => data.listenKey,
  },
};

const getSignature = (apiSecret, queryString) => {
  return crypto
    .createHmac('sha256', apiSecret)
    .update(queryString)
    .digest('hex');
};

const getSecurityLevel = (securityType) => {
  if (['USER_DATA', 'TRADE'].includes(securityType)) {
    return 2;
  }
  if (['MARKET_DATA', 'USER_STREAM'].includes(securityType)) {
    return 1;
  }
  return 0;
};

const getConfig = (apiKey) => {
  return { headers: { 'X-MBX-APIKEY': apiKey } };
};

const getQueryString = (secret, securityType, data) => {
  const securityLevel = getSecurityLevel(securityType);
  const params = data
    ? Object.entries(data)
        .map(([key, val]) => `${key}=${val}`)
        .join('&')
    : '';

  return `${params}${
    securityLevel < 2 ? '' : `&signature=${getSignature(secret, params)}`
  }`;
};

class Binance {
  constructor(key) {
    if (key) {
      this.apiKey = key.apiKey;
      this.secret = key.secret;
    }
    if (process.env.NETWORK === 'testnet') {
      this.hostname = 'https://testnet.binance.vision';
    } else {
      this.hostname = 'https://api.binance.com';
    }
  }

  async fetchData(api, data) {
    try {
      const { method, pathname, securityType } = api;
      const queryString = getQueryString(this.secret, securityType, data);
      const res = await axios({
        method,
        url: `${this.hostname}${pathname}?${queryString}`,
        headers: getConfig(this.apiKey).headers,
      });
      return res.data;
    } catch (err) {
      console.log(err.response.data);
    }
  }

  // async getBookTickers() {
  //   return apis.bookTicker.format(await this.fetchData(apis.bookTicker));
  // }

  async getOHLCVs(symbol = 'BTCUSDT', interval = '1m', limit = 100, startTime) {
    return apis.klines.format(
      await this.fetchData(apis.klines, {
        symbol,
        interval,
        limit,
        startTime,
      }),
    );
  }

  async getAccountInfo() {
    return await this.fetchData(apis.account, {
      timestamp: Date.now(),
    });
  }

  async postNewOrder({ symbol = 'BTCUSDT', side = 'BUY', quantity, price }) {
    return await this.fetchData(apis.order, {
      symbol,
      side,
      type: 'LIMIT',
      timeInForce: 'GTC',
      quantity: roundToPrecision(quantity, 6),
      price,
      timestamp: Date.now(),
    });
  }

  async cancelOrders() {
    return await this.fetchData(apis.candleOrder, {
      symbol: 'BTCUSDT',
      timestamp: Date.now(),
    });
  }

  async createUserStreamListenKey() {
    return apis.createListenKey.format(
      await this.fetchData(apis.createListenKey),
    );
  }
}

export default Binance;
