"use strict";
/* global console */

var parser = null;

/** Generate parser */
d3.text("fsm_parser.pegjs", function(err, diff) {

  if (err) return document.write("Error reading parser");

  parser = PEG.buildParser(diff);

});


d3.select("#parse_button").on('click', () => {

  let engine = "dot";

  Promise
  .resolve (d3.select("#fsm_src").node().value)
  .then    ((src) => parser.parse(src))
  .catch   ((err) => alert(err))
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
    }
  })

});

function generate_dot (nodes) {
  let node_defs = nodes
    .map(node => node.id.string +
        ((node.type === "initial") ? " [peripheries=2]" : ""))
    .join("\n");

  let edge_defs = nodes
    .map(node => node.edges)
    .reduce(concat, [])
    .map(edge => edge.source.string + " -> " + 
                 edge.target.string + 
               ' [label="' + edge.symbol.string + '"]')
    .join("\n");

  return "digraph { \n" +
    node_defs + "\n" +
    edge_defs + "\n" +
  "}"
}

function render_dot (engine, dot) {

  let result = Viz(dot, { format:"svg", engine:engine });
  var newsvg = document.getElementById("svg-wrapper");

  newsvg.innerHTML = result;

}