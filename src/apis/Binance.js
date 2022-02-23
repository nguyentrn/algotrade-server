import axios from 'axios';
import crypto from 'crypto';

// rt6Wfz7k1kRGmQtPkhN1VRQ1acYGg9mtPiNibuErdYzumepdAJdIkpZHJOq96Yi8
// PzB7AWu0X7Qrn6WZ0XdZV8eEYwMMRqytZOU8cqJGRcifCMVMPGe4YReQYDOUvb0Y

const apis = {
  // USER_DATA
  tradeFee: {
    method: 'get',
    pathname: '/sapi/v1/asset/tradeFee',
    securityType: 'USER_DATA',
    weight: 1,
  },
  fundingWallet: {
    method: 'post',
    pathname: '/sapi/v1/asset/get-funding-asset',
    securityType: 'USER_DATA',
    weight: 1,
  },
  apiPermission: {
    method: 'get',
    pathname: '/sapi/v1/account/apiRestrictions',
    securityType: 'USER_DATA',
    weight: 1,
  },

  account: {
    method: 'get',
    pathname: '/api/v3/account',
    securityType: 'USER_DATA',
    weight: 10,
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
    weight: 1,
  },
};

const roundToPrecision = (num, precision) => {
  return +(Math.round(num + `e+${precision}`) + `e-${precision}`);
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
      console.log({
        api: api.pathname,
        weight:
          res.headers[
            api.pathname.match(/^\/sapi/gi)
              ? 'x-sapi-used-ip-weight-1m'
              : 'x-mbx-used-weight-1m'
          ] * 1,
      });
      return res.data;
    } catch (err) {
      console.log(err.response.data);
    }
  }

  async getFundingWallet() {
    const wallet = await this.fetchData(apis.fundingWallet, {
      timestamp: Date.now(),
      needBtcValuation: false,
    });
    const assets = {};
    wallet.forEach(({ asset, free, locked }) => {
      assets[asset] = { asset, free, locked };
    });
    return assets;
  }
  async getTradeFee() {
    return await this.fetchData(apis.tradeFee, {
      timestamp: Date.now(),
    });
  }
  async getAPIKeyPermission() {
    return await this.fetchData(apis.apiPermission, {
      timestamp: Date.now(),
    });
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
    const listenKey = await this.fetchData(apis.createListenKey);
    if (listenKey) {
      return apis.createListenKey.format(listenKey);
    }
  }
}

export default Binance;
