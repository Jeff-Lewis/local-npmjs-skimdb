var semver = require('semver-utils');
var _ = require('lodash');
var semver = require('semver-utils');

module.exports = {
  findLatestVersion: function(doc) {
    // find latest version
    var latest_version, clearversions;
    if (doc["dist-tags"]) {
      latest_version = doc["dist-tags"].latest;
    } else {
      if (doc.time) {
        clearversions = _.remove(Object.keys(doc.time), function(x) {
          return !(x === 'created' || x === 'modified' || x === 'unpublished');
        });
        latest_version = clearversions[0];
      }
    }

    return latest_version;
  },

  findMaintainers: function(doc){
    // find maintainers
    var maintainers = [];
    if (doc.maintainers) {
      maintainers = doc.maintainers;
    } else if (doc.time && doc.time.unpublished && doc.time.unpublished.maintainers) {
      maintainers = doc.time.unpublished.maintainers;
    } else {
      maintainers = [];
    }

    return maintainers;
  },

  findNumberOfVersions: function(doc) {
    // find version numbers
    var num_versions;

    if (doc.versions) {
      num_versions = Object.keys(doc.versions).length;
    } else {

      var clearversions = _.remove(Object.keys(doc.time), function(x) {
        return !(x === 'created' || x === 'modified' || x === 'unpublished');
      });
      if (clearversions.length) {
        num_versions = clearversions.length;
      }
    }
    return num_versions;
  },

  getSemver: function(version) {
    var versem;
    if (version) {
      versem = semver.parse(version);
    } else {
      versem = { major : '', minor: '', patch: ''};
    }

    return versem;
  }
};