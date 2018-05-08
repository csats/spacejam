/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("underscore");
const { expect } = require('chai');
const ChildProcess = require('./ChildProcess');
const { EventEmitter } = require('events');
const path = require('path');
const phantomjs = require('phantomjs-prebuilt');

const DEFAULT_PATH = process.env.PATH;


class Phantomjs extends EventEmitter {
  constructor(...args) {
    super(...args);
    this.run = this.run.bind(this);
  }

  static initClass() {

    this.prototype.childProcess = null;
  }

  run(url, options, script, pipeClass, pipeClassOptions, useSystemPhantomjs){
    if (options == null) { options = '--load-images=no --ssl-protocol=TLSv1'; }
    if (script == null) { script = "phantomjs-test-in-console.js"; }
    if (pipeClass == null) { pipeClass = undefined; }
    if (pipeClassOptions == null) { pipeClassOptions = undefined; }
    if (useSystemPhantomjs == null) { useSystemPhantomjs = false; }
    log.debug("Phantomjs.run()", arguments);
    expect(this.childProcess,"ChildProcess is already running").to.be.null;
    expect(url, "Invalid url").to.be.a('string');
    expect(options, "Invalid options").to.be.a('string');
    expect(script, "Invalid script").to.be.a('string');
    if (pipeClass != null) { expect(pipeClass, "Invalid pipeClass").to.be.a('function'); }
    if (pipeClassOptions != null) { expect(pipeClassOptions, "Invalid pipeClassOptions").to.be.an('object'); }
    expect(useSystemPhantomjs, "Invalid useSystemPhantomjs").to.be.a('boolean');

    const env = _.extend(process.env, {ROOT_URL: url});

    log.debug(`script=${__dirname}/${script}`);
    const spawnArgs = options.split(' ');
    spawnArgs.push(script);
    log.debug('spawnArgs:', spawnArgs);
    const spawnOptions = {
      cwd: __dirname,
      detached: false,
      env
    };
    log.debug('spawnOptions:', spawnOptions);

    // Add phantomjs NPM package bin to PATH unless --use-system-phantomjs is passed
    if (useSystemPhantomjs) {
      process.env.PATH = DEFAULT_PATH;
    } else {
      process.env.PATH = path.dirname(phantomjs.path) + ':' + DEFAULT_PATH;
    }

    this.childProcess = new ChildProcess();
    this.childProcess.spawn("phantomjs", spawnArgs, spawnOptions, pipeClass, pipeClassOptions);

    return this.childProcess.child.on("exit", (code, signal) => {
      return this.emit("exit", code, signal);
    });
  }

  kill(signal){
    if (signal == null) { signal = "SIGTERM"; }
    log.debug("Phantomjs.kill()");
    return (this.childProcess != null ? this.childProcess.kill(signal) : undefined);
  }
}
Phantomjs.initClass();


module.exports = Phantomjs;

