module.exports = function() {
  if (this.console) {
    console.log(Array.prototype.slice.call(arguments))
  }
}
