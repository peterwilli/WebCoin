const loader = require("./loader")
const generator = require("./generator")
const payment = require('./payment')
const crypto = require('crypto')
const bitcoin = require('bitcoinjs-lib')
const bitcoinMessage = require('bitcoinjs-message')
const fs = require("fs")
const networks = require('@/server/networks')

class Wallet {
  constructor(key) {
    this.key = key;
  }

  pay(to, amount) {
    payment(this, to, amount)
  }

  getAddress() {
    return Wallet.addressFromPubKey(this.getPublicKey())
  }

  getPublicKey() {
    return this.key.getPublicKeyBuffer().toString('hex')
  }

  signMessage(msg) {
    var privateKey = this.key.d.toBuffer(32)
    var signature = bitcoinMessage.sign(msg, networks.webcoin.messagePrefix, privateKey, this.key.compressed)
    return signature.toString('base64')
  }

  save(path) {
    fs.writeFile(path, new Buffer(this.key.toWIF(), "base64"), function(err) {
        if(err) {
            return console.log(err)
        }
        console.log("The file was saved!")
    })
  }

  static addressFromPubKey(pubKey) {
    var keyPair = bitcoin.ECPair.fromPublicKeyBuffer(new Buffer(pubKey, 'hex'), networks.webcoin)
    return keyPair.getAddress()
  }

  static generate() {
    return new Wallet(generator())
  }

  static load(file) {
    return new Wallet(loader(file))
  }
}

export default Wallet
