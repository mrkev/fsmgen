"use strict";
/* global console, d3, PEG, alert, typecheck, Viz, concat */

/** Setup editor */
let editor = CodeMirror.fromTextArea(document.getElementById("fsm_src"), {
  lineWrapping: true,
  lineNumbers: true,
  styleActiveLine: true,
});

let errors = document.getElementById('errors'); // For error messages
let newsvg = document.getElementById("svg-wrapper"); // For putting the svg in

let clear = (id) => { /** Clears a node's children */
  let node = document.getElementById(id);
  while (node.lastChild) node.removeChild(node.lastChild);
}

var parser = null;
// let pegfile = "https://raw.githubusercontent.com/mrkev/fsmgen/master/fsm_parser.pegjs"
let pegfile = "fsm_parser.pegjs"

/** Generate parser */
d3.text(pegfile, function(err, diff) {
  if (err) return document.write("Error reading parser");
  parser = PEG.buildParser(diff);
});

var errmrk = [];

let notify_error = (err) => {
  // -1 because it's coordinates are 1 instead of 0 indexed, for readability
  let start = {line: err.location.start.line-1, ch: err.location.start.column-1}
  let end   = {line: err.location.end.line-1,   ch: err.location.end.column-1}
  errmrk.push(editor.markText(start, end, {className: "code_error"}));
  errors.textContent = err.message;
}

let clear_errors = () => {
  errmrk.forEach(marker => marker.clear())
  errmrk = [];
  errors.textContent = "";
}


d3.select("#parse_button").on('click', () => {

  let engine = "dot";

  clear_errors();
  clear('downloads');

  Promise
  .resolve (editor.getValue())
  .then    ((src) => parser.parse(src))
  .then    ((asa) => typecheck(asa)) // abstract syntax array
  .then    ((asa) => generate_dot(asa))
  .then    ((dot) => render_dot(engine, dot))
  .catch   ((err) => {
    if (err instanceof TypeError || err.name === "SyntaxError") {
      notify_error(err);
    }
    else {
      console.log(err.message);
      console.trace(err);
      alert(err);
    }
  });

});

function generate_dot (nodes) {

  let init = nodes.filter
    ((node) => node.type === "initial");

  let node_defs = []
  .concat(init
    .map(node => "__start__" + node.id.string + " [style=invis,fixedsize=true,height=0,width=0]"))
  .concat(nodes
    .map(node => node.id.string + (
        (node.type === "final") ? " [peripheries=2]" : "")))
  .join("\n");

  let edge_defs = []
  .concat(init
    .map((node) => "__start__" + node.id.string + " -> " + node.id.string))
  .concat(nodes
    .map(node => node.edges)
    .reduce(concat, [])
    .map(edge => edge.source.string + " -> " + 
                 edge.target.string + 
               ' [label=" ' + edge.symbol.string + ' "]'))
  .join("\n");

  return "digraph { \n" +
    node_defs + "\n" +
    edge_defs + "\n" +
  "}";
}

function render_dot (engine, dot) {

  let result = Viz(dot, { format:"svg", engine:engine });
  newsvg.innerHTML = result;

  var svgdl = document.createElement('button');
  svgdl.innerHTML = "download svg";
  svgdl.onclick = function () {
    download('data:image/svg+xml;utf8,'+unescape(result), 'fsm.svg', 'image/svg')
  }
  
  let pngdl = document.createElement('button');
  pngdl.innerHTML = "download png";
  let pngimg = Viz(dot, { format: "png-image-element", engine:engine });
  pngimg.setAttribute('id', 'pngimg');
  pngimg.setAttribute('hidden', 'hidden');
  downloads.appendChild(pngimg);
  pngdl.onclick = function () {
    download(document.getElementById('pngimg').getAttribute('src'), "fsm.png", "image/png");
  }

  if (is.not.chrome()) {
    pngdl.innerHTML = 'download png (chrome only)';
    pngdl.setAttribute('disabled', 'disabled');
    svgdl.innerHTML = "download svg (chrome only)";
    svgdl.setAttribute('disabled', 'disabled');
  }

  downloads.appendChild(svgdl);
  // png res is very low, let's acutally not allow png download
  // downloads.appendChild(pngdl);

}
