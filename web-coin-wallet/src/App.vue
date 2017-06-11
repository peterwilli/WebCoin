<template>
  <div id="app">
    <input type="file" @change="changeWallet" placeholder="Wallet path" />
    <br />
    <b>Current wallet:</b>
    <div v-if="wallet">
      <b>PubKey: </b> <span>{{ wallet.getPublicKey() }}</span>
      <b>Address: </b> <span>{{ wallet.getAddress() }}</span>
    </div>
    <b>Add peer</b>
    <input type="text" v-model="this.peerId" placeholder="peer id" />
    <input type="button" @click="addPeer()" value="add peer" />
    <br />
    <input type="button" @click="testPay()" value="test pay" />
  </div>
</template>

<script>
import Wallet from "@/wallet/Wallet"
const server = require("@/server/main")

export default {
  name: 'app',
  data() {
    return {
      wallet: Wallet.generate(),
      peerId: ""
    }
  },
  methods: {
    changeWallet(e) {
      var path = e.target.files[0].path
      this.wallet = Wallet.load(path)
      console.log("new wallet", this.wallet.getAddress());
    },
    testPay() {
      this.wallet.pay("todo", 10)
    },
    addPeer() {
      server.addPeer(this.peerId)
    }
  },

  mounted() {
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
