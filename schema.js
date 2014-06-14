module.exports = {
    user: {
      type: String,
      default: ''
    },
    hosts: {
      type: Array,
      default: []
    },
    script: {
      type: String,
      default: '# shell script to run on the remote host(s)'
    }
}
