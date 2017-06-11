module.exports = {
  peers: [],
  addPeer(peer) {
    var conn = this.peer.connect(peer)
    conn.on('open', function() {
      // Receive messages
      console.log("Conn open");
      conn.on('data', function(data) {
        console.log('Received', data)
      })
    })
    this.peers.push({
      id: peer,
      conn: conn
    })
  },
  broadcast(msg) {
    for(var i in this.peers) {
      var peer = this.peers[i]
      peer.conn.send(msg)
    }
  },
  start() {
    this.peer = new Peer({ key: '4rvj8mvhtbq8semi' })

    this.peer.on('open', (id) => {
      console.log('My peer ID is: ' + id);
    });
  }
}
