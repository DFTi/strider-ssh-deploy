var sinon = require('sinon');
var chai = require('chai');
var expect = chai.expect;
chai.use(require('sinon-chai'));

var Worker = require('../worker.js');
var _ = require('lodash');

describe("shell command", function() {
  var shellCommand = null;
  var userScript = null;

  var loadConfig = function(config, done) {
    Worker.init(config, null, null, function(err, res) {
      shellCommand = res.deploy;
      done();
    })
  };

  beforeEach(function(done) {
    userScript = "echo $(hostname)";
    loadConfig({ script: userScript }, done);
  });

  it("shells into the host", function() {
    
  });
});
