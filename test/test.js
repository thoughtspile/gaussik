var assert = require('assert');
var parser = require(__dirname + '/parser.js');


assert(parser instanceof Function, 'Parser factory exists');

// plain parsing and defaults
var plain = parser({}, {});
assert(plain instanceof Function, 'Parser instance is a funciton');

var fn = plain('x + y * x', 'x,y'.split(','));
assert(fn instanceof Function, 'Parser outputs a function');
assert(fn.length === 2, 'Proper argument count');
assert(fn(2, 3) === 8, 'Result correct');

var commaArged = plain('0', 'x, y');
assert(commaArged.length === 2, 'Comma-separated args processed');

var noArged = plain('2 + 3 * 4');
assert(noArged.length === 0, 'Default no-args');
assert(noArged() === 14, 'Def no-args result OK');

var higher = plain('f(0)', ['f']);
assert(higher(Math.sin) === 0, 'Higher order OK');

var glob = plain('Math');
assert(glob() === Math, 'global scope accessed');

var globalConflictFn = plain('Math', ['Math']);
assert(globalConflictFn(3) === 3, 'Local overrides global');

// Scope faking
var cosParser = parser({ 'cos': Math.cos, 'pi': Math.PI}, {});
var fnTrig = cosParser('cos(pi)', []);
assert(fnTrig() === -1, 'Scope faked');
var sevTrig = cosParser('pi + pi');
assert(sevTrig() == 2 * Math.PI, 'Multiple occurrences replaced')

var manualPrefix = cosParser('Math.cos(pi)');
assert(manualPrefix() == -1, 'Key preserved');

var partialMatch = cosParser('api + pib', 'api, pib');
assert(partialMatch(1, 1) == 2, 'Partial matches preserved')

var scopedParser = parser({'a': 4});
var scopeConflictFn = scopedParser('a', 'a');
assert(scopeConflictFn(3) === 3, 'Local overrides scope');


// Deinfixing
var powParser = parser({'pow': Math.pow}, { '^': 'pow' });
var fnPow = powParser('x^4', ['x']);
assert(fnPow(2) === 16, 'Power operator processed');
var spacedPow = powParser('x ^ 4', ['x']);
assert(spacedPow(2) === 16, 'Power with spaces processed');
var bracedPow = powParser('(2 * 1)^(1 * (3 - 1))', []);
assert(bracedPow() === 4, 'Nested braces OK');
var multiId = powParser('ax^bx', 'ax, bx');
assert(multiId(2,3) === 8, 'Multi-char id captured');
var fnPow = powParser('pow(2, pow(1, 1))^pow(2, 1)');
assert(fnPow() == 4, 'functions exponentiated')
