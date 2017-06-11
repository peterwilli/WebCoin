<template>
  <div id="app">
    <img src="./assets/logo.png">
    <router-view></router-view>
  </div>
</template>

<script>
const wallet = require("@/wallet/main").default
const server = require("@/server/main")

export default {
  name: 'app',
  mounted() {
    var loadedWallet = new wallet.Wallet(wallet.loader("/home/peter/wallets/wallet1.dat"))
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
