const clock = require("@/server/clock")
const crypto = require('crypto')

module.exports = (wallet, to, amount) => {
  // Create the transaction and the hash of it.
  var transaction = `${to}:${amount}:${clock.ts()}`
  var hash = crypto.createHash('sha256').update(transaction).digest('hex');
  console.log(hash);
}
