const fs = require('fs');
const bitcoin = require('bitcoinjs-lib')
const networks = require('@/server/networks')

module.exports = (walletPath) => {
  var data = new Buffer(fs.readFileSync(walletPath, 'binary'), 'binary').toString('base64')
  return bitcoin.ECPair.fromWIF(data, networks.webcoin)
}
