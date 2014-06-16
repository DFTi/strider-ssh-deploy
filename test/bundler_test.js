var sinon = require('sinon');
var chai = require('chai');
var expect = chai.expect;
chai.use(require('sinon-chai'));

var bundler = require('../bundler');
var fs = require('fs');

describe("bundler", function() {
  describe("bundleProject", function() {
    it("creates a tarball of the project", function(done) {
      bundler.bundleProject(__dirname, 'test', sinon.stub(), function(err, res) {
        expect(err).to.be.null;
        expect(fs.existsSync(res)).to.be.true;
        done();
      });
    });
  });
});
