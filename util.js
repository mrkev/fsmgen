'use strict';
/**
 * Utility functions.
 */

 /** Applies styles in an object to a d3 element */
var apply_style = function (acc, obj) {
  return Object.keys(obj).reduce(function (acc, key) {
    return acc.style(key, obj[key]);
  }, acc);
};

/** d3 canvas -> Options object -> appended d3 element */
window.appended_to = function (svg) {
  return function (obj) {
    return Object.keys(obj).reduce(function (acc, key) {
      if (key == 'append') return acc;
      if (key == 'call')   return acc.call(obj[key]);
      if (key == 'text')   return acc.text(obj[key]);
      if (key == 'style')  return apply_style(acc, obj[key]);
      return acc.attr(key, obj[key]);
    }, svg.append(obj.append));
  };
};

Array.ofsize = function(size) {
  return Array.apply(null, Array(size));
};

Array.prototype.sum = function () {
  return this.reduce(function (acc, x) { return acc + x; }, 0);
};

let concat = (a, b) => a.concat(b);
Array.prototype.dedup = function (comp) {
  return this.filter((x, i) => this.find(x, comp) === i);
};

/** Replacement for indexOf, with optional custom comparator */
Array.prototype.find = function (o, comp) {
  comp = comp || ((x, y) => x === y);
  for (var i = 0; i < this.length; i++) {
      if (comp(o, this[i])) return i;
  }
  return -1;
};
Array.prototype.subsetOf = function(arr, comp) {
  return this.filter((x) => arr.find(x, comp) < 0).length === 0;
};
Array.prototype.intersect = function(arr, comp) {
  return this.filter((x) => arr.find(x, comp) > -1);
};
Array.prototype.minus = function(arr, comp) {
  return this.filter((x) => arr.find(x, comp) < 0);
};
Array.prototype.repeats = function(comp) {
  return this.reduce((acc, x, i) =>
    (this.slice(0, i).find(x, comp) > -1 ?
      acc.concat(x) : acc), []);
}; // [1,2,1,2,2] -> [1,2,2]

Array.prototype.each = function(cb) {
  this.forEach(cb); return this;
};


