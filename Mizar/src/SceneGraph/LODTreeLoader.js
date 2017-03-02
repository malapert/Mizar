define(['./LODNode'], function (LODNode) {

    /**************************************************************************************************************/

    /**
     *    Parse a LOD node in the LODTree parser
     */
    var parseLODNode = function (elt, baseURI) {
        var node = new LODNode();

        var child = elt.firstElementChild;
        while (child) {
            switch (child.nodeName) {
                case "ModelPath":
                    node.modelPath = baseURI + child.textContent;
                    break;
                case "Center":
                    node.center = [parseFloat(child.getAttribute('x')), parseFloat(child.getAttribute('y')), parseFloat(child.getAttribute('z'))];
                    break;
                case "Radius":
                    node.radius = parseFloat(child.textContent);
                    break;
                case "MinRange":
                    node.minRange = parseFloat(child.textContent);
                    break;
                case "Node":
                    node.children.push(parseLODNode(child, baseURI));
                    break;
            }
            child = child.nextElementSibling;
        }

        return node;
    };

    /**************************************************************************************************************/

    /**
     *    Parse a LODTree
     */
    var parseLODTree = function (doc) {
        var rootElement = doc.documentElement;
        var baseURI = doc.documentURI.substr(0, doc.documentURI.lastIndexOf('/') + 1);

        // First parse tile
        var node = rootElement.getElementsByTagName('Node');
        if (node) {
            return parseLODNode(node[0], baseURI);
        }

        return null;
    };

    /**************************************************************************************************************/

    var loadLODTree = function (path, callback) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function (e) {
            if (xhr.readyState === 4 && xhr.status === 200) {
                var node = parseLODTree(xhr.responseXML);

                if (callback) {
                    callback(node);
                }
            }
        };

        xhr.open("GET", path);
        xhr.send();
    };

    /**************************************************************************************************************/

    return loadLODTree;

});
