const loader = require("./loader")
const generator = require("./generator")

class Wallet {
  constructor(key) {
    this.key = key;
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
