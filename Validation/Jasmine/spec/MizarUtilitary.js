define(['mizar/src/Mizar'], function(Mizar){
  var MizarUtilitary = function() {
  };

/******************************************************************************
 **************************** UTILITAIRES **************************************
 ******************************************************************************/
 /******************************************************************************/
 var mizar;
 var mizarCanvas;

 /**
  * Take a screenchot, and send it to server
  */
 function takeScreenshot(name, done) {
     // Get directly the image data from Mizar (Mizar is in charge of render)
     var dataURL = mizar.getImageData("MizarCanvas");
     var http = new XMLHttpRequest();
     var url = "/upload?name=" + name + ".png"
     http.open("POST", url, true);
     //Send the proper header information along with the request
     http.setRequestHeader("Content-type", "text/plain");
     //http.setRequestHeader("Content-length", params.length);
     http.onreadystatechange = function() { //Call a function when the state changes.
         if (http.readyState === 4) {
             expect(http.status === 200).toBeTruthy();
             done();
         }
     }
     http.send(dataURL);
 }

/**
 * Hack to avoid Math.round returning -0 on value between -0.5 and 0.5.
 */
Math.round = function(x) {
    return Math.floor(x + 0.5)
};
/******************************************************************************/
/**
 * Compute RMSE between two image data
 */
function computeRMSE(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    var length = a.length;
    var sum = 0.0;
    for (i = length; i -= 4;) {
        sum += (a[i] - b[i]) * (a[i] - b[i]);
        sum += (a[i + 1] - b[i + 1]) * (a[i + 1] - b[i + 1]);
        sum += (a[i + 2] - b[i + 2]) * (a[i + 2] - b[i + 2]);
    }
    sum /= (length * 0.75);
    return Math.sqrt(sum);
}
/******************************************************************************/
/**
 * Flip the image data, needed because webgl vertical orientation is different from 2D canvas
 */
function flipImageData(imgData) {
    // Flip to be compliant with webgl
    var data = imgData.data;
    for (var y = 0; y < imgData.height / 2; y++) {
        var yUp = y * imgData.width * 4;
        var yDown = (imgData.height - y - 1) * imgData.width * 4;
        for (var x = 0; x < imgData.width * 4; x++) {
            var tmp = data[yUp + x];
            data[yUp + x] = data[yDown + x];
            data[yDown + x] = tmp;
        }
    }
}
/******************************************************************************/
/**
 * Get image data from an Image element
 */
function getImageData(img) {
    var offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = img.width;
    offscreenCanvas.height = img.height;
    var context = offscreenCanvas.getContext('2d');
    context.drawImage(img, 0, 0);
    var imgData = context.getImageData(0, 0, img.width, img.height);
    return imgData;
}
/******************************************************************************/
/**
 * Create a canvas from an image data
 */
function createCanvasFromImageData(imgData) {
    var canvas = document.createElement('canvas');
    canvas.width = imgData.width;
    canvas.height = imgData.height;
    var context = canvas.getContext('2d');
    context.putImageData(imgData, 0, 0);
    return canvas;
}

function isClose(actual,expected,precision) {
	if (precision !== 0) {
		precision = precision || 2;
	}
	return Math.abs(expected - actual) < (Math.pow(10, -precision) / 2);
}

/******************************************************************************/
/**
 * Custom image matcher from image comparison
 */
var customMatchers = {

	toBeCloseTo: function(util, customEqualityTesters){
    return {
		compare: function(actual, expected, precision) {
				if (Array.isArray(actual) && Array.isArray(expected)
					&& actual.length == expected.length) {

					var ok = true;
					for (var i=0; i<actual.length; i++) {
						ok = ok && isClose(actual[i], expected[i], precision)
					}
					return {
						pass: ok
					};
				} else {
					return {
						pass: isClose(actual, expected, precision)
					};
				}
			}
		};
	},

    toImageDiffEqual: function(util, customEqualityTesters) {
        return {
            compare: function(excepted, actual) {
                var i, dif;
                var rmse = computeRMSE(actual.data, excepted.data);
                var result = rmse < 4;
                if (!result) {
                    var table = document.createElement("table");
                    //table = document.body.appendChild(table);
                    table.innerHTML = "<tr><th>Reference</th><th>Snapshot</th><th>Difference (RMSE=%1)</th></tr>".replace("%1", rmse)
                    var row = document.createElement("tr");
                    table.appendChild(row);
                    // The ref image
                    var td = document.createElement("td");
                    row.appendChild(td);
                    td.appendChild(createCanvasFromImageData(excepted));
                    // The generated image
                    td = document.createElement("td");
                    row.appendChild(td);
                    td.appendChild(createCanvasFromImageData(actual));
                    // the diff image
                    var min = 255;
                    var max = 0;
                    for (i = 0; i < excepted.data.length; i++) {
                        if (i % 4 !== 3) {
                            diff = Math.abs(excepted.data[i] - actual.data[i]);
                            if (diff < min) {
                                min = diff;
                            }
                            if (diff > max) {
                                max = diff;
                            }
                        }
                    }
                    diff = new Uint8ClampedArray(excepted.width * excepted.height * 4);
                    var scale = 255 / (max - min);
                    for (i = 0; i < diff.length; i++) {
                        if (i % 4 !== 3) {
                            diff[i] = scale * Math.abs(excepted.data[i] - actual.data[i]);
                        } else {
                            diff[i] = 255;
                        }
                    }
                    td = document.createElement("td");
                    row.appendChild(td);
                    td.appendChild(createCanvasFromImageData(new ImageData(diff, excepted.width, excepted.height)));
                    return {
                        pass: false,
                        message: table
                    };
                } else {
                    return {
                        pass: true
                    };
                }
            }
        }
    }
};
/******************************************************************************/
/**
 * Helper function to compare a reference image
 */
 MizarUtilitary.compareImage = function(name, timeout, done) {
    setTimeout(function() {
        var refImg = new Image();
        refImg.onerror = function() {
            takeScreenshot(name, done);
        };
        refImg.src = "/ref/" + name + ".png";
        refImg.onload = function() {

            // Get the canvas
            if (mizar) {
              mizar.render();
            }
            var canvas = document.getElementById("MizarCanvas");
            // Get data from the canvas
            var gl = canvas.getContext('webgl');
            var pixelValues = new Uint8Array(canvas.width * canvas.height * 4);
            gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixelValues);
            var snapshot = new ImageData(new Uint8ClampedArray(pixelValues.buffer), canvas.width, canvas.height);
            console.log("Snapshot = ",snapshot);
            flipImageData(snapshot);
            // Get data from reference image
            var refImageData = getImageData(refImg);
            // Compare image
            expect(refImageData).toImageDiffEqual(snapshot);
            done();
        };
    }, timeout);
}
/******************************************************************************/
/**
 * Take an object, round all the number in this object, return it
 */
function roundedObject(pObject) {
    var lObject = {};
    for (var lKey in pObject) {
        lObject[lKey] = pObject[lKey];
        if (!isNaN(lObject[lKey])) {
            lObject[lKey] = Math.round(lObject[lKey]);
        }
    }
    return lObject;
}
/******************************************************************************
 **************************** TEST LAUNCHER ************************************
 ******************************************************************************/
/**
 * Test a simple function
 *
 * @param : pTestCases : All the variables used to test a function (see test below for example)
 * @param : pFunctionTest : The function to test
 * @param : pCheckCallback : The callaback use to check if the test conclude, return the object to test with the pTestCases.out
 */
function executeTest(pTestCases, pFunctionTests, pCheckCallback) {
    for (var lKey in pTestCases) {
        var lTest = pTestCases[lKey];
        lTest.test = lTest.test ? lTest.test : "toEqual";
        pFunctionTests(lTest.in);
        expect(pCheckCallback())[lTest.test](lTest.out);
    }
}
/******************************************************************************/
var LoggingLevel = {
    ERROR: "Error",
    HIGH_WARNING: "High Warning",
    WARNING: "Low Warning",
    INFORMATION: "Information",
    NONE: undefined
};
/**
 * Test a method for a error
 *
 * @param : pDone : When the test is finished
 * @param : pObjectToListen : The object on which we want to test error
 * @param : pTestCases : All the variables used to test a function (see test below for example)
 */
function executeErrorRaiseTest(pDone, pObjectToListen, pTestCases, pFunctionTests) {
    executeListenerTest(pDone, pObjectToListen, "error", pTestCases, pFunctionTests, function(pData) {
        return pData.code;
    });
}
/******************************************************************************/
/**
 * Init Mizar_Lite before each test, clean the worker
 */
  MizarUtilitary.initMizar = function(pDone) {
    jasmine.addMatchers(customMatchers);
    if (mizar) {
        mizar.dispose();
        document.body.removeChild(mizarCanvas);
    }
    mizarCanvas = document.createElement("canvas");
    mizarCanvas.id = "MizarCanvas";
    mizarCanvas.width = "400";
    mizarCanvas.height = "400";
    document.body.appendChild(mizarCanvas);

    // Create Mizar
    mizar = new Mizar({
        canvas: "MizarCanvas"
    });
    return mizar;
  }

  MizarUtilitary.setMizar = function(pMizar) {
    mizar = pMizar;
  }
  
  MizarUtilitary.prepareMizar = function() {
    jasmine.addMatchers(customMatchers);
    try {
      document.body.removeChild(mizarCanvas);
    } catch (e) {
      // Nop
    }

    mizarCanvas = document.createElement("canvas");
    mizarCanvas.id = "MizarCanvas";
    mizarCanvas.width = "400";
    mizarCanvas.height = "400";
    document.body.appendChild(mizarCanvas);
  }

  MizarUtilitary.initGlobe = function() {

   var planetContext = mizar.ContextFactory.create(mizar.CONTEXT.Planet,{mode:"3d"});
 	var bmLayer = mizar.LayerFactory.create(
					mizar.LAYER.WMS,
					{ baseUrl : "http://demonstrator.telespazio.com/wmspub",
					  layers  : "BlueMarble,esat"
					});
	planetContext.setBaseImagery( bmLayer );

	var elevationLayer = mizar.LayerFactory.create(
		mizar.LAYER.WCSElevation,
		{ baseUrl:"http://demonstrator.telespazio.com/wcspub", coverage: "GTOPO", version: "1.0.0"});
	planetContext.setBaseElevation( elevationLayer );
  };

  MizarUtilitary.addJSONFile = function() {
      // Add some vector layer
      $.ajax({
        url: "mizar/examples/geojson/europe.json",
        success: function(data) {
			var vectorLayer = mizar.LayerFactory.create(mizar.LAYER.Vector,{
				style : mizar.DrawingFactory.createFeatureStyle({
					fillColor: [1.,1.,1.,1.],
					strokeColor: [1.,0.,0.,1.],
					fill: false
				})
			});
            vectorLayer.addFeatureCollection(data);
            mizar.addPlanetLayer( vectorLayer );
        }
    });
  }
// Goto http://localhost:3000/Specrunner.html?spec=Home to select wich test to launch
describe("Home", function() {});


return MizarUtilitary;

});
