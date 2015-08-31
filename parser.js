var parse = (function() {
	var BRACE_OPEN = '(';
	var BRACE_CLOSE = ')';
	
	var parse = function(str, args) {
		for (var i in parse.prefix)
			str = str.replace(i, parse.prefix[i]);
		for (var i in parse.infix)
		return new Function(args, str);
	};
	
	parse.prefix = {
		'sin': 'Math.sin',
		'cos': 'Math.cos',
		'tan': 'Math.tan',
		'exp': 'Math.exp',
		'log': 'Math.log',
		
		'PI': 'Math.PI',
		'E': 'Math.E'
	};
	
	parse.infix = {
		'^': 'Math.pow'
	};
	
	parse.matchBraces = function(str, pos, dir) {
		var depth = 0;
		var i = pos - 1;
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
	
	return parse;
}());