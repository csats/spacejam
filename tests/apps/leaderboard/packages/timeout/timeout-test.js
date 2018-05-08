/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
Tinytest.addAsync("timeout",(test, onComplete)=> test.equal(true, true));
  // Never call onComplete so test will timeout
