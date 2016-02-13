(function() {
	// constants
	var BRACE_OPEN = '(';
	var BRACE_CLOSE = ')';
	var alphaNumRE = /[a-zA-Z0-9_$\[\]\,]/;

	function Operator(prec, assoc) {
		if (!(this instanceof Operator))
			return new Operator(prec, assoc);
		this.precedence = prec;
		this.associative = assoc || 'left';
	}

	var ops = {
		'+': Operator(13),
		'-': Operator(13),
		'*': Operator(14),
		'/': Operator(14),
		'%': Operator(14),
		'^': Operator(15, 'right'), // FIXME 14 according to spec
	};


	// utils
	function isAlphaNum(ch) {
		return ch !== void 0 && alphaNumRE.test(ch);
	};

	function nBinder(fn) {
		// FIXME only binds one argument
		var bound = Array.prototype.slice.call(arguments, 1);
		var nArgs = fn.length;
		var argStr = '';
		for (var i = 0; i < nArgs - 1; i++)
			argStr += (i > 0? ',': '') + 'a' + i;
		var temp = Function('fn', 'scope',
			'return function(' + argStr + ') { ' +
				'return fn(scope' + (nArgs > 1? ',' + argStr: '') + '); }'
		);
		return temp.apply(null, [fn].concat(bound));
	};

	function matchBraces(str, pos, dir, rootPrecedence) {
		var depth = 0;
		if (str[pos + dir] in ops && ops[str[pos + dir]].precedence <= rootPrecedence)
			return pos;
		for (var i = pos + dir; str[i] != null; i += dir) {
			if (str[i] == BRACE_OPEN)
				depth++;
			else if (str[i] == BRACE_CLOSE)
				depth--;
			if (depth === 0)
				return i;
		}
		return pos;
	};

	function captureId(str, pos, dir) {
		var i = pos;
		while (isAlphaNum(str[i + dir])) i += dir;
		return i;
	};

	function deinfix(str, infixOp, subs) {
		var opPos = -1;
		var prec = ops[infixOp].precedence;
		while (true) {
			opPos = str.indexOf(infixOp, opPos + 1);
			if (opPos == -1)
				break;
			var start = captureId(str, matchBraces(str, opPos, -1, prec), -1);
			var end = matchBraces(str, captureId(str, opPos, 1), 1, prec);

			str = str.slice(0, start) + subs + '(' +
				str.slice(start, opPos) + ',' +
				str.slice(opPos + 1, end + 1) + ')' +
				str.slice(end + 1);
		}
		return str;
	};

	function scopify(expr, name) {
		return expr.replace(
			new RegExp('^' + name + '\\b|([+\\-\\/\\^,;|&({[ ])' + name + '\\b', 'g'),
			'$1cont["' + name + '"]'
		);
	};


	// Public API
	//   prefix fakes function "scope", as in { 'cos': Math.cos }
	//   infix maps infix operators to binary function names, as in { '^': 'pow'}
	// returns function parse(str, args):
	//   str: expression String
	//   args: Array of argument names
	//   returns: Function
	var parse = function (configDirty) {
		configDirty = configDirty || {};
		var config = {
			prefix: configDirty.prefix || {},
			infix: configDirty.infix || {},
			literalProcessor: configDirty.literalProcessor || function (x) { return x; },
		};
		config.ops = Object.keys(config.infix)
			.sort((x,y) => ops[y].precedence - ops[x].precedence);

		// interface
		return function(args, str) {
			if (str === void 0) {
				str = args;
				args = [];
			}
			args = args || [];
			if (!Array.isArray(args)) args = args.replace(/\s+/g, '').split(',');
			str = str.replace(/\s+/g, ''); // FIXME <keyword> <id> as in var x

			for (var i = 0; i < config.ops.length; i++)
				str = deinfix(str, config.ops[i], config.infix[config.ops[i]]);
			for (var key in config.prefix)
				if (args.indexOf(key) === -1)
					str = scopify(str, key);
			return nBinder(Function(['cont'].concat(args), 'return ' + str + ';'), config.prefix);
		};
	};

	// TODO
	// - [ ] literal preprocessing (convert 4 to some object)
	// - [ ] custom keywords (as in i the imaginary unit)
	// - [ ] operators as functions
	// - [ ] unaries
	// - [ ] array / object literal overloads
	// - sanitization
	//   - [ ] argument names
	//   - [ ] source
	// - [ ] unsealed scope warning
	// - [ ] custom precedence
	// - [ ] right-associativity


	// export
	if (typeof module !== 'undefined' && module.exports)
        module.exports = parse;
  if (typeof window !== 'undefined')
    window.parser = parse;
}());
