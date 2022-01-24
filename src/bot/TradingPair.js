import SimpleStrategy from './Strategy/SimpleStrategy';

const setStrategyByType = (tradingPair) => {
  switch (tradingPair.strategy) {
    case 'simple-dca': {
      return new SimpleStrategy({
        symbol: tradingPair.symbol,
        entryPoints: tradingPair.entryPoints,
        advanceSettings: tradingPair.advanceSettings,
        takeProfit: tradingPair.takeProfit,
        stopLoss: tradingPair.stopLoss,
        initialAmount: tradingPair.initialAmount,
      });
    }

    default: {
      return null;
    }
  }
};

class TradingPair {
  constructor(tradingPair) {
    this.symbol = tradingPair.symbol;
    this.strategy = setStrategyByType(tradingPair);
    this.isDCA = tradingPair.isDCA;
    this.isRunning = false;
    this.lastOrderTime;
    this.lastOrderPrice;
    this.orders = [];
    this.profit = 0;
    this.totalProfit = 0;
  }

  setMin(market) {
    if (!this.strategy.min || market.lastTicker < this.strategy.min) {
      this.strategy.min = market.lastTicker;
    }
  }

  reset() {
    this.orders = [];
    this.strategy.reset();
    this.isRunning = false;
    this.profit = undefined;
  }

  // ------------- ENTRY -------------
  run(market) {
    // set minimum price in a period
    this.setMin(market);
    if (!this.isRunning) {
      // find start entry if not running
      return this.start(market);
    }
    // if running, set profit, stop or dca
    this.strategy.setProfit(market);
    if (this.strategy.checkStop(market)) {
      // console.log(this.strategy);
      return this.stop(market);
    }
    if (this.isDCA) {
      return this.dca(market);
    }
  }

  start(market) {
    const buyObj = this.strategy.checkFirstEntry(market, this.lastOrderTime);
    if (buyObj) {
      this.strategy.max = market.lastTicker;
      this.isRunning = true;
      this.orders.push(buyObj);
      return buyObj;
    }
  }

  stop(market) {
    const sellObj = {
      symbol: this.symbol,
      side: 'SELL',
      transactTime: Math.round(market.lastTime / 1000),
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
    this.reset();
    return sellObj;
  }

  dca(market) {
    if (this.strategy.dcaPosition < this.strategy.entryPoints.length) {
      const dcaObj = this.strategy.checkDCAEntry(market);
      if (dcaObj) {
        this.orders.push(dcaObj);
        return dcaObj;
      }
    }
  }

  setProfit(amount) {
    this.profit = amount;
    this.totalProfit += amount;
  }

  getFee() {
    if (this.profit > 0) {
      return this.profit * 0.1;
    }
  }
}

export default TradingPair;
