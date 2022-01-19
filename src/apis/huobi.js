const HUOBI_HOSTNAME = 'https://api.huobi.pro';

const huobiAPIs = {
  symbols: { url: `${HUOBI_HOSTNAME}/v1/common/symbols`, method: 'get' },
  kline: {
    url: `${HUOBI_HOSTNAME}/market/history/kline`,
    method: 'get',
    params: {
      symbol: undefined,
      period: undefined,
      size: undefined,
    },
  },
};

export default huobiAPIs;
