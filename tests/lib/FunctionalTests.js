/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const path = require('path');
const fs = require('fs');
const { DOMParser } = require('xmldom');
const xpath = require('xpath');

const { expect } = require("chai");

const CLI = require('../../lib/CLI');
const ChildProcess = require('../../lib/ChildProcess');
const Spacejam = require('../../lib/Spacejam');
const spacejamBin = require.resolve("../../bin/spacejam");

log.info(spacejamBin);


describe("spacejam", function() {
  this.timeout(120000);

  let spacejamChild = null;

  let spacejamChild2 = null;

  const testApp1 = "leaderboard";

  const testApp2 = "todos";

  const standAlonePackage = "../packages/standalone-package";

  before(() => log.debug("spacejam.before"));

  beforeEach(function() {
    log.debug("spacejam.beforeEach");
    process.chdir(__dirname + "/../apps/leaderboard");
    delete process.env.PORT;
    delete process.env.ROOT_URL;
    delete process.env.MONGO_URL;
    delete process.env.METEOR_PACKAGE_DIRS;

    return spacejamChild = new ChildProcess();
  });

  afterEach(function() {
    log.debug("spacejam.afterEach");
    try {
      if (spacejamChild != null) {
        spacejamChild.kill('SIGPIPE');
      }
    } finally {
      spacejamChild = null;
    }

    try {
      return (spacejamChild2 != null ? spacejamChild2.kill('SIGPIPE') : undefined);
    } finally {
      spacejamChild2 = null;
    }
  });

  describe("test-packages", function() {

    it("should exit with 0 if tests pass for a meteor app package. Also verifies METEOR_TEST_PACKAGES is '1'", function(done){
      spacejamChild = new ChildProcess();
      const args = ["test-packages", "success"];
      spacejamChild.spawn(spacejamBin,args);
      return spacejamChild.child.on("exit", code => {
        expect(code,"spacejam exited with errors").to.equal(Spacejam.DONE.TEST_SUCCESS);
        return done();
      });
    });


    it("should exit with 0 if tests pass for a standalone package", function(done){
      process.chdir(__dirname + "/../packages/standalone-package");
      process.env.METEOR_PACKAGE_DIRS = path.normalize(__dirname + '/../packages');
      spacejamChild = new ChildProcess();
      const args = ["test-packages", "./"];
      spacejamChild.spawn(spacejamBin,args);
      return spacejamChild.child.on("exit", code => {
        expect(code,"spacejam exited with errors").to.equal(Spacejam.DONE.TEST_SUCCESS);
        return done();
      });
    });

    it("should execute multiple independent package tests provided by path while not in a meteor app or package folder", function(done){
      process.chdir(path.resolve(__dirname, ".."));
      spacejamChild = new ChildProcess();
      const args = ["test-packages", "packages/standalone-package-dep", 'apps/leaderboard/packages/success'];
      spacejamChild.spawn(spacejamBin,args);
      return spacejamChild.child.on("exit", code => {
        try {
          expect(code,"spacejam exited with errors").to.equal(Spacejam.DONE.TEST_SUCCESS);
          return done();
        } catch (err) {
          return done(err);
        }
      });
    });

    it("should exit with 3, if meteor couldn't find package", function(done){
      process.chdir(__dirname);
      spacejamChild = new ChildProcess();
      const args = ["test-packages", "success"];
      spacejamChild.spawn(spacejamBin,args);
      return spacejamChild.child.on("exit", code => {
        expect(code,"spacejam exited with the wrong code").to.equal(Spacejam.DONE.METEOR_ERROR);
        return done();
      });
    });


    it("should exit with 3, if package could not be found", function(done){
      spacejamChild = new ChildProcess();
      const args = ["test-packages", standAlonePackage];
      spacejamChild.spawn(spacejamBin,args);
      return spacejamChild.child.on("exit", code => {
        expect(code,"spacejam exited with errors").to.equal(Spacejam.DONE.METEOR_ERROR);
        return done();
      });
    });


    it("should exit with 2, if tests failed", function(done){
      spacejamChild = new ChildProcess();
      const testPort = "6096";
      const args = ["test-packages", "--port", testPort, "failure"];
      spacejamChild.spawn(spacejamBin,args);
      return spacejamChild.child.on("exit", code => {
        expect(code,"spacejam exited with the wrong code").to.equal(Spacejam.DONE.TEST_FAILED);
        return done();
      });
    });


    it("should exit with 4, if --timeout has passed", function(done){
      spacejamChild = new ChildProcess();
      const testPort = "7096";
      const args = ["test-packages", "--timeout", "30000", "--port", testPort, 'timeout'];
      spacejamChild.spawn(spacejamBin,args);
      return spacejamChild.child.on("exit", code => {
        expect(code,"spacejam exited with the wrong code").to.equal(Spacejam.DONE.TEST_TIMEOUT);
        return done();
      });
    });


    it("should exit with 2, if the meteor app crashes", function(done){
      this.timeout(90000);
      process.chdir(__dirname + "/../apps/todos");
      spacejamChild = new ChildProcess();
      const testPort = "8096";
      const args = ["test-packages", "--port", testPort, 'appfails'];
      spacejamChild.spawn(spacejamBin,args);
      return spacejamChild.child.on("exit", code => {
        expect(code).to.equal(Spacejam.DONE.METEOR_ERROR);
        return done();
      });
    });

    it("should exit with 6, if the tests contain an error", function(done){
      this.timeout(90000);
      process.chdir(__dirname + "/../apps/todos");
      spacejamChild = new ChildProcess();
      const testPort = "8096";
      const args = ["test-packages", "--port", testPort, 'appclientsideerror'];
      spacejamChild.spawn(spacejamBin,args);
      return spacejamChild.child.on("exit", code => {
        expect(code).to.equal(Spacejam.DONE.CLIENT_ERROR);
        return done();
      });
    });


    it("should save xunit output to file, if --xunit-out is specified", function(done){
      spacejamChild = new ChildProcess();
      // TODO: Have a global singleton to provide the port
      const testPort = "20096";
      const args = ["test-packages", "--port", testPort, '--xunit-out', '/tmp/xunit.xml', "success"];
      spacejamChild.spawn(spacejamBin,args);
      return spacejamChild.child.on("close", (code, signal) => {
        try {
          expect(code,"spacejam exited with errors").to.equal(Spacejam.DONE.TEST_SUCCESS);
          const xml = fs.readFileSync('/tmp/xunit.xml', {encoding: 'utf8'});
          log.debug(xml);
          expect(xml).to.be.ok;
          const xmlDom = new DOMParser().parseFromString(xml);
          expect(xmlDom.documentElement.tagName).to.equal('testsuite');
          const testCaseNodes = xpath.select("//testcase", xmlDom);
          expect(testCaseNodes).to.have.length(3);
          return done();
        } catch (ex) {
          return done(ex);
        }
      });
    });


    return it("should exit with 0, in case of a complete test, with a settings file, multiple packages, including wildcards in package names", function(done){
      spacejamChild = new ChildProcess();
      const testPort = "10096";
      const args = ["test-packages", "--settings", "settings.json", "--port", testPort, 'packages/settings', 'success*'];
      spacejamChild.spawn(spacejamBin,args);
      return spacejamChild.child.on("exit", code => {
        expect(code,"spacejam exited with errors").to.equal(Spacejam.DONE.TEST_SUCCESS);
        return done();
      });
    });
  });

  describe("package-version", () =>

    it("should print the package version", function(done){
      process.chdir(__dirname + "/../packages/standalone-package");
      spacejamChild = new ChildProcess();
      return spacejamChild.exec(`${spacejamBin} package-version`, null, (err, stdout, stderr)=> {
        try {
          expect(err).to.be.null;
          expect(stdout.toString()).to.contain('0.9.5');
          return done();
        } catch (error) {
          err = error;
          return done(err);
        }
      });
    })
  );

  return describe("test", function() {


    describe("--full-app mode", function() {


      it("should exit with 0 with successful tests", function(done){
        process.chdir(__dirname + "/../apps/passing-app-tests");
        const args = ["test", "--driver-package", "practicalmeteor:mocha-console-runner", "--full-app"];
        spacejamChild.spawn(spacejamBin, args);
        return spacejamChild.child.on("exit", code => {
          expect(code,"spacejam exited with the wrong code").to.equal(Spacejam.DONE.TEST_SUCCESS);
          return done();
        });
      });

      return it("should exit with 1 with successful tests", function(done){
        process.chdir(__dirname + "/../apps/failing-app-tests");
        let args = ["test", "--driver-package", "practicalmeteor:mocha-console-runner", "--full-app"];
        args = ["test", "--driver-package", "practicalmeteor:mocha-console-runner", "--full-app"];
        spacejamChild.spawn(spacejamBin, args);
        return spacejamChild.child.on("exit", code => {
          expect(code,"spacejam exited with the wrong code").to.equal(Spacejam.DONE.TEST_FAILED);
          return done();
        });
      });
    });


    return describe("unit tests mode", function() {

      it("should exit with 0 with successful tests", function(done){
        process.chdir(__dirname + "/../apps/passing-app-tests");
        const args = ["test", "--driver-package", "practicalmeteor:mocha-console-runner"];
        spacejamChild.spawn(spacejamBin, args);
        return spacejamChild.child.on("exit", code => {
          expect(code,"spacejam exited with the wrong code").to.equal(Spacejam.DONE.TEST_SUCCESS);
          return done();
        });
      });

      return it("should exit with 2 with failed tests", function(done){
        process.chdir(__dirname + "/../apps/failing-app-tests");
        const args = ["test", "--driver-package", "practicalmeteor:mocha-console-runner"];
        spacejamChild.spawn(spacejamBin, args);
        return spacejamChild.child.on("exit", code => {
          expect(code,"spacejam exited with the wrong code").to.equal(Spacejam.DONE.TEST_FAILED);
          return done();
        });
      });
    });
  });
});

