import Binance from '../apis/Binance';
import db from '../database/index';
import { _MARKET_DATA } from './Market/Market';
import TradingPair from './TradingPair';

class User {
  constructor(user) {
    const { email, role, exchange, api_key, secret_key } = user;
    this.email = email;
    this.role = role;
    this.tradingPairs = [];
    this.balances = {};
    this.active_exchange = exchange;
    this.exchange = new Binance({
      apiKey: api_key,
      secret: secret_key,
    });
  }

  async init() {
    await this.setAPIPermission();
    if (this.permissions) {
      const [listenKey, accountInfo, strategies] = await Promise.all([
        this.exchange.createUserStreamListenKey(),
        this.exchange.getAccountInfo(),
        this.getStrategies(),
      ]);
      // console.log(strategies);
      strategies.forEach((strategy) => this.addTradingPair(strategy));
      this.listenKey = listenKey;
      accountInfo.balances.forEach((balance) => {
        if (balance.free * 1 || balance.locked * 1) {
          this.balances[balance.asset] = {
            asset: balance.asset,
            free: balance.free * 1,
            locked: balance.locked * 1,
          };
        }
      });
    }
  }

  async setAPIPermission() {
    this.permissions = await this.exchange.getAPIKeyPermission();
    if (!this.permissions) {
      await this.removeApiKey();
    }
  }

  async removeApiKey() {
    await db('user_api_keys')
      .where('user', this.email)
      .where('exchange', this.active_exchange)
      .update({ api_key: null, secret_key: null });
  }

  async getStrategies() {
    return await db('user_strategies')
      .select('*')
      .where('user', this.email)
      .where('isActive', true);
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
    if (fee > 0) {
      await db('users').where('email', this.user).decrement('fuel', fee);
    }
  }
}

export default User;
