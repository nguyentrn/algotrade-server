import { Injectable } from '@nestjs/common';
import { _USERS_DATA } from '../../bot/Users';
import User from '../../bot/User';
import db from '../../database/index';

const formatBalances = async (orginalBalances) => {
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

const getApiKey = async (email) => {
  const apikey = await db('user_api_keys')
    .select(['user', 'api_key', 'secret_key'])
    .where('user', email)
    .first();
  return apikey;
};

@Injectable()
export class AccountService {
  async getAccount(email) {
    try {
      if (_USERS_DATA[email]) {
        const balances = await formatBalances(_USERS_DATA[email].balances);
        await _USERS_DATA[email].setAPIPermission();
        const permissions = _USERS_DATA[email].permissions;
        return { balances, permissions };
      }
    } catch (err) {
      return false;
    }
  }

  async updateToken(data) {
    try {
      const user = new User([data]);
      await user.checkAPIPermission();
      if (user?.permissions?.enableReading) {
        data.updated_at = new Date();
        await db('user_api_keys')
          .insert(data)
          .onConflict(['user', 'exchange'])
          .merge();
        return true;
      }
    } catch (err) {
      return false;
    }
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
