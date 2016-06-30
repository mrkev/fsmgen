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
  = _n type:state_type? _ "state" _ id:identifier _ "=" _
    edges:(edge)+ _ _n
  {
    var node = {
      id: id,
      edges: edges.map(function (e) {
        e.source = id;
        return e;
      })
    }

    if (type !== null) node.type = type;
    return node;
  }
  / _n type:state_type? _ "state" _ id:identifier _ _n
  {
    var node = {
      id: id,
      edges: []
    }
    if (type !== null) node.type = type;
    return node;
  }
  / _n "hell" _ "state" _ _n
  {
    return {
      id    : "Hell",
      edges : [],
      type  : "hell"
    }
  }

state_type
  = "initial" / "final"

_ "whitespace"
  = [ \t\n\r]*

_n "newlines"
  = [\n]*

edge
  = ("|" _ sym:symbol _ "->" _ id:identifier _)
  {
    return {
      symbol : sym,
      target : id
    }
  }

identifier
  = $0:[a-zA-Z_$]+ $1:[a-zA-Z0-9_$]*
    { // Each regex group is returned as a separate string
      // in an array; join them all.
      return new Identifier(location(), $0.join("") + $1.join(""));
    }

symbol
  = sym:[a-zA-Z0-9_$]+
    { return new Symbol(location(), sym.join("")); }


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