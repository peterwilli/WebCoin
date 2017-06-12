const clock = require("@/server/clock")
const crypto = require('crypto')
const server = require("@/server/main").default

module.exports = (wallet, to, amount) => {
  // Create the transaction and the hash of it.
  var transaction = `${to}:${amount}:${clock.ts()}`
  server.broadcast({
    cmd: 'payment',
    packet: transaction
  }, {
    recordSelf: true
  })
}
