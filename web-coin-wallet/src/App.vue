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
// Test
checkpoint.importConsensusCheckpoint("0-30:3rMzRa7pqpg9UjAFyvc6LPDk9eR/GQh86IdB5/aks9Y=:04e6c8420be50a8976c02876f4e6ab19d1697ae6f9672506875fe8d398ff7d14fb84acf0853e5937248d52a073da52063dcc8868bf3156ac77cc1f5dcf9c5b4760:" + config.totalCoins)

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
