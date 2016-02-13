(function() {
	// constants
	var BRACE_OPEN = '(';
	var BRACE_CLOSE = ')';
	var alphaNumRE = /[a-zA-Z0-9_$]/;


	// utils
	function isAlphaNum(ch) {
		return ch !== void 0 && alphaNumRE.test(ch);
	};

	function nBinder(nArgs) {
		var argStr = '';
		for (var i = 0; i < nArgs - 1; i++)
			argStr += (i > 0? ', ': '') + 'a' + i;
		return new Function('fn', 'extra',
			'return function(' + argStr + ') { ' +
				'return fn(extra' + (nArgs > 1? ',' + argStr: '') + '); }'
		);
	};

	function matchBraces(str, pos, dir) {
		var depth = 0;
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
		while (true) {
			opPos = str.indexOf(infixOp, opPos + 1);
			if (opPos == -1)
				break;
			var start = captureId(str, matchBraces(str, opPos, -1), -1);
			var end = matchBraces(str, captureId(str, opPos, 1), 1);
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

		// interface
		return function(args, str) {
			if (str === void 0) {
				str = args;
				args = [];
			}
			args = args || [];
			if (!Array.isArray(args)) args = args.replace(/\s+/g, '').split(',');
			str = str.replace(/\s+/g, ''); // FIXME <keyword> <id> as in var x

			for (var key in config.infix) {
				str = deinfix(str, key, config.infix[key]);
			}
			for (var key in config.prefix)
				if (args.indexOf(key) === -1)
					str = scopify(str, key);
			return nBinder(args.length + 1)(
				Function(['cont'].concat(args), 'return ' + str + ';'),
				config.prefix);
		};
	};


	// export
	if (typeof module !== 'undefined' && module.exports)
        module.exports = parse;
  if (typeof window !== 'undefined')
    window.parser = parse;
}());
