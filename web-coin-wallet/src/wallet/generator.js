const bitcoin = require('bitcoinjs-lib')
const networks = require('@/server/networks')

// Generate keys
module.exports = () => {
  var keyPair = bitcoin.ECPair.makeRandom({ network: networks.webcoin })
  return keyPair
}
