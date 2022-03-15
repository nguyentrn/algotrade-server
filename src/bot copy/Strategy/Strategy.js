class Strategy {
  constructor(tradingPair) {
    this.symbol = tradingPair.symbol;
    this.initialAmount = tradingPair.initialAmount;
    this.takeProfit = tradingPair.takeProfit;
    this.stopLoss = tradingPair.stopLoss;
    this.advanceSettings = tradingPair.advanceSettings;
    // this.advanceSettings.callbackForMarginCall = 0.01;
    this.entryPoints = tradingPair.entryPoints;
    this.dcaPosition = -1;
  }

  reset() {
    this.dcaPosition = -1;
    this.max = 0;
  }

  setProfit(tradingPair) {
    this.profit =
      ((tradingPair.lastTicker - this.lastOrderPrice) / this.lastOrderPrice) *
      100;
    this.avgDCAProfit =
      ((tradingPair.lastTicker - this.avgDCAPrice) / this.avgDCAPrice) * 100;
  }

  checkDCAEntry(tradingPair) {
    const dcaPos = this.entryPoints[this.dcaPosition].position;
    if (
      this.dcaPosition >= 0 &&
      ((dcaPos < 0 && this.profit <= dcaPos) ||
        (dcaPos > 0 && this.profit >= dcaPos))
    ) {
      const orderObj = this.createBuyOrderObject(tradingPair);
      this.dcaPosition++;
      return orderObj;
    }
  }

  checkTakeProfit() {
    return this.avgDCAProfit >= this.takeProfit;
  }

  checkStopLoss() {
    return this.avgDCAProfit <= this.stopLoss;
  }

  createDefaultOrderObject(tradingPair, side) {
    return {
      symbol: this.symbol,
      transactTime: Math.round(tradingPair.lastTime / 1000),
      price: tradingPair.lastTicker,
      side,
    };
  }

  createBuyOrderObject(tradingPair) {
    const initialPrice = this.initialAmount / tradingPair.lastTicker;
    const dca = this.entryPoints[this.dcaPosition];
    const quantity = dca ? initialPrice * dca.multiples : initialPrice;
    if (!dca) {
      this.avgDCAPrice = tradingPair.lastTicker;
    } else {
      const entryMultiples = this.entryPoints
        .filter((_, id) => id < this.dcaPosition)
        .map((pos) => pos.multiples);
      const oldMultiples =
        1 +
        (entryMultiples.length ? entryMultiples.reduce((s, v) => s + v) : 0);
      this.avgDCAPrice =
        (this.avgDCAPrice * oldMultiples +
          tradingPair.lastTicker * dca.multiples) /
        (oldMultiples + dca.multiples);
    }
    return {
      ...this.createDefaultOrderObject(tradingPair, 'BUY'),
      quantity: quantity.toFixed(8) * 1,
      position: this.dcaPosition + 2,
    };
  }

  createSellOrderObject(tradingPair, orders) {
    // console.log(this.avgDCAPrice, this.profit, this.avgDCAProfit);
    return {
      ...this.createDefaultOrderObject(tradingPair, 'SELL'),
      quantity: orders.map((order) => order.quantity).reduce((s, v) => s + v),
    };
  }
}

export default Strategy;
