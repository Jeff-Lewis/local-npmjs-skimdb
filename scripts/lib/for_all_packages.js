var fs = require('fs');
var csv = require('fast-csv');
var _ = require('lodash');

module.exports = function(fn, output, rows, transform) {
  fs.readdir('data/packages', function(err, files) {
    files.splice(files.indexOf(".gitkeep"), 1);

    files.forEach(function(f, idx) {
      //if (["underscore.json","backbone.json","async.json","lodash.json"].indexOf(f) !== -1) {
      var data = fs.readFileSync('data/packages/' + f);
      doc = JSON.parse(data).doc;

      var row = fn(f, doc);
      if (row) {
        // is result array of arrays?
        if (_.isArray(row[0])) {
          if (row[0].length > 0) {
            rows = rows.concat(row);
          }
        } else {
          if (row.length !== 0) {
            rows.push(row);
          }
        }
      }
      //}
    });

    if (transform) {
      rows = rows.concat(transform(rows));
    }

    console.log("writing file");

    csv.writeToPath("data/" + output, rows, {headers: true})
      .on('finish', function() {
        console.log("done");
      });
  });
};