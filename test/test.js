var tap = require('tape');
var parser = require(__dirname + '/../parser.js');

tap('Sanity', (t) => {
  t.equal(typeof parser, 'function', 'Parser factory exported')
  t.end()
})

tap('Parser constructor defaults', (t) => {
  t.equal(typeof parser({}), 'function', 'Empty config object')
  t.equal(typeof parser(), 'function', 'No config object')
  t.end()
})

tap('Basics', (t) => {
  var fn = parser()('x,y'.split(','), 'x + y * x');
  t.equal(typeof fn, 'function', 'Parser returns a function')
  t.equal(fn.length, 2, 'Proper argument count');
  t.equal(typeof fn(2, 3), 'number', 'Result correct');
  t.end()
})

tap('Param sanitization', (t) => {
  t.equal(parser()('x, y', '0').length, 2, 'Convert comma-separated args to array');

  var noArged = parser()('2 + 3 * 4');
  t.equal(noArged.length, 0, 'Default no-args');
  t.equal(noArged(), 14, 'return value of no-arg is OK');

  t.end()
})

tap('Global vs local scope', (t) => {
  var glob = parser()('Math');
  t.equal(glob(), Math, 'Fall back into global scope');
  t.equal(parser()(['Math'], 'Math')(3), 3, 'Parameter overrides global');
  t.end();
})

tap('Fancy args', (t) => {
  t.equal(parser()('f', 'f(0)')(Math.sin), 0, 'Argument can be a function')
  t.end()
})

tap('Scope faking', (t) => {
  var cosParser = parser({ prefix: { 'cos': Math.cos, 'pi': Math.PI } });
  var fnTrig = cosParser('cos(pi)');
  t.equal(fnTrig(), -1, 'Result uses the scope provided');

  var scopeConflictFn = parser({ prefix: { a: 4 } })('a', 'a')
  t.equal(scopeConflictFn(3), 3, 'Parameter overrides scope')

  t.end()
});

tap('Regression', (t) => {
  var cosParser = parser({ prefix: { 'cos': Math.cos, 'pi': Math.PI } });
  var sevTrig = cosParser('pi + pi');
  t.equal(sevTrig(), 2 * Math.PI, 'Multiple occurrences prefixed')

  t.equal(cosParser('Math.cos(pi)')(), -1, 'Fake-scope keys work as keys');

  var partialMatch = cosParser('api, pib', 'api + pib');
  t.equal(partialMatch(1, 1), 2, 'Partial matches are not prefixed')
  t.end()
})


tap('Operators', (t) => {
  var powParser = parser({ prefix: { 'pow': Math.pow }, infix: { '^': 'pow' } });
  var fnPow = powParser('x', 'x^4');
  t.equal(fnPow(2), 16, 'Power operator processed');

  var spacedPow = powParser('x', 'x ^ 4');
  t.equal(spacedPow(2), 16, 'Spaced power processed');

  var bracedPow = powParser('(2 * 1)^(1 * (3 - 1))');
  t.equal(bracedPow(), 4, 'Power args can contain nested braces');

  var multiId = powParser('ax, bx', 'ax^bx');
  t.equal(multiId(2,3), 8, 'Power args can contain multiple chars');

  var fnPow = powParser('pow(2, pow(1, 1))^pow(2, 1)');
  t.equal(fnPow(), 4, 'Power args can be functions with multiple arguments')

  var multiOccurrence = powParser('2 ^ 2 ^ 2');
  t.equal(multiOccurrence(), 16, '2 chained operators work'); // FIXME power is right-associative

  var multiOccurrence = powParser('2 ^ 2 ^ 2 ^ 2');
  t.equal(multiOccurrence(), 256, '3 chained operators work');

  t.end()
});

tap('Array operators', (t) => {
  var vecParser = parser({
    prefix: { 'pow': Math.pow, 'add': add },
    infix: { '+': 'add'}
  });

  function add(a,b) { return [a[0] + b[0], a[1] + b[1]]; };
  var vecAdd45 = vecParser('x', 'x + [4, 5]');
  t.deepEqual(vecAdd45([1,2]), [5,7], 'Vector addition overloaded')

  t.end()
});

tap('Operator precedence', (t) => {
  var stringify = parser({
    prefix: {
      'times': (x, y) => x * y,
      'add': (x, y) => x + y,
      'pow': Math.pow
    },
    infix: { '+': 'add', '*': 'times', '^': 'pow'}
  });

  var saddt = stringify('x, y', 'x + y * x');
  t.equal(saddt(2,2), 6, 'Precedence: *, +');

  var saddt = stringify('x, y', 'x * y + x');
  t.equal(saddt(2,2), 6, 'Precedence: *, + inverted');

  var saddt = stringify('x, y', 'y * x ^ y');
  t.equal(saddt(2,2), 8, 'Precedence: *, ^');

  var saddt = stringify('x, y', 'y * (x + y)');
  t.equal(saddt(2,2), 8, 'Precedence with braces')

  t.end()
})

tap('Polymorphic functions', (t) => {
  var vecTimes = parser({
    prefix: {
      'times': (x, y) => {
        if (typeof x === 'number')
          if (typeof y === 'number')
            return x * y;
          else
            return y.map(v => v * x);
        else
          if (Array.isArray(y))
            return x.reduce((acc, v, i) => acc + v * y[i], 0);
          else
            return x.map(v => v * y)
      }
    },
    infix: { '*': 'times'}
  })('x,y', 'x*y');
  t.deepEqual(vecTimes(2, [1,2]), [2,4], 'left scalar');
  t.deepEqual(vecTimes([1,2], [3,4]), 11, 'dot');
  t.deepEqual(vecTimes([1,2], 2), [2,4], 'right scalar');
  t.deepEqual(vecTimes(10, 11), 110, 'arithmetic');
  t.end();
})
