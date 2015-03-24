var path = require('path');
var fs = require('fs');

var fuzzaldrin = require('fuzzaldrin');
var apd = require('atom-package-dependencies');
apd.install();
/**
**/
function intoSuggestions(obj){
  if(obj){
    return Object.keys(obj).map(function(dep){
      return {text: dep, rightLabel: obj[dep]};
    });
  }else {
    return [];
  }
}

var provider = {
  selector: '.source.js .string.quoted, .source.coffee .string.quoted',
  disableForSelector: '.source.js .comment, source.js .keyword',
  inclusionPriority: 1,
  getSuggestions: function(evObject){
    var lineText = evObject.editor.getTextInRange([[evObject.bufferPosition.row, 0], evObject.bufferPosition]);
    if(lineText.indexOf('require') === -1){
      return [];
    }

    var projectPath = atom.project.getPath();
    if (!projectPath) {
      return;
    }
    return new Promise(function(resolve, reject){
      var pckgPath = path.join(projectPath, 'package.json');
      fs.readFile(pckgPath, 'utf8', function(err, file){
        if (err) {
          return reject(err);
        }
	  	  var pckg = JSON.parse(file);

        var packages = intoSuggestions(pckg.dependencies);
        packages = packages.concat(intoSuggestions(pckg.devDependencies));
        packages.forEach(function(pkg){
          pkg.score = fuzzaldrin.score(pkg.text, evObject.prefix);
        });
        packages.sort(function(a,b){return b.score-a.score}); //package with highest score is first
        resolve(packages);
      })
    });
    // return null;
  }
};

var npmAutocomplete = {
  activate: function(state){
    // console.log('activate npm-autocomplete');
  },
  deactivate: function(){
    // console.log('deactivate');
  },
  provide: function(){
    // console.log('provide');
    return provider;
  }
};

module.exports = npmAutocomplete;
