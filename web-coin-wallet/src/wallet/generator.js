// Generate keys
const ec = require('./ec');
const fs = require('fs');

module.exports = () => {
  var key = ec.genKeyPair();
  fs.writeFile("/home/peter/wallets/" + "wallet2.dat", new Buffer(key.getPrivate().toJSON(), "hex"), function(err) {
      if(err) {
          return console.log(err);
      }

      console.log("The file was saved!");
  });
  return key;
}
