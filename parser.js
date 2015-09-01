var parse = (function() {
	// constants
	var BRACE_OPEN = '(';
	var BRACE_CLOSE = ')';
	
	
	// data
	// fail: relies on global object
	var prefixRE = null;
	
	var prefix = {
		'sin': Math.sin,
		'cos': Math.cos,
		'tan': Math.tan,
		'exp': Math.exp,
		'log': Math.log,
		'pow': Math.pow,
		
		'PI': Math.PI,
		'E': Math.E
	};
	
	var infix = {
		'^': 'pow'
	};	
	
	// utils
	var init = function() {
		prefixRE = prefixRE || new RegExp('\\b' + Object.keys(prefix).join('|') + '\\b', 'g');
	};
	
	var merge = function (src, targ) {
		for (var key in src)
			targ[key] = src[key];
	};
	
	var bindn = function(nArgs) {
		var argNames = new Array(nArgs);
		for (var i = 0; i < nArgs; i++)
			argNames[i] = 'a' + i;
		var argStr = argNames.join(',');
		return new Function('fn', 'cont',
			'return function(' + argStr +') { ' +
			'return fn(' + argStr + ', cont); }'
		);
	};
	
	// need more care here
	var matchBraces = function(str, pos, dir) {
		var depth = 0;
		var i = pos + dir;
		while (true) {
			if (str[i] === BRACE_OPEN)
				depth++;
			else if (str[i] === BRACE_CLOSE)
				depth--;
			
			if (depth === 0)
				return i;
			
			i += dir;
			if (i >= str.length || i < 0)
				return -1;			
		}
	};
	
	// interface
	var parse = function(str, args) {
		init();
		for (var key in infix) {
			var i = -1;
			var k = 0;
			while (true) {
				i = str.indexOf(key, k);
				if (i === -1 || i > 100)
					break;
				var j = matchBraces(str, i, -1);
				var k = matchBraces(str, i, 1);
				str = str.slice(0, j) + infix[key] + '(' +
					str.slice(j, i) + ',' + str.slice(i + 1, k + 1) + ')' +
					str.slice(k + 1);
			}
		}
		str = str.replace(prefixRE, function(key) {
			return 'cont["' + key + '"]';
		});
		args = args.slice();
		args.push('cont');
		var unbound = new Function(args, 'cont', 'return ' + str + ';');
		return bindn(args.length)(unbound, prefix);
	};
	
	parse.setup = function(config) {
		config = config || {};
		merge(config.prefix || {}, prefix);
		merge(config.infix || {}, infix);
		return parse
	};
	
	
	return parse;
}());