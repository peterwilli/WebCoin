const clock = require("@/server/clock")
const crypto = require('crypto')
const server = require("@/server/main")

module.exports = (wallet, to, amount) => {
  // Create the transaction and the hash of it.
  var transaction = `${to}:${amount}:${clock.ts()}`
  var hash = crypto.createHash('sha256').update(transaction).digest('hex');
  var signature = new Buffer(wallet.key.sign(hash).toDER()).toString("hex");
  var packet = `${transaction}|${signature}`
  server.broadcast(packet)
}
