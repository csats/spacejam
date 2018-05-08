/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require('./log');
const { expect } = require('chai');
const _ = require("underscore");
const ChildProcess = require('./ChildProcess');
const { EventEmitter } = require('events');
const MeteorMongodb = require("./MeteorMongodb");
const glob = require("glob");
const fs = require("fs");
const path = require("path");

class Meteor extends EventEmitter {
  constructor(...args) {
    super(...args);
    this.runTestCommand = this.runTestCommand.bind(this);
    this.hasStartedMongoDBText = this.hasStartedMongoDBText.bind(this);
    this.hasErrorText = this.hasErrorText.bind(this);
    this.hasReadyText = this.hasReadyText.bind(this);
  }

  static initClass() {

    this.prototype.childProcess = null;

    this.prototype.buffer ={
      stdout:"",
      stderr:""
    };

    this.prototype.options = null;

    this.prototype.mongodb = null;
  }

  defaultOptions() {
    return {
      "dir": ".",
      "port": 4096,
      "packages": [],
      "driver-package": "test-in-console",
      "meteor-ready-text": "=> App running at:",
      "meteor-error-text": "Waiting for file change."
    };
  }


  static getPackageVersion() {
    log.debug("Meteor.getPackageVersion()");
    if (!fs.existsSync('package.js')) {
      throw new Error("Missing package.js in current working directory.");
    }
    require('./PackageJSStubs');
    require(`${process.cwd()}/package.js`);
    expect(Package.description != null ? Package.description.version : undefined).to.be.a('string').that.is.ok;
    return Package.description.version;
  }


  getTestArgs(command, options){
    log.debug("Meteor.getTestArgs()", options);
    expect(+options.port, "options.port is not a number.").to.be.ok;
    expect(options.packages, "options.packages is not an array of package names").to.be.an('array');

    const args = [
      command,
      '--driver-package',
      options['driver-package']
    ];
    if (options.release) { args.push(["--release", options.release]); }
    args.push(["--port", options.port]);
    if (options.settings) { args.push(["--settings", options.settings]); }
    if (options.production) { args.push("--production"); }

    if (options.mocha != null) {
      options["driver-package"] = "practicalmeteor:mocha-console-runner";
    }


    if (options["root-url"] == null) { options["root-url"] = `http://localhost:${options.port}/`; }

    if (command === 'test') {
      if (options["test-app-path"]) { args.push(['--test-app-path'], options["test-app-path"]); }
      if (options["full-app"]) { args.push(['--full-app']); }
    } else if (command === 'test-packages') {
      if (options.packages.length > 0) {
        const packagesToTest = this._globPackages(options.packages);
        expect(packagesToTest).to.have.length.above(0);
        args.push(packagesToTest);
      }
    }

    // Flatten args because we are adding arrays to args
    return _.flatten(args);
  }



  testPackages(options){
    if (options == null) { options = {}; }
    log.debug("Meteor.testPackages()", arguments);
    return this.runTestCommand("test-packages", options);
  }

  testApp(options){
    if (options == null) { options = {}; }
    log.debug("Meteor.testApp()", arguments);
    return this.runTestCommand("test", options);
  }

// => Exited with code:
  // => Your application has errors. Waiting for file change.
  // => Your application is crashing. Waiting for file change.
  // => Modified -- restarting.
  // => App running at: http://ronenvm:3000/
  // => Meteor server restarted
  // => Errors prevented startup:

  // @options
  // @parseCommandLine
  runTestCommand(command, options){
    if (options == null) { options = {}; }
    log.debug("Meteor.runTestCommand()", arguments);
    expect(options, "options should be an object.").to.be.an("object");
    expect(this.childProcess, "Meteor's child process is already running").to.be.null;

    this.options = _.extend(this.defaultOptions(), options);

    log.debug('meteor options:', this.options);

    const cwd = path.resolve(this.options.dir);

    log.debug(`meteor cwd=${cwd}`);

    expect(this.options['driver-package'], "options.driver-package is missing").to.be.ok;

    const args = this.getTestArgs(command, this.options);

    log.debug('meteor args=', args);

    const env = _.clone(process.env);
//   So packages will know they're running in the context of test-packages.
//   Not really a good practice, but sometimes just unavoidable.
    env.METEOR_TEST_PACKAGES='1';
    env.ROOT_URL = this.options["root-url"];
    if (this.options["mongo-url"]) {
      env.MONGO_URL = this.options["mongo-url"];
    } else {
      if (env.MONGO_URL != null) { delete env.MONGO_URL; }
    }

    options = {
      cwd,
      env,
      detached: false
    };

    this.childProcess = new ChildProcess();

    this.childProcess.spawn("meteor",args,options);

    this.childProcess.child.on("exit", (code,signal) => {
      return this.emit("exit",code,signal);
    });

    this.childProcess.child.stdout.on("data", data => {
      this.buffer.stdout += data;
      this.hasStartedMongoDBText(data);
      this.hasErrorText(data);
      return this.hasReadyText(data);
    });

    return this.childProcess.child.stderr.on("data", data => {
      this.buffer.stderr += data;
      return this.hasErrorText(data);
    });
  }


  // TODO: Test
  _globPackages(packages){ // Use glob to get packages that match the packages arg
    log.debug("Meteor._globPackages()",arguments);
    expect(packages,"@packages should be and array").to.be.an("array");

    const pkgsFolder = process.cwd() + '/packages';

    const globOpts = {
      cwd: pkgsFolder
    };

    const matchedPackages = [];

    packages.forEach(pkgArg=> {
      if (pkgArg.indexOf(':') > 0) {
        // It's a package name in the new format, we'll add it as is
        // TODO: Support globs for this too, by looking up package names inside package.js
        return matchedPackages.push(pkgArg);
      } else if (pkgArg.indexOf('/') >= 0) {
        // It's a path to a package, we'll add it as is too
        // TODO: Support globs for this too
        return matchedPackages.push(pkgArg);
      } else {
        // It's a package name, let's find matching package names, if it includes wildcards
        const globedPackages = glob.sync(pkgArg, globOpts);
        if (globedPackages.length > 0) {
          return globedPackages.forEach(pkg=> matchedPackages.push(pkg));
        } else {
          log.warn(`spacjam: Warning: No packages matching ${pkgArg} have been found. Will add it to the meteor command line anyway, in case it's in METEOR_PACKAGE_DIRS.`);
          // TODO: Support globs in METEOR_PACKAGE_DIRS too.
          return matchedPackages.push(pkgArg);
        }
      }
    });

    return matchedPackages;
  }


  hasStartedMongoDBText(buffer){
    if (buffer.lastIndexOf('Started MongoDB') !== -1) {
      this.mongodb = new MeteorMongodb(this.childProcess.child.pid);
      return this.emit("mongodb ready");
    }
  }


  hasErrorText(buffer){
    if (buffer.lastIndexOf( this.defaultOptions()["meteor-error-text"] ) !== -1) {
      return this.emit("error");
    }
  }


  hasReadyText(buffer){
    if (buffer.lastIndexOf( this.defaultOptions()["meteor-ready-text"] ) !== -1) {
      return this.emit("ready");
    }
  }


  hasMongodb() {
    log.debug("Meteor.hasMongodb()");
    if (this.mongodb) { return this.mongodb.hasMongodb(); }
    return false;
  }


  // TODO: Test
  kill(signal){
    if (signal == null) { signal = "SIGTERM"; }
    log.debug("Meteor.kill()", arguments, "@childProcess?=", (this.childProcess != null), "@mongodb?=", (this.mongodb != null));
    if (this.childProcess != null) {
      this.childProcess.kill(signal);
    }
    return (this.mongodb != null ? this.mongodb.kill() : undefined);
  }
}
Meteor.initClass();

module.exports = Meteor;
