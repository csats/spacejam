/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const DEFAULT_PATH = process.env.PATH;

const fs = require('fs');
const path = require('path');
const phantomjs = require("phantomjs-prebuilt");
const chai = require("chai");
const { expect } = chai;
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
require('../../lib/log');
const CLI = require('../../lib/CLI');
const Spacejam = require('../../lib/Spacejam');
const ChildProcess = require('../../lib/ChildProcess');



describe("CLI", function() {
  this.timeout(30000);

  let processArgv = null;

  let cli = null;
  let spacejam = null;
  let exitStub = null;
  let testPackagesStub = null;
  let spawnSpy = null;
  let phantomjsScript = null;

  before(() => processArgv = process.argv);

  after(() => process.argv = processArgv);

  beforeEach(function() {
    process.chdir(__dirname + "/../apps/leaderboard");
    delete process.env.PORT;
    delete process.env.ROOT_URL;
    delete process.env.MONGO_URL;
    delete process.env.METEOR_PACKAGE_DIRS;

    process.env.PATH = DEFAULT_PATH;

    process.argv = ['node', path.normalize(__dirname + "/../bin/spacejam")];
    cli = new CLI();
    ({ spacejam } = cli);
    exitStub = sinon.stub(process, 'exit');
    testPackagesStub = sinon.stub(spacejam, 'runTests');
    return phantomjsScript = 'phantomjs-test-in-console.js';
  });

  afterEach(function() {
    __guardMethod__(exitStub, 'restore', o => o.restore());
    exitStub = null;
    __guardMethod__(testPackagesStub, 'restore', o1 => o1.restore());
    testPackagesStub = null;
    __guardMethod__(spawnSpy, 'restore', o2 => o2.restore());
    spawnSpy = null;
    return spacejam = null;
  });

  it("should call Spacejam.runTests() test command and full-app mode with a empty array of packages", function() {
    process.argv.push("test", "--full-app");
    cli.exec();
    return expect(testPackagesStub).to.have.been.calledWith("test", {command: "test","full-app":true, packages: []});
  });

  it("should call Spacejam.runTests() with an empty options.packages array, if no packages where provided on the command line", function() {
    process.argv.push("test-packages");
    cli.exec();
    return expect(testPackagesStub).to.have.been.calledWith("test-packages", {command: "test-packages", packages: []});
  });

  it("should call Spacejam.runTests() with options.packages set to the packages provided on the command line", function() {
    process.argv.push('test-packages', '--settings', 'settings.json', 'package1', 'package2');
    cli.exec();
    return expect(testPackagesStub).to.have.been.calledWith("test-packages", {command: "test-packages", settings: 'settings.json', packages: ['package1', 'package2']});
  });

  it("should spawn phantomjs with the value of --phantomjs-options", function(done){
    log.setLevel('debug');
    testPackagesStub.restore();
    spawnSpy = sinon.spy(ChildProcess, '_spawn');
    process.chdir(__dirname + "/../apps/leaderboard/packages/success");
    // We set mongo-url to mongodb:// so test will be faster
    process.argv.push('test-packages', '--port', '11096', '--mongo-url', 'mongodb://', '--phantomjs-options=--ignore-ssl-errors=true --load-images=false', './');
    cli.exec();
    return spacejam.on('done', code=> {
      try {
        if (code === 0) { done(); } else { done(`spacejam.done=${code}`); }
        expect(spawnSpy).to.have.been.calledTwice;
        return expect(spawnSpy.secondCall.args[1]).to.deep.equal(['--ignore-ssl-errors=true', '--load-images=false', phantomjsScript]);
      } catch (err) {
        return done(err);
      }
    });
  });

  it("should modify PATH to include the path to the bundled phantomjs", function(done){
    testPackagesStub.restore();
    process.chdir(__dirname + "/../apps/leaderboard/packages/success");
    // We set mongo-url to mongodb:// so test will be faster
    process.argv.push('test-packages', '--port', '12096', '--mongo-url', 'mongodb://', '--phantomjs-options=--ignore-ssl-errors=true --load-images=false', './');
    cli.exec();
    return spacejam.on('done', code=> {
      try {
        if (code === 0) { done(); } else { done(`spacejam.done=${code}`); }

        const firstPathEntry = process.env.PATH.split(":")[0];
        return expect(firstPathEntry).to.equal(path.dirname(phantomjs.path));
      } catch (err) {
        return done(err);
      }
    });
  });

  return it("should not modify PATH if --use-system-phantomjs is given", function(done){
    testPackagesStub.restore();
    process.chdir(__dirname + "/../apps/leaderboard/packages/success");
    // We set mongo-url to mongodb:// so test will be faster
    process.argv.push('test-packages', '--port', '13096', '--mongo-url', 'mongodb://', '--use-system-phantomjs', '--phantomjs-options=--ignore-ssl-errors=true --load-images=false', './');
    console.log(process.argv.join(" "));
    cli.exec();
    return spacejam.on('done', code=> {
      try {
        if (code === 0) { done(); } else { done(`spacejam.done=${code}`); }

        return expect(process.env.PATH).to.equal(DEFAULT_PATH);
      } catch (err) {
        return done(err);
      }
    });
  });
});

function __guardMethod__(obj, methodName, transform) {
  if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
    return transform(obj, methodName);
  } else {
    return undefined;
  }
}