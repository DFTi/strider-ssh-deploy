var sinon = require('sinon');
var chai = require('chai');
var expect = chai.expect;
chai.use(require('sinon-chai'));

var Connection = require('ssh2');

var deploy = require('../deploy');
var bundler = require('../bundler');

describe("deploy", function() {
  var config = null, context = null;

  beforeEach(function() {
    sinon.stub(bundler, 'bundleProject').yields();
  });

  afterEach(function() {
    bundler.bundleProject.restore();
  });

  describe("connect", function() {
    describe("when three hosts configured", function() {
      beforeEach(function() {
        config = { hosts: ['1'] };
        context = {
          comment:sinon.stub(),
          job: { project: { name: "foo" } }
        };
        sinon.stub(Connection.prototype, 'connect');
        deploy.configure(config)(context);
        deploy.configure(config)(context);
        deploy.configure(config)(context);
      });
      afterEach(function() {
        Connection.prototype.connect.restore();
      });
      it("called thrice", function() {
        expect(Connection.prototype.connect).to.have.been.calledThrice;
      });
    });
  });
});
