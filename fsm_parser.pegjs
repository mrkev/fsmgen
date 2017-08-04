/*
 * Peg.js grammar definition for a
 * Finite State Machine diagram generator
 * ==========================
 *
 * Accepts definitions like:
 *
 * initial state q_0 =
 *   | 0 -> q_0
 *   | 1 -> q_1
 *
 * state q_1 =
 *   | 0 -> q_0
 *   | 1 -> q_1
 *
 */

{
  function Identifier (loc, string) {
    this.string = string;
    this.location = new Location(loc)
  }

  function Symbol (loc, string) {
    this.string = string;
    this.location = new Location(loc)
  }

  function Coordinate (coord) {
    this.offset = coord.offset;
    this.line = coord.line;
    this.column = coord.column;
  }

  Coordinate.prototype.toString = function () {
    return this.line + ":" + this.column;
  }

  function Location (loc) {
    this.start = new Coordinate(loc.start);
    this.end   = new Coordinate(loc.end);
  }

  Location.prototype.toString = function () {
    return "[" + this.start + " -> " + this.end + "]";
  };

}

defns
  = definition+

definition
  = _n type:state_types? _ "state" _ alias:alias? _ id:identifier _ "=" _
    edges:(edge)+ _ _n
  {
    var node = {
      id: id,
      edges: edges.map(function (e) {
        e.source = id;
        return e;
      }),
      type:[],
    }

    if (type !== null) node.type = type;
    if (alias !== null) node.alias = alias;
    return node;
  }
  / _n type:state_types? _ "state" _ alias:alias? _ id:identifier _ _n
  {
    var node = {
      id: id,
      edges: [],
      type: [],
    }
    if (type !== null) node.type = type;
    if (alias !== null) node.alias = alias;
    return node;
  }
/*  / _n "hell" _ "state" _ _n
  {
    return {
      id    : "Hell",
      edges : [],
      type  : "hell"
    }
  }
*/

alias
  = str:StringLiteral _ "as" { return {string:str} }

state_types
  = t1:"initial" _ t2:"final"   { return [t1, t2] }
  / t1:"final"   _ t2:"initial" { return [t1, t2] }
  / t1:"initial" { return [t1]}
  / t1:"final"   { return [t1]}

_ "whitespace"
  = [ \t\n\r]*

_n "newlines"
  = [\n]*

edge
  = "|" _ sym:symbol _ "->" _ id:identifier _
  {
    if (!sym) sym = "";
    return {
      symbol : sym,
      target : id
    }
  }
  / "|" _ str:StringLiteral _ "->" _ id:identifier _
  {
    if (!str) str = "";
    return {
      symbol : new Symbol(location(), str),
      target : id
    }
  }

identifier
  = $0:[a-zA-Z0-9_\-\~\!\?\%\*\+\^\$\/\;\:\(\)]+
    { 
      return new Identifier(location(), $0.join(""));
    }

symbol
  = sym:[a-zA-Z0-9_\-\~\!\?\%\*\+\^\$\/\;\:\(\)]+
    { // _ will signify an empty string
      var str = sym.join("");
      return new Symbol(location(), str === '_' ? '' : str);
    }

StringLiteral
  = '"' chars:DoubleStringCharacter* '"' { return chars.join(''); }
  / "'" chars:SingleStringCharacter* "'" { return chars.join(''); }

DoubleStringCharacter
  = !('"' / "\\") char:. { return char; }
  / "\\" sequence:EscapeSequence { return sequence; }

SingleStringCharacter
  = !("'" / "\\") char:. { return char; }
  / "\\" sequence:EscapeSequence { return sequence; }

EscapeSequence
  = "'"
  / '"'
  / "\\"
  / "b"  { return "\b";   }
  / "f"  { return "\f";   }
  / "n"  { return "\n";   }
  / "r"  { return "\r";   }
  / "t"  { return "\t";   }
  / "v"  { return "\x0B"; }
/*
 sym:([a-zA-Z0-9_$]+ / \".*\" / \'.*\')
 */
/**

state q_1 =
| a -> hello
| b -> world

Should parse to:

[
   {
      "id": {
         "string": "q_1",
         "location": {
            "start": {
               "offset": 6,
               "line": 1,
               "column": 7
            },
            "end": {
               "offset": 9,
               "line": 1,
               "column": 10
            }
         }
      },
      "edges": [
         {
            "symbol": {
               "string": "a",
               "location": {
                  "start": {
                     "offset": 14,
                     "line": 2,
                     "column": 3
                  },
                  "end": {
                     "offset": 15,
                     "line": 2,
                     "column": 4
                  }
               }
            },
            "target": {
               "string": "hello",
               "location": {
                  "start": {
                     "offset": 19,
                     "line": 2,
                     "column": 8
                  },
                  "end": {
                     "offset": 24,
                     "line": 2,
                     "column": 13
                  }
               }
            },
            "source": {
               "string": "q_1",
               "location": {
                  "start": {
                     "offset": 6,
                     "line": 1,
                     "column": 7
                  },
                  "end": {
                     "offset": 9,
                     "line": 1,
                     "column": 10
                  }
               }
            }
         },
         {
            "symbol": {
               "string": "b",
               "location": {
                  "start": {
                     "offset": 27,
                     "line": 3,
                     "column": 3
                  },
                  "end": {
                     "offset": 28,
                     "line": 3,
                     "column": 4
                  }
               }
            },
            "target": {
               "string": "world",
               "location": {
                  "start": {
                     "offset": 32,
                     "line": 3,
                     "column": 8
                  },
                  "end": {
                     "offset": 37,
                     "line": 3,
                     "column": 13
                  }
               }
            },
            "source": {
               "string": "q_1",
               "location": {
                  "start": {
                     "offset": 6,
                     "line": 1,
                     "column": 7
                  },
                  "end": {
                     "offset": 9,
                     "line": 1,
                     "column": 10
                  }
               }
            }
         }
      ]
   }
]

*/