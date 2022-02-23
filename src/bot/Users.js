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
    'api_key',
    'secret_key',
  ])
  .join('user_api_keys', function () {
    this.on('users.email', '=', 'user_api_keys.user').on(
      'users.active_exchange',
      '=',
      'user_api_keys.exchange',
    );
  })
  .fullOuterJoin('user_strategies', 'users.email', 'user_strategies.user');

class Users {
  constructor() {
    this.initActiveUsers().then();
  }

  async initActiveUsers() {
    const tradingPairs = await userTraingPairsQuery
      .clearWhere()
      .where('isActive', true);
    await Promise.all(
      Object.values(byUser(tradingPairs)).map(async (tradingPair) => {
        this[tradingPair[0].user] = new User(tradingPair);
        await this[tradingPair[0].user].init();
      }),
    );
  }

  async addOneUser(strategy) {
    const tradingPair = await userTraingPairsQuery
      .clearWhere()
      .where('email', strategy.user);

    this[strategy.user] = new User([{ ...tradingPair[0], ...strategy }]);
    // await this[strategy.user].init();
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
    console.log(
      Object.values(this)
        .map((user) => user.listenKey)
        .filter((user) => user),
    );
    return Object.values(this)
      .map((user) => user.listenKey)
      .filter((user) => user);
  }
}

export const _USERS_DATA = new Users();
export default Users;
