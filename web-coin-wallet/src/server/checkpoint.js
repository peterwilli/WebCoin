import Wallet from "@/wallet/Wallet"
const ec = require('@/wallet/ec')
const crypto = require('crypto')
const server = require("@/server/main")
const clock = require("@/server/clock")
const config = require("@/config")
const log = require("@/log")

var consensusCheckpoint = ""
var consensusCheckpointIndex = {}
var transactionsForNextConsensusCheckpoint = {}
var stakingInterval = -1
var exportedCheckpoint = null

var validateTransactionAgainstConsensusCheckpoint = (ts, transactionFrom, index) => {
  var { transaction, from } = transactionFrom

  // It needs to fall in this interval, if it does not, then we discard the transaction
  if(transaction[2] < ts && transaction[2] >= (ts - config.stakingInterval)) {
    if(index[transaction[0]] === undefined) {
      index[transaction[0]] = { balance: 0 }
    }
    index[from].balance -= transaction[1]
    index[transaction[0]].balance += transaction[1]
  }
}

var newConsensusCheckpointIndex = (index) => {
  for(key in index) {
    var obj = index[key]
    if(obj.balance === 0) {
      // We don't need to remember the pubkey or balance of a 0-balance wallet.
      delete index[key]
    }
  }
}

var exportCheckpoint = (ts, index) => {
  rows = []
  for(key in index) {
    var obj = index[key]
    rows.push(obj.join(":"))
  }
  rows.sort((a, b) => {
    if(a.from > b.from)
      return -1
    if(a.from < b.from)
      return 1
    return 0
  })
  return `${(ts - config.stakingInterval)}-${ts}|${rows.join("\n")}`
}

var voteConsensusCheckpoint = (exportedCheckpoint) => {
  var hash = crypto.createHash('sha256').update(exportedCheckpoint).digest('hex')
  server.broadcast({
    cmd: 'vcc',
    packet: `${hash}`
  })
}

var stakingValidationHashes = {}
var validationHashesCheck = () => {
  var hashVotes = {}
  for(var k in stakingValidationHashes) {
    var checkpoint = stakingValidationHashes[k]
    if(hashVotes[checkpoint.hash] === undefined) {
      hashVotes[checkpoint.hash] = 0
    }
    hashVotes[checkpoint.hash] += checkpoint.weight
  }
  var hashVotesArr = []
  for (var k in hashVotes) {
    var totalHashVoteWeight = hashVotes[k]
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
  winningCheckpointHash = hashVotesArr[0]
  delete hashVotes
  delete hashVotesArr
  // Compare against own generated consensus checkpoint, if different, change it with the winning consensus checkpoint
  var hash = crypto.createHash('sha256').update(exportedCheckpoint).digest('hex')
  if(hash === winningCheckpointHash) {
    // set checkpoint now
    importConsensusCheckpoint(exportedCheckpoint)
  }
  else {
    // We were wrong.... In this case, we just get the latest consensus checkpoint when ccp triggers :)
  }
}

var calculateWeightOfAddress = (address) => {
  // TODO: Make PoSV
  return consensusCheckpointIndex[address].balance
}

var stakeCheck = () => {
  var ts = clock.ts()
  if(ts % config.stakingInterval) {
    log("Staking tick")
    // Note that we don't have to sort here, since the order of the transactions don't matter.
    // As you can't send money you received from another party until after the next consensus checkpoint.
    // So all transactions in 1 checkpoint are all independent.
    var newConsensusCheckpointIndex = Object.assign({}, consensusCheckpointIndex)
    for(key in transactionsForNextConsensusCheckpoint) {
      // 0: to, 1: amount, 2: timestamp
      var transactionFrom = transactionsForNextConsensusCheckpoint[key]
      validateTransactionAgainstConsensusCheckpoint(ts, transactionFrom, newConsensusCheckpointIndex)
    }

    // Remove all pending transactions
    transactionsForNextConsensusCheckpoint = {}

    removeAnyZeroBalances(newConsensusCheckpointIndex)
    exportedCheckpoint = exportCheckpoint(ts, newConsensusCheckpointIndex)
    voteConsensusCheckpoint(exportedCheckpoint)
  }
}

export default {
  enableStaking(staking) {
    if(staking) {
      if(stakingInterval == -1)
        stakingInterval = setInterval(stakeCheck, 10)
    }
    else {
      if(stakingInterval > -1) {
        clearInterval(stakingInterval)
        stakingInterval = -1
      }
    }
  },
  calculateWeightOfAddress: calculateWeightOfAddress,
  validateCheckpoint(checkpoint, signature) {
    var hash = checkpoint
    var splitSig = signature.split(":")
    stakingValidationHashes[address] = {
      weight: this.calculateWeightOfAddress(splitSig[0])
      checkpoint,
      hash,
      signature: splitSig[1]
    }
  },
  recordPayment(packet) {
    var split = packet.split("|")
    var from = split[1]

    // Address has to be known, if not known, it has no balance
    if(consensusCheckpointIndex[from] !== undefined) {
      // 0: to, 1: amount, 2: timestamp
      var transaction = split[0].split(":")
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
    server.broadcast({ cmd: payment, packet: packet })
  },
  importConsensusCheckpoint(checkpoint) {
    consensusCheckpoint = checkpoint
    this.makeCheckpointIndex()
  },
  makeCheckpointIndex() {
    for(var row of consensusCheckpoint.split("\n")) {
      var split = row.split(":")
      consensusCheckpointIndex[Wallet.addressFromPubKey(split[1])] = {
        range: split[0],
        balance: parseFloat(split[2]),
        pubKey: split[1]
      }
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
