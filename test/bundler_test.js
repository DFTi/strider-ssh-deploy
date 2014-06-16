var sinon = require('sinon');
var chai = require('chai');
var expect = chai.expect;
chai.use(require('sinon-chai'));

var bundler = require('../bundler');
var fs = require('fs');

describe("bundler", function() {
  var err = null, res = null;

  describe("bundleProject", function() {
    before(function(done) {
      err = new Error('foo');
      bundler.bundleProject(__dirname, 'test', sinon.stub(), function(_err, _res) {
        err = _err; res = _res; done();
      });
    });
    it("creates a tarball of the project", function() {
      expect(err).to.be.null;
      expect(fs.existsSync(res)).to.be.true;
    });
    after(function(done) {
      if (!err) { fs.unlink(res, done) };
    });
  });
});
