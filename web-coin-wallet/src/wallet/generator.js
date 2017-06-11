// Generate keys
const ec = require('./ec');

module.exports = () => {
  var key = ec.genKeyPair();
  return key;
}
