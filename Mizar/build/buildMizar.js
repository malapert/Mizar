({
	baseUrl: "../src",
	name: "../build/almond",
	include : ['Mizar'],
	out: "../build/generated/Mizar.min.js",
  optimize: "uglify2",
	wrap: {
        startFile: '../build/start.frag',
        endFile: '../build/end.frag'
    },
	paths: {
    fits			 :	"../external/fits",
		wcs				 :  "../external/wcs",
    glMatrix   :  "../external/glMatrix",
		gzip			 :	"../external/gzip.min",
		jquery     :  "../external/jquery/dist/jquery.min",
		"underscore-min" :  "../node_modules/underscore/underscore-min",
	},
	uglify2: {
        output: {
            beautify: false
        },
        compress: {
					unsafe: false,
					dead_code: false,
        },
        warnings: true,
        mangle: true
    }
})
