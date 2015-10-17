# Gaussik is a tiny math parser

About 1K non-minified, non-gzipped. Processes the input string with regular expressions (not a single AST!) to allow calling math functions without object prefixes. Rewrites specified infix operators into function calls to allow for `x^y` exponentiation. Outputs a callable js function that runs almost as fast as native code. Highly configurable. Nice, minimal API. Runs in browser and in node.

## Disclaimers:

- _Garbage in -- garbage out._ No input validation. When an invalid string is supplied, the paser may crash on compilation. Wrap with try / catch.
- _Limited infix operator support._ All operators have the same precedence and are left-associative.
- _No default configuration._ See this API for useful setups.
- _(Almost) no sugar._ Processing only affects scoping and infix operators. `sin x` for function application and `x y` for product are invalid.
- _String literals may go wrong._ Processing also affects them.

## API guide

- `parser(scope, infix)` creates a parser instance. Properties of the `scope` object can be accessed as globals in the input. Any `key` in `infix` object is converted into `infix[key](arg1, arg2)`. Returns a function. Both arguments are optional and default to empty objects. Examples:
```
var parseReal = parser(Math, {'^': 'pow'});
var parseCos = parser({cos: Math.cos}, {});
var plainParse = parser();
var arithmParse = parser({}, {'^': pow})
```
- `<parser instance>(expr, args)` converts `expr` string into a js function with argument order specified with `args`, a comma-separated list or an array. Example: `parseReal('(2 + x)^2 + sin(y)', 'x, y') // function(x, y) { return Math.pow(2 + x, 2) + Math.sin(y); }`