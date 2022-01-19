import WebSocket from 'ws';
import { _MARKET_DATA } from './Market';
import { _USERS_DATA } from './Users';

let endpoint;
if (process.env.NETWORK === 'testnet') {
  endpoint = 'wss://testnet.binance.vision/stream';
} else {
  endpoint = `wss://stream.binance.com:9443/stream`;
}

const DEFAULT_STREAMS = ['!miniTicker@arr'];
// const DEFAULT_STREAMS = [];

class Socket {
  constructor() {
    this.ws = this.connectSocket();
  }

  connectSocket() {
    const ws = new WebSocket(endpoint);
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          method: 'SUBSCRIBE',
          params: [...DEFAULT_STREAMS, ..._USERS_DATA.getAllListenKeys()],
          id: 1,
        }),
      );
    };

    ws.onmessage = function (e) {
      const response = JSON.parse(e.data);
      if (response) {
        const { stream, data } = response;
        if (data) {
          if (stream === '!miniTicker@arr') {
            data.forEach((pair) => {
              _MARKET_DATA.setTicker(pair);
            });
          } else {
            if (data.e === 'outboundAccountPosition') {
              const user = Object.values(_USERS_DATA).find(
                (user) => user.listenKey === stream,
              );
              data.B.forEach(({ a: asset, f: free, l: locked }) => {
                user.balances[asset] = { asset, free, locked };
              });
              console.log(user.balances);
            }
          }
        }
      }
    };

    ws.onclose = (e) => {
      console.log(
        'Socket is closed. Reconnect will be attempted in 1 second.',
        e.reason,
      );
      setTimeout(() => {
        this.ws = this.connectSocket();
      }, 1000);
    };

    ws.onerror = (err) => {
      console.error(
        'Socket encountered error: ',
        err.message,
        'Closing socket',
      );
      ws.close();
    };

    return ws;
  }
}

const socket = new Socket();

// Reconnect socket every 30 minutes
setInterval(() => {
  socket.ws.close();
}, 30 * 60 * 1000);

export default socket;