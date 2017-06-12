import Wallet from "@/wallet/Wallet"
const ec = require('@/wallet/ec')
const crypto = require('crypto')
const clock = require("@/server/clock")
const config = require("@/config")
const log = require("@/log")

var consensusCheckpoint = ""
var consensusCheckpointIndex = {}
var transactionsForNextConsensusCheckpoint = {}
var stakingInterval = -1
var validationHashesCheckInterval = -1
var exportedCheckpoint = null
var winningCheckpointHash = null
var server = null

var importConsensusCheckpoint = (checkpoint) => {
  consensusCheckpoint = checkpoint
  makeCheckpointIndex()
}

var makeCheckpointIndex = () => {
  var range = consensusCheckpoint.substring(0, consensusCheckpoint.indexOf(":"))
  var rows = consensusCheckpoint.substring(consensusCheckpoint.indexOf(":") + 1, consensusCheckpoint.length)
  for(var key in consensusCheckpointIndex) {
    delete consensusCheckpointIndex[key]
  }
  for(var row of rows.split("\n")) {
    var split = row.split(":")
    consensusCheckpointIndex[split[0]] = {
      balance: parseFloat(split[2]),
      pubKey: split[1]
    }
  }
}

var validateTransactionAgainstConsensusCheckpoint = (ts, transactionFrom, index) => {
  var { transaction, from } = transactionFrom

  // It needs to fall in this interval, if it does not, then we discard the transaction
  if(transaction[2] < ts && transaction[2] >= (ts - config.stakingInterval)) {
    if(index[transaction[0]] === undefined) {
      index[transaction[0]] = { balance: 0 }
    }
    var amount = parseFloat(transaction[1])
    index[from].balance -= amount
    index[transaction[0]].balance += amount
  }
}

var removeAnyZeroBalances = (index) => {
  for(var key in index) {
    var obj = index[key]
    if(obj.balance === 0) {
      // We don't need to remember the pubkey or balance of a 0-balance wallet.
      delete index[key]
    }
  }
}

var exportCheckpoint = (ts, index) => {
  var rows = []
  for(var key in index) {
    var obj = index[key]
    rows.push([key, obj.pubKey || "", obj.balance].join(":"))
  }
  rows.sort((a, b) => {
    if(a.from > b.from)
      return -1
    if(a.from < b.from)
      return 1
    return 0
  })
  var ret = `${(ts - config.stakingInterval)}-${ts}:${rows.join("\n")}`
  return ret
}

var voteConsensusCheckpoint = () => {
  var hash = crypto.createHash('sha256').update(exportedCheckpoint).digest('hex')
  if(server.wallet !== undefined) {
    server.broadcast({
      cmd: 'vcc',
      packet: `${hash}`
    }, {
      recordSelf: true
    })
  }
}

var stakingValidationHashes = {}
var validationHashesCheck = () => {
  if(Object.keys(stakingValidationHashes).length === 0) {
    return;
  }

  var hashVotes = {}
  for(var k in stakingValidationHashes) {
    var checkpoint = stakingValidationHashes[k]
    if(hashVotes[checkpoint.hash] === undefined) {
      hashVotes[checkpoint.hash] = {
        weight: 0
      }
    }
    hashVotes[checkpoint.hash].weight += checkpoint.weight
  }
  var hashVotesArr = []
  for (var k in hashVotes) {
    var totalHashVoteWeight = hashVotes[k].weight
    hashVotesArr.push([k, totalHashVoteWeight])
  }
  hashVotesArr.sort((a, b) => {
    if(a[1] > b[1]) {
      return -1
    }
    if(a[1] < b[1]) {
      return 1
    }
    return 0
  });
  winningCheckpointHash = hashVotesArr[0][0]

  // TODO: make better conditions
  var notReadyToTakeVote = winningCheckpointHash === undefined
  if(notReadyToTakeVote) {
    return
  }
  log(`Figured out winning hash: ${winningCheckpointHash}, based on the following packet:\n`, winningCheckpointHash)
  // Compare against own generated consensus checkpoint, if different, change it with the winning consensus checkpoint
  var exportedCheckpointHash = crypto.createHash('sha256').update(exportedCheckpoint).digest('hex')
  if(exportedCheckpointHash === winningCheckpointHash) {
    // set checkpoint now
    importConsensusCheckpoint(exportedCheckpoint)
  }
  else {
    // We were wrong (or we had an old checkpoint because wallet was offline)
    // Ask for the full balance list matching the winning hash
    console.warn(`exportedCheckpointHash(${exportedCheckpointHash}) is not the same as winningCheckpointHash(${winningCheckpointHash})`);
    server.broadcast({
      cmd: 'rcc',
      packet: winningCheckpointHash
    }, {
      allowZeroBalance: true
    })
  }
  stakingValidationHashes = {}
}

var calculateWeightOfAddress = (address) => {
  // TODO: Make PoSV
  return consensusCheckpointIndex[address].balance
}

window.consensusCheckpointIndex = consensusCheckpointIndex

var stakePause = -1
var stakeCheck = () => {
  var ts = clock.ts()
  if(stakePause-- >= 0) {
    return;
  }
  if((ts % config.stakingInterval) === 0) {
    stakePause = Math.round(1200 / 10)
    log("Staking tick")
    // Note that we don't have to sort here, since the order of the transactions don't matter.
    // As you can't send money you received from another party until after the next consensus checkpoint.
    // So all transactions in 1 checkpoint are all independent.
    if(Object.keys(transactionsForNextConsensusCheckpoint).length > 0) {
      var newConsensusCheckpointIndex = Object.assign({}, consensusCheckpointIndex)
      for(var key in transactionsForNextConsensusCheckpoint) {
        // 0: to, 1: amount, 2: timestamp
        var transactionFrom = transactionsForNextConsensusCheckpoint[key]
        validateTransactionAgainstConsensusCheckpoint(ts, transactionFrom, newConsensusCheckpointIndex)
      }

      // Remove all pending transactions
      transactionsForNextConsensusCheckpoint = {}
      // Remove any zero-balanced addresses
      removeAnyZeroBalances(newConsensusCheckpointIndex)

      // Export and stake
      exportedCheckpoint = exportCheckpoint(ts, newConsensusCheckpointIndex)
      voteConsensusCheckpoint()
    }
  }
}

export default {
  setServer(server_) {
    server = server_
  },
  requestConsensusCheckpoint(conn, hash) {
    server.sendMessageIndividually({
      cmd: 'icc',
      packet: consensusCheckpoint
    }, conn)
  },
  importConsensusCheckpoint,
  importConsensusCheckpointFromPeers(packet) {
    var hash = crypto.createHash('sha256').update(packet).digest('hex')
    log("Trying to import new consensusCheckpoint from peer: \n" + packet)
    if(hash === winningCheckpointHash) {
      // This is the one
      importConsensusCheckpoint(packet)
    }
    else {
      console.error(`Hash is not equal! ${hash} vs ${winningCheckpointHash}`);
    }
  },
  enableStaking(staking) {
    if(staking) {
      if(stakingInterval == -1)
        stakingInterval = setInterval(stakeCheck, 10)
        validationHashesCheckInterval = setInterval(validationHashesCheck, 1000)
    }
    else {
      if(stakingInterval > -1) {
        clearInterval(stakingInterval)
        clearInterval(validationHashesCheckInterval)
        stakingInterval = -1
        validationHashesCheckInterval = -1
      }
    }
  },
  calculateWeightOfAddress: calculateWeightOfAddress,
  validateCheckpoint(checkpoint, signature) {
    var hash = checkpoint
    var splitSig = signature.split(":")
    var address = splitSig[0]
    stakingValidationHashes[address] = {
      weight: this.calculateWeightOfAddress(splitSig[0]),
      checkpoint,
      hash,
      signature
    }
  },
  recordPayment(packet, signature) {
    var from = signature.split(":")[0]

    // Address has to be known, if not known, it has no balance
    if(consensusCheckpointIndex[from] !== undefined) {
      // 0: to, 1: amount, 2: timestamp
      var transaction = packet.split(":")
      var newBalance = consensusCheckpointIndex[from].balance - transaction[1]
      if(newBalance >= 0) {
        // No negative balance, log the final transaction
        // We use from address to make sure we don't log this transaction twice, but also any following transactions in this block.
        transactionsForNextConsensusCheckpoint[from] = {
          transaction, from
        }
      }
    }
    // Now broadcast to our peers as well.
    if(server.wallet !== undefined) {
      server.broadcast({ cmd: 'payment', packet: packet })
    }
  },

  getBalanceForAddress(address) {
    if(consensusCheckpointIndex[address] === undefined) {
      return 0
    } else {
      return consensusCheckpointIndex[address].balance
    }
  },
  getConsensusCheckpoint() {
    return consensusCheckpoint
  }
}
