import Wallet from "@/wallet/Wallet"

var consensusCheckpoint = ""
var consensusCheckpointIndex = {}

export default {
  importConsensusCheckpoint(checkpoint) {
    consensusCheckpoint = checkpoint
    this.makeCheckpointIndex()
  },
  makeCheckpointIndex() {
    for(var row of consensusCheckpoint.split("\n")) {
      var split = row.split(":")
      consensusCheckpointIndex[Wallet.addressFromPubKey(split[0])] = parseFloat(split[1])
    }
  },
  getBalanceForAddress(address) {
    return consensusCheckpointIndex[address]
  },
  getConsensusCheckpoint() {
    return consensusCheckpoint
  }
}
