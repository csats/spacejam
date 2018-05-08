const { expect } = require('chai');
const { EventEmitter } = require('events');
const puppeteer = require('puppeteer');

class Puppeteer extends EventEmitter {
  constructor(...args) {
    super(...args);
    this.run = this.run.bind(this);
  }

  run(url, options){
    expect(url, "Invalid url").to.be.a('string');

    log.debug("Puppeteer.run()", arguments);

    (async () => {
        this.browser = await puppeteer.launch();
        const page = await this.browser.newPage();
        await page.goto(url);

        let done = false;

        page.on('console', msg => console.log(msg.text()));

        const interval = setInterval(async () => {
            if (done) {
                return;
            };

            done = await page.evaluate(function () {
              if (typeof TEST_STATUS !== "undefined" && TEST_STATUS !== null) {
                return TEST_STATUS.DONE;
              }
              if (typeof DONE !== "undefined" && DONE !== null) {
                return DONE;
              }
              return false;
            });

            if (done) {
              const failures = await page.evaluate(function () {
                if (typeof TEST_STATUS !== "undefined" && TEST_STATUS !== null) {
                  return TEST_STATUS.FAILURES;
                }
                if (typeof FAILURES !== "undefined" && FAILURES !== null) {
                  return FAILURES;
                }
                return false;
              });

              await this.browser.close();
              clearInterval(interval);

              this.emit("exit", failures ? 2 : 0, 'foo');
            }
          }, 500);
    })();
  }

  kill(){
    if (this.browser) {
        this.browser.close();
    }
  }
}

module.exports = Puppeteer;

