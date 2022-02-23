import Binance from '../apis/Binance';
import db from '../database/index';
import { _MARKET_DATA } from './Market/Market';
import TradingPair from './TradingPair';

class User {
  constructor(tradingPairs) {
    const { user, role, symbol, api_key, secret_key } = tradingPairs[0];
    this.user = user;
    this.role = role;
    this.symbol = symbol;
    this.tradingPairs = [];
    this.permissions = {};
    if (this.symbol) {
      tradingPairs.forEach((tradingPair) => this.addTradingPair(tradingPair));
    }
    if (api_key && secret_key) {
      this.exchange = new Binance({
        apiKey: api_key,
        secret: secret_key,
      });
    }
  }

  async init() {
    if (this.exchange) {
      await this.getAccountInfo();
    }
  }

  async checkAPIPermission() {
    this.permissions = await this.exchange.getAPIKeyPermission();
  }

  async getAccountInfo() {
    try {
      await this.checkAPIPermission();
      const accountInfo = await this.exchange.getAccountInfo();
      const listenKey = await this.exchange.createUserStreamListenKey();
      if (listenKey) {
        this.listenKey = listenKey;
        this.makerCommission = accountInfo.makerCommission;
        this.takerCommission = accountInfo.takerCommission;
        this.balances = {};
        accountInfo.balances.forEach((balance) => {
          this.balances[balance.asset] = balance;
        });
      }
    } catch (err) {
      console.log('user', err);
    }
  }

  addTradingPair(strategy) {
    this.tradingPairs.push(
      new TradingPair({
        ...strategy,
        user: this.user,
        exchange: this.exchange,
      }),
    );
  }

  removeTradingPair(strategy) {
    const index = this.tradingPairs.findIndex(
      ({ symbol }) => symbol === strategy.symbol,
    );
    this.tradingPairs.splice(index, 1);
  }

  async order(orderObj) {
    console.log(orderObj);
    const order = {
      user: this.user,
      symbol: orderObj.symbol,
      transactTime: orderObj.transactTime,
      price: orderObj.price,
      origQty: orderObj.quantity,
      side: orderObj.side,
      position: orderObj.position,
      updatedAt: new Date(),
    };
    await db('orders')
      .insert(order)
      .onConflict(['user', 'symbol', 'transactTime'])
      .merge();
    orderObj.type = 'LIMIT';
    delete orderObj.user;
    delete orderObj.transactTime;
    delete orderObj.position;
  }

  async chargeFee(fee) {
    await db('users').where('email', this.user).decrement('fuel', fee);
  }
}

export default User;
