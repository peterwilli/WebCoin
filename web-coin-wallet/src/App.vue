<template>
  <div id="app">
    <input type="file" @change="changeWallet" placeholder="Wallet path" />
    <br />
    <b>Current wallet:</b>
    <div v-if="wallet">
      <b>PubKey: </b> <span>{{ wallet.getPublicKey() }}</span>
      <b>Address: </b> <span>{{ wallet.getAddress() }}</span>
      <b>Balance: </b> <span>{{ checkpoint.getBalanceForAddress(wallet.getAddress()) }}</span>
    </div>
    <b>Add peer</b>
    <input type="text" v-model="peerId" placeholder="peer id" />
    <input type="button" @click="addPeer()" value="add peer" />
    <br />
    <b>Address to pay to: </b> <input type="text" v-model="to" />
    <input type="button" @click="testPay()" value="test pay" />
  </div>
</template>

<script>
import Wallet from "@/wallet/Wallet"

const config = require("@/config")
const log = require("@/log")
const server = require("@/server/main").default
const checkpoint = require("@/server/checkpoint").default

checkpoint.importConsensusCheckpoint(`0:${config.genesisAddress}:${config.totalCoins}:${config.genesisSignature}`)

export default {
  name: 'app',
  data() {
    var wallet = Wallet.generate()
    server.setWallet(wallet)
    return {
      checkpoint: checkpoint,
      wallet: wallet,
      peerId: "",
      to: ""
    }
  },
  methods: {
    changeWallet(e) {
      var path = e.target.files[0].path
      this.wallet = Wallet.load(path)
      server.setWallet(this.wallet)
    },
    testPay() {
      this.wallet.pay(this.to, 10)
    },
    addPeer() {
      server.addPeer(this.peerId)
    }
  },

  mounted() {
    var this_ = this
    checkpoint.events.on('consensus-checkpoint', function (checkpoint_) {
      this_.$forceUpdate()
    })
    checkpoint.enableStaking(true)
    checkpoint.setServer(server)
    server.start()
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
