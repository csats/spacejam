/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require('./log');
const fs = require("fs");
const path = require("path");
const _ = require("underscore");
const { expect } = require("chai");
const Spacejam = require('./Spacejam');
const Meteor = require('./Meteor');

require.extensions['.txt'] = (module, filename)=> module.exports = fs.readFileSync(filename, 'utf8');


var CLI = (function() {
  let instance = undefined;
  CLI = class CLI {
    static initClass() {
  
      instance = null;
  
      this.prototype.commands = {
        "test" : "testApp",
        "test-packages" : "testPackages"
      };
    
      this.prototype.options = null;
  
      this.prototype.spacejam = null;
  
      this.prototype.pidPath = null;
    }

    static get() {
      return instance != null ? instance : (instance = new CLI());
    }

    constructor() {
      this.onProcessExit = this.onProcessExit.bind(this);
      this.spacejam = new Spacejam();
      log.debug("CLI.constructor()");
      process.on('SIGPIPE', code=> {
        log.info("spacejam: Received a SIGPIPE signal. Killing all child processes...");
        return (this.spacejam != null ? this.spacejam.killChildren() : undefined);
      });
    }
  //
  //    process.on 'SIGINT', (code)=>
  //      log.info "spacejam: exiting with code #{code}"
  //      @spacejam?.killChildren()


    onProcessExit(code){
      log.info(`spacejam: spacejam is exiting with code ${code}, deleting pid file.`);
      try {
        return fs.unlinkSync(this.pidPath);
      } catch (err) {
        log.trace(err);
        return log.error(`spacejam: Error deleting pid file ${this.pidPath}`, err);
      }
    }


    exec() {
      log.debug("CLI.exec()");
      expect(this.options, "You can only call CLI.exec() once").to.be.null;

      this.options = require("rc")("spacejam", {});

      const command = this.options._[0];
      log.debug(`command: ${command}`);
      if (command === 'help') {
        this.printHelp();
        process.exit(0);
      } else if (command === 'package-version') {
        const version = Meteor.getPackageVersion();
        console.log(version);
        process.exit(0);
      }

      if (!_.has(this.commands, command)) {
        if (command) { log.error(`spacejam: Error: \n'${command}' is not a recognized command\n`); }
        return this.printHelp();
      }

      this.options.packages = this.options._.slice(1);
      this.options.command = command;
      delete this.options._;

      log.debug("CLI.exec() options:", this.options);

      this.spacejam.on('done', code=> {
        let exitMsg;
        if (Spacejam.DONE_MESSAGE[code] != null) {
          exitMsg = `spacejam: ${Spacejam.DONE_MESSAGE[code]}. Exiting.`;
        } else {
          exitMsg = `spacejam: Unknown error with exit code '${code}'. Exiting.`;
        }
        log.error(exitMsg);
        return process.exit(code);
      });

      try {
        return this.spacejam.runTests(command, this.options);
      } catch (err) {
        console.trace(err);
        log.error("spacejam: Usage or initialization error. Exiting.");
        return process.exit(1);
      }
    }



    printHelp() {
      log.debug("CLI.printHelp()");
      return process.stdout.write(require('../bin/help.txt'));
    }
  };
  CLI.initClass();
  return CLI;
})();


module.exports = CLI;
