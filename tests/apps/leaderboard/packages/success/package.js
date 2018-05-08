Package.describe({
  summary: "success"
});

Package.onUse(function (api) {
  api.use(['ecmascript']);

  api.addFiles(['success.js'])
});

Package.onTest(function(api) {
  api.use(['ecmascript', 'tinytest', 'success']);

  api.addFiles('success-test.js');
});
