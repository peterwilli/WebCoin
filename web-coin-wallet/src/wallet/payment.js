const clock = require("@/server/clock")
const crypto = require('crypto')
const server = require("@/server/main")

module.exports = (wallet, to, amount) => {
  // Create the transaction and the hash of it.
  var transaction = `${to}:${amount}:${clock.ts()}`
  var hash = crypto.createHash('sha256').update(transaction).digest('hex');
  var signature = wallet.signHash(hash);
  var packet = `${transaction}|${wallet.getAddress()}|${signature}`
  console.log(packet);
  server.broadcast(packet)
}
