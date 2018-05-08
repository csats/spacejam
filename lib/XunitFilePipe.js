/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const fs = require('fs');
const Pipe = require("./Pipe");

class XunitFilePipe extends Pipe {
  constructor(stdout, stderr, options){
    super();
    this.stdout = stdout;
    this.stderr = stderr;
    this.options = options;
    this.stdout.setEncoding("utf8");
    this.stderr.setEncoding("utf8");

    const outputFile = this.options.pipeToFile;
    const outputStream = fs.createWriteStream(outputFile, {
      flags: 'w',
      encoding: 'utf8'
    });

    this.stdoutBuffer = '';

    this.stdout.on("data", data=> {
      this.stdoutBuffer += data;
      const lines = this.stdoutBuffer.split('\n');
      if (lines.length === 1) { return; } // No complete lines received yet
      this.stdoutBuffer = lines.pop(); // Save last incomplete line in stdout buffer
      return Array.from(lines).map((line) =>
        line.indexOf('##_meteor_magic##xunit: ') === 0 ?
          outputStream.write(line.substr(24) + '\n')
        :
          process.stdout.write(line + '\n'));
    });

    this.stderr.on("data", data=> {
      return process.stderr.write(data);
    });
  }
}


module.exports = XunitFilePipe;
