const loader = require("./loader")
const generator = require("./generator")
const payment = require('./payment')
const crypto = require('crypto')

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
    return this.key.getPublic().encode("hex")
  }

  signHash(hash) {
    return new Buffer(this.key.sign(hash).toDER()).toString("hex")
  }

  save(path) {
    fs.writeFile(path, new Buffer(this.key.getPrivate().toJSON(), "hex"), function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });
  }

  static addressFromPubKey(pubKey) {
    return crypto.createHash('sha256').update(new Buffer(pubKey, "hex")).digest('base64')
  }

  static generate() {
    return new Wallet(generator())
  }

  static load(file) {
    return new Wallet(loader(file))
  }
}

export default Wallet
