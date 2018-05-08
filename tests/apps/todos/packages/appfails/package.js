Package.describe({
  summary: "appfails"
});

Package.onUse(function (api) {
  api.use(['ecmascript']);

  api.addFiles(['appfails.js']);
});

Package.onTest(function(api) {
  api.use(['ecmascript', 'tinytest', 'appfails']);

  api.addFiles('appfails-test.js');
});
