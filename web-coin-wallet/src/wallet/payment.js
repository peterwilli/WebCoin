const clock = require("@/server/clock")
const server = require("@/server/main").default

module.exports = (wallet, to, amount) => {
  // Create the transaction and the hash of it.
  var transaction = `${clock.getBlockNumber()}:${to}:${amount}`
  server.broadcast({
    cmd: 'payment',
    packet: transaction
  }, {
    recordSelf: true
  })
}
