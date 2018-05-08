Package.describe({
  summary: "failure"
});

Package.onUse(function (api) {
  api.use(['ecmascript']);

  api.addFiles(['failure.js'])
});

Package.onTest(function(api) {
  api.use(['ecmascript', 'tinytest', 'failure']);

  api.addFiles('failure-test.js');
});
