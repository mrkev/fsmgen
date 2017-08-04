"use strict";
/* global console, d3, PEG, alert, typecheck, Viz, concat */

/** Setup editor */
const editor = CodeMirror.fromTextArea(document.getElementById("fsm_src"), {
  lineWrapping: true,
  lineNumbers: true,
  styleActiveLine: true,
});

const errors = document.getElementById('errors'); // For error messages
const newsvg = document.getElementById('svg-wrapper'); // For putting the svg in
const saves  = document.getElementById('saves');

const clear = (id) => { /** Clears a node's children */
  const node = document.getElementById(id);
  while (node.lastChild) node.removeChild(node.lastChild);
}

var parser = null;
const pegfile = "fsm_parser.pegjs"

/** Generate parser */
d3.text(pegfile, function(err, diff) {
  if (err) return document.write("Error reading parser");
  parser = PEG.buildParser(diff);
});

let errmrk = [];

const notify_error = (err) => {
  // -1 because it's coordinates are 1 instead of 0 indexed, for readability
  const start = {line: err.location.start.line-1, ch: err.location.start.column-1}
  const end   = {line: err.location.end.line-1,   ch: err.location.end.column-1}
  errmrk.push(editor.markText(start, end, {className: "code_error"}));
  errors.textContent = err.message;
}

const clear_errors = () => {
  errmrk.forEach(marker => marker.clear())
  errmrk = [];
  errors.textContent = "";
}

/** Saving */

const ls = window.localStorage;

function load_saves () {

  // if (ls.length === 0) {
  //   ls.setItem((new Date()).toISOString(), editor.getValue())
  // }

  // clear save buttons
  saves.innerHTML = '';

  // cerate old save buttons
  for (var i = ls.length-1; i > -1; i--) {
    const button = document.createElement('button');
    const li = document.createElement('li');
    li.innerHTML = ' [<a href="javascript:delete_save(' + "'" + ls.key(i) + "'" + ')">x</a>]';
    button.setAttribute("data-save", ls.getItem(ls.key(i)));
    button.innerHTML = ls.key(i);
    button.onclick = function (e) {
      editor.setValue(e.target.getAttribute('data-save'));
      clear_errors();
      clear('downloads');
      clear('svg-wrapper');
    }
    li.insertBefore(button, li.firstChild)
    saves.appendChild(li);
  }

  // create new save button
  const li_new     = document.createElement('li');
  const button_new = document.createElement('button');
  button_new.innerHTML = 'save as...';
  button_new.onclick = function () {
    const name = prompt("Save as:", new Date().toISOString());
    if (name == null) return;
    ls.setItem(name, editor.getValue());
    load_saves();
  }
  li_new.appendChild(button_new)
  saves.insertBefore(li_new, saves.firstChild)

}

function delete_save (key) {
  ls.removeItem(key);
  load_saves();
}

load_saves();


/** Main */

d3.select("#parse_button").on('click', () => {

  const engine = "dot";

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

  const init = nodes.filter
    ((node) => node.type.includes("initial"));

  const node_defs = []
  .concat(init
    .map(node => `__start__${node.id.string} [style=invis,fixedsize=true,height=0,width=0]`))
  .concat(nodes
    .filter(node => node.type.includes("final"))
    .map(node => `${node.id.string} [peripheries=2]`))
  .concat(nodes
    .filter(node => node.alias)
    .map(node => `${node.id.string} [label="${node.alias.string}"]`))
  .join("\n");

  const edge_defs = []
  .concat(init
    .map((node) => `__start__${node.id.string} -> ${node.id.string}`))
  .concat(nodes
    .map(node => node.edges)
    .reduce(concat, [])
    .map(edge => `${edge.source.string} -> ${edge.target.string}` + 
                 ` [label="${edge.symbol.string}"]`))
  .join("\n");

  return "digraph { \n" +
    node_defs + "\n" +
    edge_defs + "\n" +
  "}";
}

function render_dot (engine, dot) {

  const result = Viz(dot, { format:"svg", engine });
  newsvg.innerHTML = result;

  const svgdl = document.createElement('button');
  svgdl.innerHTML = "download svg";
  svgdl.onclick = function () {
    download('data:image/svg+xml;utf8,'+unescape(result), 'fsm.svg', 'image/svg')
  }
  
  const pngdl = document.createElement('button');
  pngdl.innerHTML = "download png";
  const pngimg = Viz(dot, { format: "png-image-element", engine });
  pngimg.setAttribute('id', 'pngimg');
  pngimg.setAttribute('hidden', 'hidden');
  downloads.appendChild(pngdl);
  pngdl.onclick = function () {
    Viz.svgXmlToPngBase64(result, 2, (err, data) => {
      if (err) return alert(err)
      download('data:image/png;base64,'+data, 'fsm.png', 'image/png')
    })
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
