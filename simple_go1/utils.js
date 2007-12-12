function debug_output(output)
{
    document.getElementById('debug_output').value += output + "\n";
}

String.prototype.strip = (
     function() {
        //This anonymous function is not strip but a
        //contrivance to let us share the regex among
        //all invocations of strip.
        var escapeRegexCharacterSetElements = /(\[|\\)/g;
	var ws = /(^\s*)(.*?)(\s*$)/;
        var result = function(chars) {
	    var replaceThis;
	    if (!chars) {
		replaceThis = ws;
	    }
	    else {
		var garbage = '[' + chars.replace(escapeRegexCharacterSetElements, '\$&') + ']';
		replaceThis = new RegExp('(^' + garbage + '*)(.*?)(' + garbage + '*$)');
	    }
	    return this.replace(replaceThis, '$2');
        };
	return result;
    })();

function diagram2game(str)
{
    var g;
    var game_lines = str.split("\n");
    for (var l in game_lines) if (game_lines.hasOwnProperty(l)) {
	var whitespace = /(^\s*)(.*?)(\s*$)/;
	var line = game_lines[l].strip();
        if (!line) 
		{
			continue;
		}
        if (g===undefined)
		{
            g = new Game(line.length);
		}
        else if (line[0] < 19 && line[0] > 0)
		{
            var y, line, rest = line.split("|"); //TODO: tricky assignment. don't know if js can do this.
            for (x in range(line.length)) if (range(line.length).hasOwnProperty(x))
			{
                var stone = line[x];
                x = x + 1;
                if (stone == WHITE || stone == BLACK)
				{
                    if (g.current_board.side!=stone)
					{
                        g.Make_Move(PASS_MOVE);
					}
                    g.Make_Move(x, y);
				}
			}
		}
	}
    return g;
}

function test_unconditional(str)
{
    var g = diagram2game(str);
    debug_output(g.current_board.As_String_With_Unconditional_Status());
}

String.prototype.Repeat = function(repetitions)
{
	var s = "";
	t = this.toString();
	while (--repetitions >= 0) s += t;
	return s;
}