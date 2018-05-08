/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const DEFAULT_PATH = process.env.PATH;

const fs = require('fs');
const path = require('path');
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
});

function __guardMethod__(obj, methodName, transform) {
  if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
    return transform(obj, methodName);
  } else {
    return undefined;
  }
}