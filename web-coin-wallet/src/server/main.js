const checkpoint = require("@/server/checkpoint").default

module.exports = {
  peers: [],
  addPeer(peer) {
    var conn = this.peer.connect(peer)
    conn.on('open', function() {
      // Receive messages
      console.log("Conn open");
      conn.on('data', function(data) {
        console.log('Received', data)
        var cmd = data.cmd
        if(cmd === 'payment') {
          checkpoint.recordPayment(data.packet)
        }
        else if(cmd === 'vcc') {
          checkpoint.validateCheckpoint(data.packet, data.signature)
        }
      })
    })
    this.peers.push({
      id: peer,
      conn: conn
    })
  },
  broadcast(msg) {
    if(this.wallet === undefined) {
      throw new Error("Wallet not found!")
    }
    if((msg.cmd === undefined || msg.packet === undefined) || Object.keys(msg).length > 2) {
      throw new Error("A message only should have 2 keys: packet and cmd")
    }
    msg.signature = `${this.wallet.getAddress()}:${this.wallet.signMessage(msg.cmd + "|" + msg.packet)}`
    for(var i in this.peers) {
      var peer = this.peers[i]
      peer.conn.send(msg)
    }
  },
  setWallet (wallet) {
    this.wallet = wallet
  }
  start() {
    this.peer = new Peer({ key: '4rvj8mvhtbq8semi' })
    this.peer.on('open', (id) => {
      console.log('My peer ID is: ' + id);
    });
  }
}
