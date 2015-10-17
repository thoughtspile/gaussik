(function() {
	// constants
	var BRACE_OPEN = '(';
	var BRACE_CLOSE = ')';
	var alphaNumRE = /[a-zA-Z0-9_$]/;


	// utils
	var isAlphaNum = function(ch) {
		return ch != null && alphaNumRE.test(ch);
	};

	var nBinder = function(nArgs) {
		var argStr = '';
		for (var i = 0; i < nArgs - 1; i++)
			argStr += (i > 0? ', ': '') + 'a' + i;
		return new Function('fn', 'extra',
			'return function(' + argStr + ') { ' +
				'return fn(extra' + (nArgs > 1? ',' + argStr: '') + '); }'
		);
	};

	var matchBraces = function(str, pos, dir) {
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

	var captureId = function(str, pos, dir) {
		for (var i = pos; isAlphaNum(str[i + dir]); i += dir);
		return i;
	}

	var deinfix = function(str, infixOp, subs) {
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
	}

	var scopify = function(expr, name) {
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
	var parse = function(prefix, infix) {
		prefix = prefix || {};
		infix = infix || {};

		// interface
		return function(str, args) {
			str = str.replace(/ /g, '');
			args = args || [];
			args = Array.isArray(args)? args: args.replace(/ /g, '').split(',');

			for (var key in infix)
				str = deinfix(str, key, infix[key]);

			for (var key in prefix)
				if (args.indexOf(key) === -1)
					str = scopify(str, key);

			return nBinder(args.length + 1)(
				new Function(['cont'].concat(args), 'return ' + str + ';'),
				prefix);
		};
	};


	// export
	if (typeof module !== 'undefined' && module.exports)
        module.exports = parse;
    if (typeof window !== 'undefined')
        window.parser = parse;
}());
