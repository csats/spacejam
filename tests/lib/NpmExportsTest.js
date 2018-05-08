/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const chai = require("chai");
const { expect } = chai;

describe("main", () =>
  it("should export all public classes",function() {
    const npmExports = require("../../lib/main");
    expect(npmExports).to.be.an('object');
    expect(npmExports.Spacejam).to.be.a('function');
    expect(npmExports.Meteor).to.be.a('function');
    return expect(npmExports.Phantomjs).to.be.a('function');
  })
);
