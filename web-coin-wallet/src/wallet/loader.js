const fs = require('fs');
const bitcoin = require('bitcoinjs-lib')

module.exports = (walletPath) => {
  var data = fs.readFileSync(walletPath, 'binary').toString('base64')
  return bitcoin.ECPair.fromWIF(data)
}
