const checkpoint = require("@/server/checkpoint").default
const log = require("@/log")

var receivedSignatures = {}
const dataFn = function(conn, data) {
  log('Received', JSON.stringify(data))
  if(receivedSignatures[data.signature] !== undefined) {
    // Quit and also no broadcast as we already received this once.
    return
  }
  receivedSignatures[data.signature] = true
  var cmd = data.cmd
  if(cmd === 'payment') {
    checkpoint.recordPayment(data.packet, data.signature)
  }
  else if(cmd === 'vcc') {
    checkpoint.validateCheckpoint(data.packet, data.signature)
  }
  else if(cmd === 'icc') {
    checkpoint.importConsensusCheckpointFromPeers(data.packet)
  }
  else if(cmd === 'rcc') {
    checkpoint.requestConsensusCheckpoint(conn, data.packet)
  }
}

var wrapData = (conn) => {
  conn.on('data', (data) => {
    dataFn(conn, data)
  })
}

export default {
  stakingPeers: [],
  connectedPeers: [],
  addPeer(peer) {
    var conn = this.peer.connect(peer)
    log("Add peer: " + peer)
    conn.on('open', function() {
      // Receive messages
      log("Conn open");
      wrapData(conn)
    })
    this.connectedPeers.push({
      id: peer,
      conn: conn
    })
  },
  sendMessageIndividually(msg, conn, opts) {
    opts = Object.assign({
      recordSelf: false,
      allowZeroBalance: false
    }, opts)
    if(!opts.allowZeroBalance && checkpoint.getBalanceForAddress(this.wallet.getAddress()) === 0) {
      return;
    }
    log('sendMessageIndividually', JSON.stringify(msg))
    if(this.wallet === undefined) {
      throw new Error("Wallet not found!")
    }
    if((msg.cmd === undefined || msg.packet === undefined) || Object.keys(msg).length > 2) {
      throw new Error("A message only should have 2 keys: packet and cmd")
    }
    msg.signature = `${this.wallet.getAddress()}:${this.wallet.signMessage(msg.cmd + "|" + msg.packet)}`
    conn.send(msg)
    if(opts.recordSelf) {
      dataFn(null, msg)
    }
  },
  broadcast(msg, opts) {
    opts = Object.assign({
      recordSelf: false,
      allowZeroBalance: false
    }, opts)
    if(!opts.allowZeroBalance && checkpoint.getBalanceForAddress(this.wallet.getAddress()) === 0) {
      return;
    }
    log('broadcast', JSON.stringify(msg))
    if(this.wallet === undefined) {
      throw new Error("Wallet not found!")
    }
    if((msg.cmd === undefined || msg.packet === undefined) || Object.keys(msg).length > 2) {
      throw new Error("A message only should have 2 keys: packet and cmd")
    }
    msg.signature = `${this.wallet.getAddress()}:${this.wallet.signMessage(msg.cmd + "|" + msg.packet)}`
    for(var i in this.connectedPeers) {
      var peer = this.connectedPeers[i]
      peer.conn.send(msg)
    }
    if(opts.recordSelf) {
      dataFn(null, msg)
    }
  },
  setWallet (wallet) {
    this.wallet = wallet
  },
  start() {
    this.peer = new Peer({ key: '4rvj8mvhtbq8semi' })
    this.peer.on('connection', (conn) => {
      log("connected to: " + conn.peer)
      this.connectedPeers.push({
        id: conn.peer,
        conn: conn
      })
      wrapData(conn)
    })
    this.peer.on('open', (id) => {
      console.log('My peer ID is: ' + id);
    })
  }
}
