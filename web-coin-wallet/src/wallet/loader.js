const ec = require('./ec');
const fs = require('fs');

module.exports = (walletPath) => {
  var data = fs.readFileSync(walletPath, 'binary')
  return ec.keyFromPrivate(new Buffer(data, "binary").toString("hex"))
}
