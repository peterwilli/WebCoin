module.exports = {
  peers: [],
  addPeer(peer) {
    var conn = peer.connect(peer)
    this.peers.push({
      conn, id: peer
    })
  },
  broadcast(msg) {
    for(var peer in this.peers) {
      peer.conn.send(msg)
    }
  },
  start() {
    var peer = new Peer({ key: '4rvj8mvhtbq8semi' })
    peer.on('open', (id) => {
      console.log('My peer ID is: ' + id);
    });
  }
}
