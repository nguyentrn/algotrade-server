module.exports = {
  apps: [
    {
      name: 'algo-server',
      script: './index.js',
      interpreter: 'babel-node',
      env: {
        NETWORK: 'testnet',
      },
      env_mainnet: {
        NETWORK: 'mainnet',
      },
    },
  ],
};
