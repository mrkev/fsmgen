// 1. No duplicate definitions
// 2. No undeclared states
// 3. No 2 initial states
// 
// TODO: 
// (Lots of things!)
// 1. Make each type of error more descriptive
// 2. Add token location to asa (<- possible?)
//    so we can have errors with line:column
//    coordinates
// 3. Do we need any more rules?

class ExtendableError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = (new Error(message)).stack;
    }
  }
}

class TypeError extends ExtendableError {
  constructor(loc, m) {
    super(loc.start + ": " + m);
    this.location = loc;
  }
}

function typecheck (asa) {

  let id_compare = (a, b) => a.string === b.string

  let defs = asa.map
    ((decl) => decl.id)

  let uses = asa.map
    ((decl) => decl.edges.map
      ((e) => [e.source, e.target]))
    .reduce(concat)
  .reduce(concat)
  .dedup(id_compare)

  let init = asa.filter
    ((decl) => decl.type === "initial")

  // 1. No duplicate definitions
  if (defs.dedup(id_compare).length !== defs.length)
    throw new TypeError({}, "Duplicate state definitions found.");

  // Note: this means defs.dedup() should be idempotent,
  // so we good with just using defs below

  // 2. No undeclared states
  let undef = uses.minus(defs, id_compare);
  if (undef.length > 0)
    throw new TypeError(undef[0].location, "Use of undeclared state " + undef[0].string + ".")

  // 3. Exactly 1 initial state
  if (init.length > 1)
    throw new TypeError(init[1].id.location, "More than 1 initial state found.")

  return asa;
}