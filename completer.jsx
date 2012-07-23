// This script will (eventually) apply each comp and then export to a PDF Presentation with overlays of font information
// Written by David Klawitter

#target photoshop

// General Settings
var selection_expansion = 5; // amount of pixels padding from text outlines
var text_size = 12; // description text size

main();

///////////////////////////////////////////////////////////////////////////
// Function: getVisibleTextLayers
// Usage: Does a recursive search of layers and collects all text layer references
//        in to a single array, layers.
// Input: ActiveDocument, Array
///////////////////////////////////////////////////////////////////////////
function getVisibleTextLayers(doc, layers) {
  var layersCount = doc.layers.length;
  
  for (var layersIndex = 0; layersIndex < layersCount; layersIndex++) {
    var layer = doc.layers[layersIndex];
    
    if (layer.visible) {
      if (layer.typename == "LayerSet") {
        getVisibleTextLayers(layer, layers);
      } else if (isTextLayer(layer)) {
        layers.push(layer);
      }
    }
  }
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
// Function: userFriendlyConstant
// Usage: Converts constants to user-friendly copy
// Input: string
// Return: a string
///////////////////////////////////////////////////////////////////////////
function userFriendlyConstant(obj) 
{
  if (obj == "TypeUnits.PIXELS")
    return "px";
  else if (obj == "TypeUnits.POINTS") {
    return "pt";
  } else {
    return obj;
  }
}


function positionLayer( lyr, x, y ){// layerObject, Number, Number
   // if can not move layer return
   if(lyr.iisBackgroundLayer||lyr.positionLocked) return
   // get the layer bounds
   var layerBounds = lyr.bounds;
   // get top left position
   var layerX = layerBounds[0].value;
   var layerY = layerBounds[1].value;
   // the difference between where layer needs to be and is now
   var deltaX = x-layerX;
   var deltaY = y-layerY;
   // move the layer into position
   lyr.translate (deltaX, deltaY);
}

function fillBehind( color ) { // Solidcoloe object
    var desc = new ActionDescriptor();
    desc.putEnumerated( charIDToTypeID( "Usng" ), charIDToTypeID( "FlCn" ), charIDToTypeID( "Clr " ) );
        var colorDesc = new ActionDescriptor();
        colorDesc.putUnitDouble( charIDToTypeID( "H   " ), charIDToTypeID( "#Ang" ), color.hsb.hue );
        colorDesc.putDouble( charIDToTypeID( "Strt" ), color.hsb.saturation  );
        colorDesc.putDouble( charIDToTypeID( "Brgh" ), color.hsb.brightness  );
    desc.putObject( charIDToTypeID( "Clr " ), charIDToTypeID( "HSBC" ) , colorDesc );
    desc.putUnitDouble( charIDToTypeID( "Opct" ), charIDToTypeID( "#Prc" ), 100.000000 );
    desc.putEnumerated( charIDToTypeID( "Md  " ), charIDToTypeID( "BlnM" ), charIDToTypeID( "Bhnd" ) );
    executeAction( charIDToTypeID( "Fl  " ), desc, DialogModes.NO );
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
  activeDocument.selection.expand(selection_expansion);
  activeDocument.selection.fill(fillColor, ColorBlendMode.NORMAL, 100, false);
}

function getFontDisplay(textItemRef) {
  return textItemRef.font + '\r' + Math.round(textItemRef.size) + ' ' + userFriendlyConstant(app.preferences.typeUnits) + '\r#' + textItemRef.color.rgb.hexValue.toLowerCase();
  }

function main()
{
  var layerCompsCount = activeDocument.layerComps.length;
  
  // Handle both cases where a doc has defined layer comps and also where it does not
  if (layerCompsCount > 0) {  
    alert('no support for comps yet');
    /*
    for (layerCompsIndex = 0; layerCompsIndex < layerCompsCount; layerCompsIndex++) {
      var textLayers = new Array();
      var layerCompRef = activeDocument.layerComps[layerCompsIndex];

      layerCompRef.apply();

      // Collect text layers for comp
      findTextLayers(app.activeDocument, textLayers);
    
      alert(textLayers);
    }*/  
  } else {
    var layers = new Array();
    getVisibleTextLayers(activeDocument, layers);

    var fillLayerRef = activeDocument.artLayers.add();
    fillLayerRef.name = "Hints background color";
    fillLayerRef.kind = LayerKind.NORMAL;
        
    for (layerIndex = 0; layerIndex < layers.length; layerIndex++) {
      layer = layers[layerIndex];
      
      // CREATE TEXT (HINT) LAYER
      var artLayerRef = activeDocument.artLayers.add();
      artLayerRef.kind = LayerKind.TEXT;
      
      // Set the contents of the text layer
      var textItemRef = artLayerRef.textItem;
      textItemRef.contents = getFontDisplay(layer.textItem);
      
      var textColor = new SolidColor();
      textColor.rgb.red = 255;
      textColor.rgb.green = 255;
      textColor.rgb.blue = 255;
      
      textItemRef.color = textColor;
      textItemRef.size = text_size;
      
      //artLayerRef.translate(500, 500); // move relative to it's original position
      positionLayer(artLayerRef, layer.bounds[0], layer.bounds[1]);
      activeDocument.activeLayer = fillLayerRef;
      fillLayer(artLayerRef);
      
      artLayerRef = null;
      textItemRef = null;
    }
  }
}