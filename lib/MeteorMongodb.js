/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const { expect } = require('chai');
const { EventEmitter } = require('events');
const ps = require('psext');

class MeteorMongodb extends EventEmitter {
  static initClass() {

    this.prototype.mongodChilds = [];

    this.prototype.killed = false;
  }

  constructor(meteorPid){
    super();
    this.meteorPid = meteorPid;
    log.debug("MeteorMongodb.constructor()", arguments);
    process.on('exit', code=> {
      log.debug(`MeteorMongodb.process.on 'exit': code=${code}`);
      return this.kill();
    });
    this.findAllChildren();
  }


  hasMongodb() {
    log.debug("MeteorMongodb.hasMongodb()");
    return this.mongodChilds.length > 0;
  }


  findAllChildren() {
    log.debug("MeteorMongodb.findAllChildren()", arguments);
    log.debug("@meteorPid", this.meteorPid);
    return ps.lookup({
      command: 'mongod',
      psargs: '-l',
      ppid: this.meteorPid
    }
    , (err, resultList )=> {
      this.mongodChilds = resultList;
      if (err) {
        return log.warn("spacjam: Warning: Couldn't find any mongod children:\n", err);
      } else if (resultList.length > 1) {
        return log.warn("spacjam: Warning: Found more than one mongod child:\n", resultList);
      } else {
        return log.debug("Found meteor mongod child with pid: ", resultList[0].pid);
      }
    });
  }


  kill() {
    log.debug("MeteorMongodb.kill() killed=", this.killed);

    if (this.killed) { return; }
    this.killed = true;

    let attempts = 1;

    let interval = null;

    const onInterval = () => {
      if (attempts <= 40) {
        let signal = 0;
        if (attempts === 1) {
          signal = "SIGTERM";
        } else if (attempts === 20) { //or attempts is 30
          signal = "SIGKILL";
        }
        try {
          for (var mongod of Array.from(this.mongodChilds)) {
            if ((mongod.dead == null)) {
              try {
                process.kill(mongod.pid, signal);
              } catch (e) {
                mongod.dead = true;
              }
            }
          }

          let allDead = true;
          for (mongod of Array.from(this.mongodChilds)) {
            if ((mongod.dead == null)) {
              allDead = false;
              return;
            }
          }
          if (allDead) {
            clearInterval(interval);
            this.emit("kill-done", null, this.mongodChilds);
          }
        } catch (error) {}
        return attempts++;
      } else {
        clearInterval(interval);
        log.error("spacejam: Error: Unable to kill all mongodb children, even after 40 attempts");
        return this.emit("kill-done", new Error("Unable to kill all mongodb children, even after 40 attempts"), this.mongodChilds);
      }
    };

    onInterval();
    return interval = setInterval(onInterval, 100);
  }
}
MeteorMongodb.initClass();


module.exports = MeteorMongodb;
