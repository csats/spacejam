Package.describe({
  name: "standalone-package",
  summary: "spacejam test - standalone package with passing tests",
  version: "0.9.5"
});

Package.onUse(function (api) {
  api.versionsFrom('0.9.0');

  api.use(['ecmascript', 'standalone-package-dep']);

  api.addFiles(['success.js'])
});

Package.onTest(function(api) {
  api.use(['ecmascript', 'tinytest', 'standalone-package']);

  api.addFiles('success-test.js');
});
