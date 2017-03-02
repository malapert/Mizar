require.config({
  baseUrl: "../src",
  name: "Mizar",
  include : ['Mizar'],
  insertRequire: ['Mizar'],
  out: "../build/generated/Mizar.min.js",
  optimize: "uglify2",
  onBuildWrite: function ( name, path, contents )
  {
    contents = contents
        .replace( /define\s*\([^{]*?{/, "" )
        .replace( /\s*return\s+[^\}]+(\}\);[^\w\}]*)$/, "" )
        .replace( /\}\);[^}\w]*$/, "" );

    return contents;
  },
  paths: {
    path          : "../node_modules/path/path",
    fits			    :	"../external/fits",
    "underscore-min" : "../node_modules/underscore/underscore-min",
    jquery		    :	"../external/jquery/dist/jquery.min",
    "jquery.ui"   : "../external/jquery-ui/jquery-ui",
    wcs           : "../external/wcs",
    //jquery		 : "empty:",
    proj4			    :	"../node_modules/proj4/dist/proj4",
    string		    :  "../node_modules/string/dist/string",
    glMatrix      :  "../external/glMatrix",
    gzip			    :	"../external/gzip.min",
  },
  shim: {
      "underscore-min" : {
        exports : '_',
        init : function() {
         return _.noConflict();
        }
      },
      jquery: {
        exports: "$"
      }
  }
});
