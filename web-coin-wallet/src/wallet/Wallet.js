const loader = require("./loader")
const generator = require("./generator")
const payment = require('./payment')

const fs = require("fs")

class Wallet {
  constructor(key) {
    this.key = key;
  }

  pay(to, amount) {
    payment(this, to, amount)
  }

  save(path) {
    fs.writeFile(path, new Buffer(this.key.getPrivate().toJSON(), "hex"), function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });
  }

  static generate() {
    return new Wallet(generator())
  }

  static load(file) {
    return new Wallet(loader(file))
  }
}

export default Wallet
