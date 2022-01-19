import Binance from '../apis/Binance';
import TradingPair from './TradingPair';

class User {
  constructor(tradingPairs) {
    const { user, role, symbol, binance_api_key, binance_secret_key } =
      tradingPairs[0];
    this.user = user;
    this.role = role;
    this.symbol = symbol;
    this.tradingPairs = [];
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
      this.listenKey = listenKey;
      this.canTrade = accountInfo.canTrade;
      this.makerCommission = accountInfo.makerCommission;
      this.takerCommission = accountInfo.takerCommission;
      this.balances = {};
      accountInfo.balances.forEach((balance) => {
        this.balances[balance.asset] = balance;
      });
    } catch (err) {
      console.log();
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
}

export default User;
