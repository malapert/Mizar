require.config({
  baseUrl: ".",
   paths: {
    "jasmine"   : ["lib/jasmine-2.5.0/jasmine"],
    "jasminehtml"  : ["lib/jasmine-2.5.0/jasmine-html"],
    "jasmineboot"  : ["lib/jasmine-2.5.0/boot"],
	path          : "mizar/node_modules/path/path",
    fits			    :	"mizar/external/fits",
    "underscore-min"    : "mizar/node_modules/underscore/underscore-min",
    jquery		    :	"mizar/external/jquery/dist/jquery.min",
    "jquery.ui"   : "mizar/external/jquery-ui/jquery-ui",
    wcs           : "mizar/external/wcs",
    //jquery		 : "empty:",
    proj4			    :	"mizar/node_modules/proj4/dist/proj4",
    string		    :  "mizar/node_modules/string/dist/string",
    glMatrix      :  "mizar/external/glMatrix",
    //string 		 : "empty:",
    //underscore :  "../external/underscore/underscore",
    //underscore : "empty:",
    //gzip : "empty:",
    //gzip			 :	"../node_modules/gzip-js/lib/gzip",
    gzip			    :	"mizar/external/gzip.min",
    //crc32			 :  "../node_modules/gzip-js/node_modules/crc32/lib/crc32",
    //deflate 	 :  "../node_modules/gzip-js/node_modules/deflate-js/lib/rawdeflate",
  },
 /*
  paths: {
    "jasmine"   : ["lib/jasmine-2.5.0/jasmine"],
    "jasminehtml"  : ["lib/jasmine-2.5.0/jasmine-html"],
    "jasmineboot"  : ["lib/jasmine-2.5.0/boot"],
    path       :  "mizar/node_modules/path/path",
    fits			 :	"mizar/external/fits",
    underscore :  "mizar/node_modules/underscore/underscore-min",
    jquery     :  "mizar/node_modules/jquery/dist/jquery.min",
    proj4			 :	"mizar/node_modules/proj4/dist/proj4",
    string		 :  "mizar/node_modules/string/dist/string",
    gzip			 :	"mizar/node_modules/gzip-js/lib/gzip",

  },*/
  shim: {
    'jasminehtml': {
      deps : ['jasmine']
    },
    'jasmineboot': {
      deps : ['jasmine', 'jasminehtml']
    },
    'underscore-min' : {
        exports : '_',
        init : function() {
         return _.noConflict();
        }
      }
      /*jquery: {
        exports: "$"
      },*/
  }
});
require(["jasmineboot"], function () {
  require(["spec/MizarBaseSpec","spec/MizarExtendedSpec","spec/MizarProjection"], function(){
    //trigger Jasmine
    window.onload();
  })
});
