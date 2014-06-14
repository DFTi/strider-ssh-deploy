var sinon = require('sinon');
var chai = require('chai');
var expect = chai.expect;
chai.use(require('sinon-chai'));

var Worker = require('../worker');
var deploy  = require('../deploy');

describe("worker", function() {
  var contextStub = null;
  var doneStub = null;
  var options = null;
  var deployFunc = null;

  var run = function(done) {
    Worker.init(options, null, null, function (err, res) {
      res.deploy(contextStub, doneStub);
      done();
    });
  }

  beforeEach(function(done) {
    deployFunc = sinon.stub();
    sinon.stub(deploy, 'configure').returns(deployFunc);
    options = 'user stuff';
    contextStub =  'other stuff';
    doneStub = 'more stuff';
    run(done);
  });

  afterEach(function() {
    deploy.configure.restore();
  });

  it("configures the deployer with user options", function() {
    expect(deploy.configure).to.have.been.calledWith(options);
  });

  it("calls the function returned by deploy.configure, passing in context and done", function() {
    expect(deployFunc).to.have.been.calledWith(contextStub, doneStub);
  });
});
