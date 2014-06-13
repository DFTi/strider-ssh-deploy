module.exports = {
    user: {
      type: String,
      default: ''
    },
    hosts: {
      type: String,
      default: ''
    },
    script: {
      type: String,
      default: '# shell script to run on the remote host(s)'
    }
}
