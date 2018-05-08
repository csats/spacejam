/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("underscore");
const chai = require("chai");
const { expect } = chai;
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const Meteor = require("../../lib/Meteor");
const ChildProcess = require("../../lib/ChildProcess");
const ps = require('psext');
const path = require("path");


describe("Meteor", function() {
  this.timeout(30000);

  let meteor = null;

  let spawnStub = null;

  const defaultTestPort = 4096;

  let env = null;

  const packageToTest = 'success';

  let expectedSpawnOptions = null;

  let expectedSpawnArgs = null;

  const childProcessMockObj = {
    on() {},
    stdout: {
      on() {}
    },
    stderr: {
      on() {}
    }
  };


  before(function() {
    delete process.env.PORT;
    delete process.env.ROOT_URL;
    return delete process.env.MONGO_URL;
  });


  beforeEach(function() {
    process.chdir(__dirname + "/../apps/leaderboard");

    env = _.clone(process.env);

    meteor = new Meteor();
    expectedSpawnArgs = ['test-packages', '--driver-package', 'test-in-console'];
    spawnStub = sinon.stub(ChildProcess.prototype, "spawn");
    return ChildProcess.prototype.child = childProcessMockObj;
  });


  afterEach(function() {
    ChildProcess.prototype.child = null;
    __guardMethod__(spawnStub, 'restore', o => o.restore());
    return spawnStub = null;
  });

  const getExpectedSpawnOptions = function(port, rootUrl, mongoUrl, cwd){
    if (cwd == null) { cwd = process.cwd(); }
    expectedSpawnOptions = {cwd, detached: false, env};
    if (rootUrl == null) { rootUrl = `http://localhost:${port}/`; }
    expectedSpawnOptions.env.METEOR_TEST_PACKAGES = '1';
    expectedSpawnOptions.env.ROOT_URL = rootUrl;
    if (mongoUrl != null) { expectedSpawnOptions.env.MONGO_URL = mongoUrl; }
    return expectedSpawnOptions;
  };


  it("getTestArgs() - get common args for test and test-packages command", function() {
    const options = {
      "driver-package": "package",
      "release": 'release',
      "port": '3000',
      "settings": 'settings',
      "production": true,
      "packages": ['pkg1', 'pkg2']
    };

    const args = meteor.getTestArgs('test', options);

    return expect(args).to.be.deep.equal([
      "test",
      "--driver-package", "package",
      "--release", "release",
      "--port", "3000",
      "--settings", "settings",
      "--production"
    ]);
  });


  describe("getTestArgs()", function() {

    beforeEach(function() {
      this.options = {
        "driver-package": "package",
        "release": 'release',
        "port": '3000',
        "settings": 'settings',
        "production": true,
        "packages": ['pkg1', 'pkg2']
      };
      return meteor.options = this.options;
    });


    it("create args for test-packages command", function() {

      const args = meteor.getTestArgs('test-packages', this.options);

      return expect(args).to.be.deep.equal([
        "test-packages",
        "--driver-package", "package",
        "--release", "release",
        "--port", "3000",
        "--settings", "settings",
        "--production",
        "pkg1", "pkg2"
      ]);
    });

    return it("create args for test command", function() {

      _.extend(this.options,{
        "test-app-path": "/tmp/app",
        "full-app": true
      });


      const args = meteor.getTestArgs('test', this.options);

      return expect(args).to.be.deep.equal( [
        "test",
        "--driver-package", "package",
        "--release", "release",
        "--port", "3000",
        "--settings", "settings",
        "--production",
        "--test-app-path", "/tmp/app",
        "--full-app"
      ]);
    });
  });


  it("testApp - should spawn meteor with correct arguments", function() {
    meteor.testApp({"full-app": true});
    expectedSpawnArgs = [
      "test",
      "--driver-package", "test-in-console",
      "--port", defaultTestPort,
      "--full-app"
    ];
    return expect(spawnStub.args[0]).to.eql(["meteor", expectedSpawnArgs, getExpectedSpawnOptions(4096)]);
  });

  it("testPackages() - should spawn meteor with no package arguments",function() {
    meteor.testPackages();
    expectedSpawnArgs.push("--port", defaultTestPort);
    return expect(spawnStub.args[0]).to.eql(["meteor", expectedSpawnArgs, getExpectedSpawnOptions(4096)]);
  });


  it("testPackages() - should spawn meteor with a package name argument",function() {
    meteor.testPackages({packages: [packageToTest]});
    expectedSpawnArgs.push("--port", defaultTestPort, packageToTest);
    return expect(spawnStub.args[0]).to.eql(["meteor",expectedSpawnArgs,getExpectedSpawnOptions(4096)]);
  });


  it("testPackages() - should spawn meteor with an absolute path to a --dir relative path",function() {
    meteor.testPackages({dir: '../todos'});
    expectedSpawnArgs.push("--port", defaultTestPort);
    return expect(spawnStub.args[0]).to.eql(["meteor",expectedSpawnArgs,getExpectedSpawnOptions(4096, null, null, path.resolve("../todos"))]);
  });

  it("testPackages() - should spawn meteor with an absolute path to a --dir absolute path",function() {
    meteor.testPackages({dir: path.resolve("../todos")});
    expectedSpawnArgs.push("--port", defaultTestPort);
    return expect(spawnStub.args[0]).to.eql(["meteor",expectedSpawnArgs,getExpectedSpawnOptions(4096, null, null, path.resolve("../todos"))]);
  });

  it("testPackages() - should spawn meteor with a ROOT_URL set to http://localhost:--port/",function() {
    const rootUrl = "http://localhost:5000/";
    meteor.testPackages({port: 5000});
    expectedSpawnArgs.push("--port", 5000);
    return expect(spawnStub.args[0]).to.eql(["meteor",expectedSpawnArgs,getExpectedSpawnOptions(5000, rootUrl)]);
  });


  it("testPackages() - should ignore env ROOT_URL",function() {
    process.env.ROOT_URL = "http://localhost:5000/";
    meteor.testPackages();
    expectedSpawnArgs.push("--port", defaultTestPort);
    return expect(spawnStub.args[0]).to.eql(["meteor",expectedSpawnArgs,getExpectedSpawnOptions(defaultTestPort)]);
  });


  it("testPackages() - should spawn meteor with a --settings argument",function() {
    meteor.testPackages({settings: "settings.json", packages: [packageToTest]});
    expectedSpawnArgs.push("--port", defaultTestPort, "--settings", "settings.json", packageToTest);
    return expect(spawnStub.args[0]).to.eql(["meteor",expectedSpawnArgs,getExpectedSpawnOptions(4096)]);
  });



  it("testPackages() - should spawn meteor with a --production argument",function() {
    meteor.testPackages({packages: [packageToTest], production: true});
    expectedSpawnArgs.push("--port", defaultTestPort, "--production", packageToTest);
    return expect(spawnStub.args[0]).to.eql(["meteor",expectedSpawnArgs,getExpectedSpawnOptions(4096)]);
  });



  it("testPackages() - should spawn meteor with a --release argument",function() {
    const releaseToTest = '0.9.0';
    meteor.testPackages({release: releaseToTest, packages: [packageToTest]});
    expectedSpawnArgs.push("--release", releaseToTest, "--port", defaultTestPort, packageToTest);
    return expect(spawnStub.args[0]).to.eql(["meteor",expectedSpawnArgs,getExpectedSpawnOptions(4096)]);
  });


  it("testPackages() - should spawn meteor with ROOT_URL set to --root-url",function() {
    const rootUrl = "http://test.meteor.com/";
    meteor.testPackages({"root-url": rootUrl, packages: [packageToTest]});
    expectedSpawnArgs.push("--port", defaultTestPort, packageToTest);
    expect(spawnStub.args[0]).to.eql(["meteor",expectedSpawnArgs,getExpectedSpawnOptions(4096, rootUrl)]);
    return expect(spawnStub.args[0][2].env.ROOT_URL).to.equal(rootUrl);
  });


  it("testPackages() - should ignore env MONGO_URL",function() {
    process.env.MONGO_URL = "mongodb://localhost/mydb";
    meteor.testPackages();
    delete process.env.MONGO_URL;
    expectedSpawnArgs.push("--port", defaultTestPort);
    return expect(spawnStub.args[0]).to.eql(["meteor",expectedSpawnArgs,getExpectedSpawnOptions(4096)]);
  });


  it("testPackages() - should spawn meteor with MONGO_URL set to --mongo-url",function() {
    const mongoUrl = "mongodb://localhost/mydb";
    meteor.testPackages({"mongo-url": mongoUrl, packages: [packageToTest]});
    expectedSpawnArgs.push("--port", defaultTestPort, packageToTest);
    expect(spawnStub.args[0]).to.eql(["meteor",expectedSpawnArgs,getExpectedSpawnOptions(4096, null, mongoUrl)]);
    return expect(spawnStub.args[0][2].env.MONGO_URL).to.equal(mongoUrl);
  });


  return it("kill() - should kill internal mongodb child processes", function(done){
    this.timeout(60000);
    spawnStub.restore();
    spawnStub = null;
    ChildProcess.prototype.child = null;

    meteor.testPackages({packages: [packageToTest]});

    return meteor.on("ready", () => {
      try {
        let timerId;
        const { pid } = meteor.childProcess.child;
        expect(meteor.mongodb.mongodChilds).to.have.length(1);
        const mongoPid = meteor.mongodb.mongodChilds[0].pid;
        expect(mongoPid).to.be.ok;
        meteor.kill();
        return timerId = setInterval(() => {
          try {
            return process.kill(mongoPid, 0);
          } catch (error) {
            // mondogb is dead
            clearInterval(timerId);
            return done();
          }
        }
        , 500);
      } catch (e1) {
        return done(e1);
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