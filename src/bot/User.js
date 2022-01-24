import Binance from '../apis/Binance';
import db from '../database/index';
import { _MARKET_DATA } from './Market/Market';
import TradingPair from './TradingPair';

class User {
  constructor(tradingPairs) {
    const { user, role, symbol, binance_api_key, binance_secret_key } =
      tradingPairs[0];
    this.user = user;
    this.role = role;
    this.symbol = symbol;
    this.tradingPairs = [];
    this.isOkay = false;
    if (binance_api_key && binance_secret_key) {
      this.exchange = new Binance({
        apiKey: binance_api_key,
        secret: binance_secret_key,
      });
      this.getAccountInfo().then();
      if (this.symbol) {
        tradingPairs.forEach((tradingPair) => this.addTradingPair(tradingPair));
      }
    }
  }

  async getAccountInfo() {
    try {
      const accountInfo = await this.exchange.getAccountInfo();
      const listenKey = await this.exchange.createUserStreamListenKey();
      if (listenKey) {
        this.isOkay = true;
        this.listenKey = listenKey;
      }
      this.canTrade = accountInfo.canTrade;
      this.makerCommission = accountInfo.makerCommission;
      this.takerCommission = accountInfo.takerCommission;
      this.balances = {};
      accountInfo.balances.forEach((balance) => {
        this.balances[balance.asset] = balance;
      });
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

    // const order = await this.exchange.postNewOrder(orderObj);
    // console.log(order);
    // const { symbol, price, origQty, side } = order;
    // await db('orders')
    //   .insert({
    //     user: this.user,
    //     symbol,
    //     transactTime: Math.round(market.lastTime / 1000),
    //     price,
    //     origQty,
    //     side,
    //     position: orderObj.position,
    //     updatedAt: new Date(),
    //   })
    //   .onConflict(['user', 'symbol', 'transactTime'])
    //   .merge();
  }

  async chargeFee(fee) {
    await db('users').where('email', this.user).decrement('fuel', fee);
  }
}

export default User;
