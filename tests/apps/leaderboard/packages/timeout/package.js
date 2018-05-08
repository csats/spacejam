Package.describe({
  summary: "timeout"
});

Package.onUse(function (api) {
  api.use(['ecmascript']);

  api.addFiles(['timeout.js'])
});

Package.onTest(function(api) {
  api.use(['ecmascript', 'tinytest', 'timeout']);

  api.addFiles('timeout-test.js');
});
