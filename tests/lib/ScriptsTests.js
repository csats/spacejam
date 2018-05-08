/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const { expect } = require("chai");
const ChildProcess = require('../../lib/ChildProcess');
const path = require('path');
const _ = require('underscore');

describe("scripts", function() {

  const spacejamBinDir = path.resolve(__dirname, "../../bin");
  const meteorStubDir = path.resolve(__dirname, "../bin");

  let child = null;

  let execOptions = null;

  const validateExpectedEnv = (env, expectedEnv)=>
    (() => {
      const result = [];
      for (let name in expectedEnv) {
        const value = expectedEnv[name];
        result.push(expect(env[name], `process.env.${name}`).to.equal(value));
      }
      return result;
    })()
  ;

  // The meteor stub process prints out a json with the command
  // line and env it was executed with. We verify it is what
  // we expected
  const execRun = function(done, args, expectedArgs, expectedEnv){
    if (expectedEnv == null) { expectedEnv = {}; }
    return child.exec(`${spacejamBinDir}/mrun ${args}`, execOptions, (err, stdout, stderr)=> {
      try {
        expect(err).to.be.null;
        const output = JSON.parse(stdout);
        const actualArgs = output.argv.slice(2).join(' ');
        expect(actualArgs).to.deep.equal(expectedArgs);
        validateExpectedEnv(output.env, expectedEnv);
        return done();
      } catch (error) {
        err = error;
        return done(err);
      }
    });
  };

  const execTestPackages = function(done, args, expectedArgs, expectedEnv){
    if (expectedEnv == null) { expectedEnv = {}; }
    const cmdLine = `${spacejamBinDir}/mtp ${args}`;
    return child.exec(cmdLine, execOptions, (err, stdout, stderr)=> {
      try {
        expect(err).to.be.null;
        const output = JSON.parse(stdout);
        const actualArgs = output.argv.slice(2).join(' ');
        expectedEnv.METEOR_TEST_PACKAGES = '1'; // This should always exist.
        if (expectedEnv.PORT == null) { expectedEnv.PORT = '3100'; } // Env vars are strings
        if (expectedEnv.ROOT_URL == null) { expectedEnv.ROOT_URL = 'http://localhost:3100/'; }
        expectedArgs = `test-packages --port ${expectedEnv.PORT} ${expectedArgs}`;
        expect(actualArgs).to.deep.equal(expectedArgs);
        validateExpectedEnv(output.env, expectedEnv);
        return done();
      } catch (error) {
        err = error;
        return done(err);
      }
    });
  };

  beforeEach(function() {
    const childEnv = _.clone(process.env);
    childEnv.PATH = `${meteorStubDir}:${childEnv.PATH}`;
    delete childEnv.PORT;
    delete childEnv.ROOT_URL;
    delete childEnv.MONGO_URL;
    delete childEnv.METEOR_SETTINGS_PATH;
    delete childEnv.METEOR_APP_HOME;
    delete childEnv.METEOR_TEST_PACKAGES;
    delete childEnv.TEST_PORT;
    delete childEnv.TEST_ROOT_URL;
    delete childEnv.TEST_MONGO_URL;
    delete childEnv.TEST_METEOR_SETTINGS_PATH;

    execOptions =
      {env: childEnv};

    return child = new ChildProcess();
  });

  afterEach(function() {
    try {
      return (child != null ? child.kill('SIGTERM') : undefined);
    } finally {
      child = null;
    }
  });

  describe("mrun", function() {

    it("should launch meteor with the provided command line arguments", done=> execRun(done, '--port 4000', '--port 4000'));

    it("should launch meteor with --settings $METEOR_SETTINGS_PATH", function(done){
      const settingsPath = __dirname + '/settings.json';
      execOptions.env.METEOR_SETTINGS_PATH = settingsPath;
      const expectedArgs = `--settings ${settingsPath} --port 4000`;
      return execRun(done, '--port 4000', expectedArgs);
    });

    return it("should cd to and run meteor in $METEOR_APP_HOME", function(done){
      const settingsPath = __dirname + '/settings.json';
      execOptions.env.METEOR_APP_HOME = path.resolve(__dirname, '../apps/leaderboard');
      const expectedArgs = "--port 4000";
      const expectedEnv =
        {PWD: execOptions.env.METEOR_APP_HOME};
      return execRun(done, '--port 4000', expectedArgs, expectedEnv);
    });
  });

  return describe("mtp", function() {

    it("should launch meteor with --port 3100 and set ROOT_URL to 'http://localhost:3100/' by default", done=>
      execTestPackages(
        done,
        '--production',
        '--production'
      )
    );

    it("should launch meteor with --port $TEST_PORT, set PORT to $TEST_PORT and ROOT_URL to 'http://localhost:$TEST_PORT/'", function(done){
      execOptions.env.TEST_PORT = 3200;
      const expectedEnv = {
        PORT: '3200', // Env vars are strings
        ROOT_URL: 'http://localhost:3200/'
      };
      return execTestPackages(
        done,
        '--production',
        '--production',
        expectedEnv
      );
    });

    it("should launch meteor with ROOT_URL set to TEST_ROOT_URL", function(done){
      execOptions.env.TEST_PORT = 3300;
      execOptions.env.TEST_ROOT_URL = 'https://myvm/';
      const expectedEnv = {
        PORT: '3300',
        ROOT_URL: 'https://myvm/'
      };
      return execTestPackages(
        done,
        '--production',
        '--production',
        expectedEnv
      );
    });

    it("should launch meteor with MONGO_URL set to TEST_MONGO_URL", function(done){
      execOptions.env.TEST_MONGO_URL = 'mongodb://user:pass@mongohq.com/testdb';
      const expectedEnv =
        {MONGO_URL: execOptions.env.TEST_MONGO_URL};
      return execTestPackages(
        done,
        '--production',
        '--production',
        expectedEnv
      );
    });

    it("should launch meteor with --settings $METEOR_SETTINGS_PATH", function(done){
      const settingsPath = __dirname + '/settings.json';
      execOptions.env.METEOR_SETTINGS_PATH = settingsPath;
      return execTestPackages(
        done,
        '--release 1.0',
        `--settings ${settingsPath} --release 1.0`
      );
    });

    return it("should launch meteor with --settings $TEST_METEOR_SETTINGS_PATH", function(done){
      const settingsPath = __dirname + '/test-settings.json';
      execOptions.env.TEST_METEOR_SETTINGS_PATH = settingsPath;
      return execTestPackages(
        done,
        '--release 1.0',
        `--settings ${settingsPath} --release 1.0`
      );
    });
  });
});
