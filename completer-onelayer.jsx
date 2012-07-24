// This script will overlay the current text layer with a new text font information layer
// Based on work by David Klawitter, https://github.com/davidklaw/completer
// TODO better default font for label (pixel font?)
// TODO one-step-undo to pre-script state (how?)

#target photoshop

app.activeDocument.suspendHistory('Label Text Layer', 'main()');

function positionLayer(lyr, x, y) { // layerObject, Number, Number
    // if can not move layer return
    if (lyr.iisBackgroundLayer || lyr.positionLocked) return
    // get the layer bounds
    var layerBounds = lyr.bounds;
    // get top left position
    var layerX = layerBounds[0].value;
    var layerY = layerBounds[1].value;
    // the difference between where layer needs to be and is now
    var deltaX = x - layerX;
    var deltaY = y - layerY;
    // move the layer into position
    lyr.translate(deltaX, deltaY);
}

///////////////////////////////////////////////////////////////////////////
// Function: isTextLayer
// Usage: Determines whether or not the layer ref passed in is a text layer
// Input: ArtLayer
// Return: true if the layer is a text layer
///////////////////////////////////////////////////////////////////////////

function isTextLayer(layer) {
    if (layer.typename == "ArtLayer") {
        if (layer.kind == "LayerKind.TEXT") {
            return true;
        }
    }
    return false;
}

///////////////////////////////////////////////////////////////////////////
// Function: fillLayer
// Usage: Fills a document selection with color used bounds of the provided layer object
// Input: Layer
///////////////////////////////////////////////////////////////////////////
function fillLayer(layer) {
    // Determine the layer bounds
    var a = [layer.bounds[0], layer.bounds[1]];
    var b = [layer.bounds[2], layer.bounds[1]];
    var c = [layer.bounds[0], layer.bounds[3]];
    var d = [layer.bounds[2], layer.bounds[3]];
    // Fill the backing layer with background fill color
    var fillColor = new SolidColor();
    fillColor.rgb.red = 255;
    fillColor.rgb.green = 0;
    fillColor.rgb.blue = 0;
    //activeDocument.selection.select([[0,0], [50,0], [50,50], [0,50]], SelectionType.REPLACE, 0, false);
    activeDocument.selection.select([c, d, b, a], SelectionType.REPLACE, 0, false);
    activeDocument.selection.expand(3);
    activeDocument.selection.fill(fillColor, ColorBlendMode.NORMAL, 100, false);
}

function getFontDisplay(textItemRef) {
    return textItemRef.font + ' ' + Math.round(textItemRef.size) + ' #' + textItemRef.color.rgb.hexValue.toLowerCase(); // textItemRef.color.nearestWebColor.hexValue;
}

function main() {
    var doc = app.activeDocument;
    var currentLayer = doc.activeLayer;
    var run_time = Math.round(new Date().getTime() / 1000); // timestamp for layer name
    var layer = currentLayer;

    if (layer.visible) {
        if (isTextLayer(layer)) {
            //layers.push(layer);
        } else {
            alert('This script only works on selected text layers.');
            return false;
        }
    }

    // Create Background Layer

    var fillLayerRef = activeDocument.artLayers.add();
    fillLayerRef.name = "label_bg";
    fillLayerRef.kind = LayerKind.NORMAL;

    // Create Text (Hint) Layer
    var artLayerRef = activeDocument.artLayers.add();
    artLayerRef.kind = LayerKind.TEXT;
    var textItemRef = artLayerRef.textItem;
    textItemRef.contents = getFontDisplay(layer.textItem);
    var textColor = new SolidColor();
    textColor.rgb.red = 255;
    textColor.rgb.green = 255;
    textColor.rgb.blue = 255;
    textItemRef.color = textColor;
    textItemRef.size = 12;
    positionLayer(artLayerRef, layer.bounds[0], layer.bounds[1]);
    activeDocument.activeLayer = fillLayerRef;
    fillLayer(artLayerRef);

    // Create Layer Set And Move New Items There
    var layerSetRef = doc.layerSets.add();
    layerSetRef.name = "TextLabel (" + run_time + ")";
    fillLayerRef.move(layerSetRef, ElementPlacement.INSIDE);
    artLayerRef.move(layerSetRef, ElementPlacement.INSIDE);
    activeDocument.selection.deselect();

    // Merge layerSetRef to a pixel layer as we don’t need to edit it any more (!?)
    layerSetRef.merge();
}