function shellCommand(command) {
  if (!command || !command.replace(/#[^\n]*/g, '').trim().length) return
  return {
    command: 'sh',
    args: ['-x', '-c', command]
  }
}

function remoteShellCommand(command) {
  shellCommand(command);
};

module.exports = {
  init: function (config, job, context, done) {
    done(null, {
      deploy: remoteShellCommand(config.script),
    });
  }
}
