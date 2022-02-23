let coins;

(async () => {
  coins = await db('coins')
    .select(['id', 'symbol', 'name', 'color'])
    .whereIn('symbol', balanceKeys);
})();

export default coins;
