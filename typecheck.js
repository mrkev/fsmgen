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
    super(m);
    this.location = loc;
  }
}

function typecheck (asa) {

  let defs = asa.map
    ((decl) => decl.id.string)
  let uses = asa.map
    ((decl) => decl.edges.map
      ((e) => [e.source.string, e.target.string]))
    .reduce(concat)
  .reduce(concat)
  .dedup()
  let init = asa.filter
    ((decl) => decl.type === "initial")

  // 1. No duplicate definitions
  if (defs.dedup().length !== defs.length)
    throw new TypeError({}, "Duplicate state definitions found.");

  // Note: this means defs.dedup() should be idempotent,
  // so we good with just using defs below

  // 2. No undeclared states
  if (!uses.subsetOf(defs))
    throw new TypeError({}, "Use of undeclared state found.")

  // 3. Exactly 1 initial state
  if (init.length > 2)
    throw new TypeError({}, "More than 1 initial state found.")

  return asa;
}