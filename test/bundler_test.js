var sinon = require('sinon');
var chai = require('chai');
var expect = chai.expect;
chai.use(require('sinon-chai'));

var bundler = require('../bundler');
var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;
var rimraf = require('rimraf');

describe("bundler", function() {
  var err = null, res = null;
  var projName = 'example_project-name';
  var tarballName = projName+'.tar.gz';
  var extractDir = '/tmp/'+projName;

  describe("bundleProject", function() {
    before(function(done) {
      if (fs.existsSync(extractDir)) {
        rimraf.sync(extractDir);
      }
      err = new Error('foo');
      bundler.bundleProject(__dirname+'/..', projName, sinon.stub(), function(_err, _res) {
        err = _err; res = _res; done();
      });
    });
    it("creates a tarball on disk", function() {
      expect(err).to.be.null;
      expect(fs.existsSync(res)).to.be.true;
    });
    it("names the tarball correctly", function() {
      expect(path.basename(res)).to.eq(tarballName);
    });
    it("tarball extracts correctly with unix tools", function(done) {
      fs.mkdirSync(extractDir);
      var tar = spawn('sh', ['-x', '-c', bundler.untarCmd(res, extractDir)]);
      tar.on('close', function(code) {
        expect(code).to.eq(0);
        expect(fs.existsSync(path.join(extractDir, 'package.json'))).to.be.true;
        done();
      });
    });
    after(function(done) {
      fs.unlinkSync(res);
      rimraf(extractDir, done);
    });
  });
});
