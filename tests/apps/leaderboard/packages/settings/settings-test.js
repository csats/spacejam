/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
Tinytest.add("settings",function(test){
  if (Meteor.isServer) {
    return test.equal(Meteor.settings.serverSetting, "server");
  } else {
    return test.equal(Meteor.settings.public.clientSetting, "client");
  }
});
