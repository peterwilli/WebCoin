const loader = require("./loader")
const generator = require("./generator")
const payment = require('./payment')
const crypto = require('crypto')
const bitcoin = require('bitcoinjs-lib')
const fs = require("fs")

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

  signHash(hash) {
    return this.key.sign(hash).toString("hex")
  }

  signMessage(msg) {
    var hash = crypto.createHash('sha256').update(msg).digest('hex')
    return signHash(hash)
  }

  save(path) {
    fs.writeFile(path, new Buffer(this.key.toWIF(), "base64"), function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });
  }

  static addressFromPubKey(pubKey) {
    var keyPair = bitcoin.ECPair.fromPublicKeyBuffer(new Buffer(pubKey, 'hex'))
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
