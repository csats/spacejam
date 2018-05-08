
global.Package = {
  description: null,

  describe(options) {
    Package.description = options;
  },

  onUse(f) {
  },

  on_use(f) {
  },

  onTest(f) {
  },

  on_test(f) {
  },

  registerBuildPlugin(options) {
  },

  _transitional_registerBuildPlugin(options) {
  },

  includeTool() {
  }
};


global.Npm = {
  depends(_npmDependencies) {
  },

  strip(discards) {
  },

  require(name) {
  }
};


global.Cordova = {
  depends(_cordovaDependencies) {
  }
};
