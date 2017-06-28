module.exports = {
  ts() {
    return Math.round((+new Date()) / 1000)
  },
  getBlockNumber() {
    return Math.round(this.ts() / 30)
  }
}
