var forAllPackages = require('./lib/for_all_packages');
var packageUtils = require("./lib/package_utils");
var _ = require('lodash');

function makeFiles(type) {

  var i = 0;

  var exclude=[];
  var deps = {};

  function computeDependencies(package, doc) {

    if (exclude.indexOf(package) === -1) {

      try {

        // find latest version
        var latest_version = packageUtils.findLatestVersion(doc);

        if (doc.versions && doc.versions[latest_version]) {

          // build dependency object
          var dependencies;
          if (type !== "both") {
            dependencies = doc.versions[latest_version][type];
          } else {
            // create a merged list of both. we don't care about overwriting
            // some, since we just want a unique set of keys.
            dependencies = _.extend({},
              doc.versions[latest_version].dependencies,
              doc.versions[latest_version].devDependencies);
          }

          if (typeof deps[doc._id] === "undefined") {

            // add an entry even though there are no dependencies so that when
            // something else depends on it, we will have the count.
            deps[doc._id] = {
              dependents : [], dependents_count : 0
            };
          }

          if (dependencies) {


            // dependencies of this package
            var ds = Object.keys(dependencies);

            // for every dependency, go and add this package as a dependent.
            ds.forEach(function(dep) {
              if (deps[dep]) {
                if (deps[dep].dependents.indexOf(doc._id) == -1) {
                  deps[dep].dependents.push(doc._id);
                  deps[dep].dependents_count += 1;
                }
                // deps[dep][2].push(doc._id);
              } else {
                deps[dep] = {
                  dependents : [doc._id],
                  dependents_count : 1
                };
              }
            });
          }
        }

        i++;

        if (i % 500 === 0) {
          console.log("Processed " + i + " rows");
        }
      } catch(e) {
        console.log(package, e);
        exclude.push(package);
      }
    }
  }

  var visited_dict = {};

  function computeTransitiveDependents(name, visited) {

    if (name === "M") { debugger; }
    var row = deps[name];

    if (row.dependents_count === 0) {
      if (visited.indexOf(name) === -1) {
        console.log(name, "no children, unvisited +1");
        return 1;
      } else {
        console.log(name, "no children, visited 1");
        return 0;
      }
    } else {

      visited = visited.concat(row.dependents);

      var set = [], dep_row;
      for (var i = 0; i < row.dependents.length; i++) {
        var d = row.dependents[i];
        dep_row = deps[d];
        set = set.concat(dep_row.dependents);
      }
      set = _.uniq(set);
      console.log(name, "set: ", set);

      var sum = row.dependents_count;

      for(var j = 0; j < set.length; j++) {
        var s = set[j];
        visited << s;
        if (typeof visited_dict[s] !== "undefined") {
          console.log(s, "previously visited +", visited_dict[s]);
          sum = sum + visited_dict[s];
        } else {
          console.log(s, "UNVISITED, recursion party", visited);
          sum = sum + computeTransitiveDependents(s, visited);
        }
      }

      row.deep_dependent_count = sum;
      visited_dict[name] = sum;
      return sum;
    }
  }


  function computeTransientDependents2(name, pkg, visited) {
    if (typeof pkg === "undefined" || typeof pkg[2] === "undefined" || pkg[2].length === 0) {
      return 0;
    } else {

      // start off with length of deps.
      //
      // sum should be those packages, that are not already in visited
      var sum = 0;

      // for (var j = 0; j < pkg[2].length; j++) {
      //   if (visited.indexOf(pkg[2]) === -1) {
      //     sum += 1;
      //   }
      // }
      // var sum = pkg[2].length;

      visited.push(name); // you auto visit yourself!

      // visit each dependency, and aggregate its length of dependencies.
      for (var i = 0; i < pkg[2].length; i++) {
        var dependency = pkg[2][i];

        // only visit unvisited dependencies.
        if (visited.indexOf(dependency) === -1) {

          visited.push(dependency);

          // do we already have a cached version of this? if so, use it.
          if (typeof visited_dict[dependency] !== "undefined") {
            sum = sum + 1 + visited_dict[dependency][1];
            // visited.push(dependency);

          // else, traverse down.
          } else {
            var dep_pkg = deps[dependency];
            // visited.push(dependency);
            sum = sum + 1 + computeTransientDependents(dependency, deps[dependency], visited);
          }
        }
      }

      // cache the result
      console.log(name, visited);
      visited_dict[name] = [visited, sum];
      return sum;
    }
  }


  function transform(deps) {
    return function() {

      var rows = [];

      console.log(deps);
      // now that dependencies are computed, we need to compute the indirect
      // dependencies.
      Object.keys(deps).forEach(function(pkg) {
        if (deps[pkg].dependents_count === 0) {

          // nothing depends on this, so, nothing to do here.
          deps[pkg].deep_dependent_count = 0;
        } else {
          computeTransitiveDependents(pkg, []);
        }
      });

      console.log(visited_dict);

      // convert deps to csv
      Object.keys(deps).forEach(function(pkg) {
        rows.push([
          pkg, deps[pkg].dependents_count, deps[pkg].deep_dependent_count
        ]);
      });

      // computeTransitiveDependents("H", []);

      // Object.keys(deps).forEach(function(pkg) {
      //   rows.push([
      //     pkg, deps[pkg].dependents_count, deps[pkg].deep_dependent_count
      //   ]);
      // });

      return rows;
    };
  }

  forAllPackages(computeDependencies, "packages_" + type + ".csv", [
    ["package", "direct_dependents", "deep_dependent_count"]
  ], transform(deps));

}

makeFiles("dependencies");
// makeFiles("devDependencies");
// a combination of dev dependencies, and regular dependencies (the set of the union.)
// makeFiles("both");