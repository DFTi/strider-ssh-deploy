function shellCommand(command) {
  if (!command || !command.replace(/#[^\n]*/g, '').trim().length) return
  return {
    command: 'sh',
    args: ['-x', '-c', command]
  }
}

function remoteShellCommand(command) {
  return shellCommand(command);
};

module.exports = {
  init: function (config, job, context, done) {
    done(null, {
      deploy: function(io, context) {
        context.comment("deploying!!!");
        console.log("I AM DEPLOYING");
      }
    });
  }
}
