const bitcoin = require('bitcoinjs-lib')

// Generate keys
module.exports = () => {
  var keyPair = bitcoin.ECPair.makeRandom()
  return keyPair
}
