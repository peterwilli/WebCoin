<template>
  <div id="app">
    <input type="button" @click="testPay()" value="test pay" />
  </div>
</template>

<script>
import Wallet from "@/wallet/Wallet"
const server = require("@/server/main")
var wallet = null;

export default {
  name: 'app',
  methods: {
    testPay() {
      wallet.pay("todo", 10)
    }
  },
  mounted() {
    wallet = Wallet.load("/home/peter/wallets/wallet1.dat")
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
