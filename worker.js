module.exports = {
  init: function (config, job, context, done) {
    done(null, { deploy: require('./deploy').configure(config) });
  }
}
