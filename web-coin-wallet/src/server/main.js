module.exports = {
  start() {
    var peer = new Peer({ key: '4rvj8mvhtbq8semi' })
    peer.on('open', (id) => {
      console.log('My peer ID is: ' + id);
    });
  }
}
