import { Injectable } from '@nestjs/common';
import { _USERS_DATA } from '../../bot/Users';
import User from '../../bot/User';
import db from '../../database/index';

const getBalances = async (orginalBalances) => {
  const balances = { ...orginalBalances };
  const balanceKeys = Object.keys(balances);

  const coins = await db('coins')
    .select(['id', 'symbol', 'name', 'color'])
    .whereIn('symbol', balanceKeys);
  coins.forEach((coin) => {
    balances[coin.symbol].id = coin.id;
    balances[coin.symbol].name = coin.name;
    balances[coin.symbol].color = coin.color;
  });
  return balances;
};
@Injectable()
export class AccountService {
  async checkApiKey(email) {
    if (_USERS_DATA[email]) {
      return _USERS_DATA[email].isOkay;
    }
    const apikey = await db('users')
      .select(['email AS user', 'binance_api_key', 'binance_secret_key'])
      .where('email', email)
      .first();
    const user = new User([apikey]);
    await user.getAccountInfo();
    return user.isOkay;
  }

  async getBalances(email) {
    if (_USERS_DATA[email]) {
      const balances = await getBalances(_USERS_DATA[email].balances);
      return balances;
    }
    const apikey = await db('users')
      .select(['email AS user', 'binance_api_key', 'binance_secret_key'])
      .where('email', email)
      .first();
    const user = new User([apikey]);
    await user.getAccountInfo();
    const balances = await getBalances(user.balances);
    return balances;
  }

  async getOrders(user) {
    const orders = await db('orders')
      .select(['symbol', 'transactTime', 'price', 'origQty', 'side'])
      .where('user', user);
    const res = {};
    orders.forEach((order) => {
      if (!res[order.symbol]) {
        res[order.symbol] = [];
      }
      res[order.symbol].push(order);
    });
    return res;
  }
}
