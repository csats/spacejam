/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require('./log');
const { expect } = require("chai");
const _ = require("underscore");
const { EventEmitter } = require('events');
const Meteor = require("./Meteor");
const Phantomjs = require("./Phantomjs");
const Puppeteer = require("./Puppeteer");
const XunitFilePipe = require('./XunitFilePipe');


var Spacejam = (function() {
  let instance = undefined;
  Spacejam = class Spacejam extends EventEmitter {
    static initClass() {

      instance = null;

      this.prototype.meteor = null;

      this.prototype.waitForMeteorMongodbKillDone = false;

      this.prototype.phantomjs = null;

      this.prototype.doneCode = null;

      this.prototype.childrenKilled = false;

      this.DONE = {
        TEST_SUCCESS: 0,
        TEST_FAILED: 2,
        METEOR_ERROR: 3,
        TEST_TIMEOUT: 4,
        ALREADY_RUNNING: 5,
        CLIENT_ERROR: 6
      };

      this.DONE_MESSAGE = [
        "All tests have passed",
        "Usage error",
        "Some tests have failed",
        "meteor is crashing server side",
        "Total timeout for tests has been reached",
        "spacejam is already running",
        "Unhandled error in meteor client side code"
      ];
    }

    static get() {
      return instance != null ? instance : (instance = new Spacejam());
    }

    defaultOptions() {
      return {
        'phantomjs-script': 'phantomjs-test-in-console.js',
        'phantomjs-options': '--load-images=no --ssl-protocol=TLSv1'
      };
    }

    constructor() {
      super();
      this.onMeteorMongodbKillDone = this.onMeteorMongodbKillDone.bind(this);
      log.debug("Spacejam.constructor()");
    }


    runTests(command, options){
      let err;
      if (options == null) { options = {}; }
      log.debug("Spacejam.testPackages()", options);
      expect(options).to.be.an("object");
      expect(command).to.be.a("string");
      if (options.timeout != null) { expect(options.timeout).to.be.a('number'); }
      if (options['crash-spacejam-after'] != null) { expect(options['crash-spacejam-after']).to.be.a('number'); }

      expect(this.meteor, "Meteor is already running").to.be.null;

      this.options = _.extend(this.defaultOptions(), options);
      log.debug(this.options);

      try {
        this.meteor = new Meteor();
        this.phantomjs = new Puppeteer();
      } catch (error) {
        err = error;
        console.trace(err);
        this.emit("done", 1);
        return;
      }


      this.meteor.on("exit", function(code){
        log.debug("Spacejam.meteor.on 'exit':", arguments);
        this.meteor = null;
        if (code) {
          return this.killChildren(Spacejam.DONE.METEOR_ERROR);
        }
      }.bind(this));

      this.meteor.on("mongodb ready", () => {
        log.info("spacejam: meteor mongodb is ready");
        this.waitForMeteorMongodbKillDone = true;
        return this.meteor.mongodb.on("kill-done", this.onMeteorMongodbKillDone);
      });

      this.meteor.on("ready", () => {
        log.info("spacejam: meteor is ready");

        const scriptArgs = '';
        const pipeClass = null;
        const spawnOptions = {};

        return this.runPhantom();
      });

      this.meteor.on("error", () => {
        log.error("spacejam: meteor has errors");
        if (!this.options.watch) { return this.killChildren(Spacejam.DONE.METEOR_ERROR); }
      });

      try {
        this.meteor.runTestCommand(command, this.options);
      } catch (error1) {
        err = error1;
        console.trace(err);
        this.emit("done", 1);
        return;
      }

      if ((this.options.timeout != null) && (+this.options.timeout > 0)) {
        setTimeout(() => {
          log.error(`spacejam: Error: tests timed out after ${options.timeout} milliseconds.`);
          return this.killChildren( Spacejam.DONE.TEST_TIMEOUT );
        }
        , +options.timeout);
      }

      if ((this.options['crash-spacejam-after'] != null) && (+this.options['crash-spacejam-after'] > 0)) {
        return setTimeout(() => {
          throw new Error("Testing spacejam crashing.");
        }
        , +options['crash-spacejam-after']);
      }
    }


    runPhantom() {
      let pipeClass, pipeClassOptions;
      log.debug("Spacejam.runPhantom()");
      expect(this.phantomjs).to.be.ok;
      expect(this.meteor.options["root-url"]).to.be.ok;
      expect(this.options["phantomjs-options"]).to.be.ok;
      expect(this.options["phantomjs-script"]).to.be.ok;

      let url = this.meteor.options["root-url"];

      if (this.options['xunit-out'] != null) {
        url += 'xunit';
        pipeClass = XunitFilePipe;
        pipeClassOptions = {pipeToFile: this.options['xunit-out']};
      } else {
        url += 'local';
      }

      this.phantomjs.on("exit", (code, signal)=> {
        this.phantomjs = null;
        if (this.meteor != null) {
          this.meteor.kill();
        }
        if (code != null) {
          return this.done(code);
        }
      });

      return this.phantomjs.run(url, this.options['phantomjs-options'], this.options['phantomjs-script'], pipeClass, pipeClassOptions, (this.options['use-system-phantomjs'] != null));
    }


    onMeteorMongodbKillDone() {
      log.debug("Spacejam.onMeteorMongodbKillDone()", this.doneCode);
      return this.emit("done", this.doneCode);
    }


    //Kill all running child_process instances
    killChildren(code){
      if (code == null) { code = 1; }
      log.debug("Spacejam.killChildren()",arguments);
      expect(code,"Invalid exit code").to.be.a("number");

      if (!this.childrenKilled) {
        if (this.meteor != null) {
          this.meteor.kill();
        }
        if (this.phantomjs != null) {
          this.phantomjs.kill();
        }
      }
      this.childrenKilled = true;
      return this.done(code);
    }


    done(code){
      log.debug("Spacejam.done()", arguments);
      expect(code, "Invalid done code").to.be.a("number");

      log.debug(`Spacejam.done() @meteor?=${this.meteor != null}`);
      this.waitForMeteorMongodbKillDone = this.meteor != null ? this.meteor.hasMongodb() : undefined;
      log.debug(`Spacejam.done() @waitForMeteorMongodbKillDone=${this.waitForMeteorMongodbKillDone}`);
      if (!this.waitForMeteorMongodbKillDone) { this.emit("done", code); }
      log.debug('Spacejam.done() waiting for mongodb to exit before calling done');
      return this.doneCode = code;
    }
  };
  Spacejam.initClass();
  return Spacejam;
})();


module.exports = Spacejam;
