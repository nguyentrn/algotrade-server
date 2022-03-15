import { groupBy } from 'ramda';

import db from '../database/index';
import User from './User';
import global from '../global';

const byUser = groupBy((tradingPairs) => tradingPairs.user);
const usersQuery = db('users')
  .select(['email', 'role', 'api_key', 'secret_key'])
  .join('user_api_keys', function () {
    this.on('users.email', '=', 'user_api_keys.user').on(
      'users.active_exchange',
      '=',
      'user_api_keys.exchange',
    );
  });

class Users {
  async initUsers() {
    const users = await usersQuery
      .clearWhere()
      .where('email', 'nguyentran0113@gmail.com');

    await Promise.all(
      users.map(async (user) => {
        await this.addOneUser(user);
      }),
    );
    global.isUsersLoaded = true;
  }

  async addOneUser(user) {
    if (user.api_key && user.secret_key) {
      this[user.email] = new User(user);
      await this[user.email].init();
      if (!this[user.email].listenKey) {
        this.removeOneUser(user.email);
      }
    }
  }

  removeOneUser(email) {
    delete this[email];
  }

  getAllListenKeys() {
    return Object.values(this)
      .map((user) => user.listenKey)
      .filter((user) => user);
  }
}

export const _USERS_DATA = new Users();
(async () => {
  await _USERS_DATA.initUsers();
})();

export default Users;
