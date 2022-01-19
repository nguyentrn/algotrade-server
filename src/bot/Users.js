import { groupBy } from 'ramda';

import db from '../database/index';
import User from './User';

const byUser = groupBy((tradingPairs) => tradingPairs.user);
const userTraingPairsQuery = db('users')
  .select([
    'email as user',
    'symbol',
    'initialAmount',
    'takeProfit',
    'stopLoss',
    'isDCA',
    'entryPoints',
    'strategy',
    'advanceSettings',
    'role',
    'binance_api_key',
    'binance_secret_key',
  ])
  .fullOuterJoin('user_strategies', 'users.email', 'user_strategies.user');

class Users {
  constructor() {
    this.initActiveUsers().then();
  }

  async initActiveUsers() {
    const tradingPairs = await userTraingPairsQuery
      .clearWhere()
      .where('isActive', true);

    Object.values(byUser(tradingPairs)).forEach((tradingPair) => {
      this[tradingPair[0].user] = new User(tradingPair);
    });
  }

  async addOneUser(strategy) {
    const tradingPair = await userTraingPairsQuery
      .clearWhere()
      .where('email', strategy.user);
    this[strategy.user] = new User([{ ...tradingPair[0], ...strategy }]);
  }

  removeOneUser(strategy) {
    delete this[strategy.user];
  }

  async updateUserStrategy(strategy) {
    // add trading pair if user existed
    if (this[strategy.user]) {
      if (strategy.isActive) {
        this[strategy.user].addTradingPair(strategy);
      } else {
        this[strategy.user].removeTradingPair(strategy);
      }
      // delete user if no trading pairs left
      if (!this[strategy.user].tradingPairs.length) {
        this.removeOneUser(strategy);
      }
      // create one user if not
    } else if (strategy.isActive) {
      await this.addOneUser(strategy);
    }
  }

  getAllListenKeys() {
    return Object.values(this).map((user) => user.listenKey);
  }
}

export const _USERS_DATA = new Users();
export default Users;
