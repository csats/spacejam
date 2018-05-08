const { expect } = require('chai');
const puppeteer = require('puppeteer');

const args = [
    // error when launch(); No usable sandbox! Update your kernel
    '--no-sandbox',
    // error when launch(); Failed to load libosmesa.so
    '--disable-gpu',
    // freeze when newPage()
    '--single-process',
    // fix crash, @see https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#tips
    '--disable-dev-shm-usage',
];

class Puppeteer {
  constructor() {
    this.run = this.run.bind(this);
  }

  async run(url, options) {
    expect(url, "Invalid url").to.be.a('string');

    log.debug("Puppeteer.run()", arguments);
        this.browser = await puppeteer.launch({
            headless: true,
            args,
        });
        const page = await this.browser.newPage();
        await page.goto(url);

        let done = false;

        page.on('console', msg => console.log(msg.text()));

    return new Promise((resolve, reject) => {
        const interval = setInterval(async () => {
            if (done) {
                return;
            };

            done = await page.evaluate(function () {
                if (typeof TEST_STATUS !== "undefined" && TEST_STATUS !== null) { return TEST_STATUS.DONE; }
                if (typeof DONE !== "undefined" && DONE !== null) { return DONE; }
              return false;
            });

            if (done) {
              const failures = await page.evaluate(function () {
                    if (typeof TEST_STATUS !== "undefined" && TEST_STATUS !== null) { return TEST_STATUS.FAILURES; }
                    if (typeof FAILURES !== "undefined" && FAILURES !== null) { return FAILURES; }
                return false;
              });

              await this.browser.close();
              clearInterval(interval);

                failures ? reject(new Error('TEST FAILED')) : resolve();
            }
          }, 500);
    });
  }

  kill(){
    if (this.browser) {
        this.browser.close();
    }
  }
}

module.exports = Puppeteer;

