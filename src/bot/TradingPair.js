import db from '../database';
import { _MARKET_DATA } from './Market';
import Strategy from './Strategy';

class TradingPair {
  constructor(tradingPair) {
    this.symbol = tradingPair.symbol;
    this.user = tradingPair.user;
    this.strategy = new Strategy({
      symbol: tradingPair.symbol,
      type: tradingPair.strategy,
      entryPoints: tradingPair.entryPoints,
      advanceSettings: tradingPair.advanceSettings,
      takeProfit: tradingPair.takeProfit,
      stopLoss: tradingPair.stopLoss,
      initialAmount: tradingPair.initialAmount,
    });
    this.isDCA = tradingPair.isDCA;
    this.isRunning = false;
    this.lastOrderTime;
    this.lastOrderPrice;
    this.exchange = tradingPair.exchange;
    this.orders = [];
    this.profit = 0;
  }

  setLastOrder() {
    this.lastOrderTime = Date.now();
  }

  async run() {
    // ------------------TEST----------------------
    if (!this.lastOrderTime) {
      this.lastOrderTime = _MARKET_DATA[this.symbol].lastTime;
    }
    // ------------------TEST----------------------
    const market = _MARKET_DATA[this.symbol];

    if (!this.strategy.min || market.lastTicker < this.strategy.min) {
      this.strategy.min = market.lastTicker;
    }
    // console.log(this.strategy.min, this.strategy.max);

    // console.log(
    //   this.lastOrderTime,
    //   market.getPriceFrom(this.lastOrderTime) &&
    //     market.getPriceFrom(this.lastOrderTime).length,
    //   market.lastTicker,
    //   this.strategy.min,
    //   ((market.lastTicker - this.strategy.min) / this.strategy.min) * 100,
    // );

    if (!this.isRunning) {
      await this.start();
    } else {
      this.strategy.setProfit(market);
      await this.dca();
      // console.log(this.strategy.profit);
      if (this.strategy.checkStop(market, this.lastOrderTime)) {
        await this.stop();
      }
    }
  }

  async start() {
    const market = _MARKET_DATA[this.symbol];

    const buyObj = this.strategy.checkEntry(market, this.lastOrderTime);
    if (buyObj) {
      this.strategy.max = market.lastTicker;
      await this.order(buyObj);
      // console.log('start');
      this.isRunning = true;
      this.orders.push(buyObj);
    }
  }

  async stop() {
    const market = _MARKET_DATA[this.symbol];
    const sellObj = {
      side: 'SELL',
      price: market.lastTicker,
      quantity: this.orders
        .map((order) => order.quantity)
        .reduce((s, v) => s + v),
    };
    this.setProfit(
      sellObj.quantity * sellObj.price -
        this.orders
          .map((order) => order.price * order.quantity)
          .reduce((s, v) => s + v),
    );
    await this.order(sellObj);
    // console.log('stop', this.profit);
    this.orders = [];
    this.strategy.reset();
    this.isRunning = false;
    await this.chargeFee(this.strategy.profit);
  }

  async dca() {
    if (this.isDCA) {
      const market = _MARKET_DATA[this.symbol];
      if (this.strategy.dcaPosition <= this.strategy.entryPoints.length - 1) {
        const buyObj = this.strategy.checkDCAEntry(market);
        if (buyObj) {
          this.orders.push(buyObj);
          await this.order(buyObj);
          // console.log('dcaEntry');
        }
      }
    }
  }

  async order(orderObj) {
    const order = {
      user: this.user,
      symbol: this.symbol,
      transactTime: Math.round(_MARKET_DATA[this.symbol].lastTime / 1000),
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
    // console.log(order);
    // const order = await this.exchange.postNewOrder(orderObj);
    // console.log(order);
    // this.setLastOrder(order);
    // const { symbol, price, origQty, status, side } = order;
    // await db('orders')
    //   .insert({
    //     user: this.user,
    //     symbol,
    //     transactTime: Math.round(_MARKET_DATA[this.symbol].lastTime / 1000),
    //     price,
    //     origQty,
    //     side,
    //     position: orderObj.position,
    //     updatedAt: new Date(),
    //   })
    //   .onConflict(['user', 'symbol', 'transactTime'])
    //   .merge();
  }

  setProfit(amount) {
    this.profit += amount;
  }

  async chargeFee(profit) {
    if (profit > 0) {
      await db('users')
        .where('email', this.user)
        .decrement('fuel', profit / 100);
    }
  }
}

export default TradingPair;
