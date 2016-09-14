"use strict";
/* global console, d3, PEG, alert, typecheck, Viz, concat */


let editor = CodeMirror.fromTextArea(document.getElementById("fsm_src"), {
  lineWrapping: true,
  lineNumbers: true,
  styleActiveLine: true,
});

var parser = null;

let pegfile = "https://raw.githubusercontent.com/mrkev/fsmgen/master/fsm_parser.pegjs"

/** Generate parser */
d3.text(pegfile, function(err, diff) {

  if (err) return document.write("Error reading parser");

  parser = PEG.buildParser(diff);

});


d3.select("#parse_button").on('click', () => {

  let engine = "dot";

  Promise
  .resolve (editor.getValue())
  .then    ((src) => parser.parse(src))
  .then    ((asa) => typecheck(asa)) // abstract syntax array
  .then    ((asa) => generate_dot(asa))
  .then    ((dot) => render_dot(engine, dot))
  .catch   ((err) => {
    if (err instanceof TypeError) {
      alert(err.message);
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
  var newsvg = document.getElementById("svg-wrapper");

  newsvg.innerHTML = result;

}
