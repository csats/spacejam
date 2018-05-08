/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
class Pipe {

  constructor(stdout, stderr){
    this.stdout = stdout;
    this.stderr = stderr;
    this.stdout.setEncoding("utf8");
    this.stderr.setEncoding("utf8");

    this.stdout.on("data", data=> {
      return process.stdout.write(data);
    });

    this.stderr.on("data", data=> {
      return process.stderr.write(data);
    });
  }
}

module.exports = Pipe;
