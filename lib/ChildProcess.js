/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require('./log');
const { expect } = require("chai");
const Pipe = require("./Pipe");
const path = require('path');

class ChildProcess {
  static initClass() {

    // Design for testability - so we can spy on them / stub them in tests
    this._spawn = require("child_process").spawn;
    this._exec = require("child_process").exec;

    this.prototype.child = null;

    this.prototype.descendants = [];

    this.prototype.pipe  = null;

    this.prototype.command = null;

    this.prototype.killed = false;
  }

  constructor() {
    log.debug("ChildProcess.constructor()");
  }

  exec(command, options, cb){
    log.debug("ChildProcess.exec()", arguments);
    expect(this.child).to.be.null;
    expect(command).to.be.a('string').that.is.ok;
    if (options != null) { expect(options).to.be.an('object'); }

    this.command = command.split(' ', 1)[0];
    expect(this.command).to.be.a('string').that.is.ok;

    const innerCB = (err, stdout, stderr) => {
      this.killed = true;
      if ((err != null ? err.code : undefined) != null) {
        log.error(`child_process.exec: Error: ${this.command} exit code: ${err.code}`);
      }
      if ((err != null ? err.signal : undefined) != null) {
        log.error(`child_process.exec: Error: ${this.command} termination signal: ${err.signal}`);
      }
      if (cb != null) { return cb(err, stdout, stderr); }
    };

    if (options != null) {
      this.child = ChildProcess._exec(command, options, innerCB);
    } else {
      this.child = ChildProcess._exec(command, innerCB);
    }

    this.child.stdout.pipe(process.stdout);
    return this.child.stderr.pipe(process.stderr);
  }


  spawn(command, args, options, pipeClass, pipeClassOptions){
    if (args == null) { args = []; }
    if (options == null) { options = {}; }
    if (pipeClass == null) { pipeClass = undefined; }
    if (pipeClassOptions == null) { pipeClassOptions = undefined; }
    log.debug("ChildProcess.spawn()", command, args);

    expect(this.child,"ChildProcess is already running").to.be.null;
    expect(command,"Invalid @command argument").to.be.a("string");
    expect(args,"Invalid @args argument").to.be.an("array");
    expect(options,"Invalid @options").to.be.an("object");
    if (pipeClass != null) { expect(pipeClass, "Invalid pipeClass").to.be.a('function'); }
    if (pipeClassOptions != null) { expect(pipeClassOptions, "Invalid pipeClassOptions").to.be.an('object'); }

    this.command = path.basename(command);

    log.info(`spacejam: spawning ${this.command}`);

    process.on('exit', code=> {
      log.debug(`ChildProcess.process.on 'exit': @command=${this.command} @killed=${this.killed} code=${code}`);
      return this.kill();
    });

    this.child = ChildProcess._spawn(command, args, options);

    if (pipeClass) {
      this.pipe = new pipeClass(this.child.stdout, this.child.stderr, pipeClassOptions);
    } else {
      this.pipe = new Pipe(this.child.stdout, this.child.stderr);
    }

    return this.child.on("exit", function(code, signal){
      log.debug(`ChildProcess.process.on 'exit': @command=${this.command} @killed=${this.killed} code=${code} signal=${signal}`);
      this.killed = true;
      if (code != null) {
        return log.info(`spacejam: ${command} exited with code: ${code}`);
      } else if (signal != null) {
        return log.info(`spacejam: ${command} killed with signal: ${signal}`);
      } else {
        return log.error(`spacejam: ${command} exited with arguments: ${arguments}`);
      }
    }.bind(this));
  }


  kill(signal){
    if (signal == null) { signal = "SIGTERM"; }
    log.debug(`ChildProcess.kill() signal=${signal} @command=${this.command} @killed=${this.killed}`);
    if (this.killed) { return; }
    log.info("spacejam: killing", this.command);
    this.killed = true;
    try {
      // Providing a negative pid will kill the entire process group,
      // i.e. the process and all it's children
      // See man kill for more info
      //process.kill(-@child.pid, signal)
      return (this.child != null ? this.child.kill(signal) : undefined);

    } catch (err) {
      return log.warn(`spacejam: Error: While killing ${this.command} with pid ${this.child.pid}:\n`, err);
    }
  }
}
ChildProcess.initClass();


module.exports = ChildProcess;
