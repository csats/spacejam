/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const chai = require("chai");
const { expect } = chai;
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const path = require("path");
const Spacejam = require('../../lib/Spacejam');


describe("Spacejam", function() {
  this.timeout(60000);

  let spacejam = null;

  before(function() {});

  beforeEach(function() {
    delete process.env.PORT;
    delete process.env.ROOT_URL;
    delete process.env.MONGO_URL;
    delete process.env.METEOR_PACKAGE_DIRS;

    return spacejam = new Spacejam();
  });

  return afterEach(() => spacejam = null);
});
