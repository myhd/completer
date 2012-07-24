// This script will search layers for font information and show a list of fonts used
// TODO: Save font list to file
// Written by David Klawitter

/*
<javascriptresource>
<name>Completer Lite</name>
<category>Completer</category>
</javascriptresource>
*/


#target photoshop

main();

///////////////////////////////////////////////////////////////////////////
// Function: userFriendly
// Usage: Converts constants to user-friendly copy
// Input: string
// Return: a string
///////////////////////////////////////////////////////////////////////////
function userFriendly(obj) 
{
  if (obj == "TypeUnits.PIXELS")
    return "px";
  else if (obj == "TypeUnits.POINTS") {
    return "pt";
  } else {
    return obj;
  }
}

function findTextLayers(doc, foundLayers) {
  var layersCount = doc.layers.length;
  
  for (var layersIndex = 0; layersIndex < layersCount; layersIndex++) {
    var layerRef = doc.layers[layersIndex];

    if (layerRef.typename == "ArtLayer") {
      if (layerRef.visible && layerRef.kind == "LayerKind.TEXT") {
        var text = layerRef.textItem;
        foundLayers.push(text.font);
      }
    } else if (layerRef.typename == "LayerSet") {
      if (layerRef.visible) {
        findTextLayers(layerRef, foundLayers);
      }
    }
  }
}

function unique(array){
  var o = {},b = [];
  for(var i=0;i<array.length;i++){
     if(!o[array[i]]){
       b.push(array[i]);
       o[array[i]] = true;
     }
  }
  return b;
}

function main()
{
  var doc = app.activeDocument;
  var textLayers = new Array();
  
  findTextLayers(doc, textLayers)
   
  // Sort, remove duplicates and display results
  var sorted_arr = textLayers.sort();
  sorted_arr = unique(sorted_arr);
  
  sorted_arr.reverse();
  sorted_arr.push("Font Usage");
  sorted_arr.reverse();
  alert(sorted_arr.join('\n'));
}