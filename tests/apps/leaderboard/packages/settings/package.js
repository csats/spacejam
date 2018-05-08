Package.describe({
  summary: "settings"
});

Package.onUse(function (api) {
  api.use(['meteor', 'ecmascript']);

  api.addFiles(['settings.js'])
});

Package.onTest(function(api) {
  api.use(['meteor', 'ecmascript', 'tinytest', 'settings']);

  api.addFiles('settings-test.js');
});
