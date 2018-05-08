/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
Tinytest.add("success",test=> test.equal(true, true));

if (Meteor.isServer) {
  Tinytest.add("process.env.METEOR_TEST_PACKAGES is '1'",test=> test.equal(process.env.METEOR_TEST_PACKAGES, '1'));
}
