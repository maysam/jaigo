function debug_output(output, element, tag)
{
        if (arguments.length < 2)
        {
                element = 'debug_output';
        }
    var out = document.getElementById(element);
        if (arguments.length < 3)
        {
            out.value += output + "\n";         
        }
        else
        {
                out.value += "<" + tag + ">" + output + "</" + tag + ">";
        }
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
                var garbage = '[' + chars.replace(escapeRegexCharacterSetElements, '\\$&') + ']';
                replaceThis = new RegExp('(^' + garbage + '*)(.*?)(' + garbage + '*$)');
            }
            return this.replace(replaceThis, '$2');
        };
        return result;
    })();

function diagram2game(str)
{
    var digits = /^\d*$/
    var g;
    var game_lines = str.split("\n");
    for (var l in game_lines) if (game_lines.hasOwnProperty(l)) {
        var whitespace = /(^\s*)(.*?)(\s*$)/;
        var line = game_lines[l].strip();
        if (!line) {
            continue;
        }
        if (g === undefined) {
            g = new Game(line.length);
        }
        else if (digits.test(line[0])) {
            var splitted = line.split("|");
            var y = Number(splitted[0]);
            var line = splitted[1];
            var rest = splitted[2];
            var xpositions = range(line.length);
            for (x in xpositions) if (xpositions.hasOwnProperty(x)) {
                var stone = line[x];
                x = Number(x) + 1;
                if (stone === WHITE || stone === BLACK) {
                    if (g.current_board.side !== stone) {
                        g.Make_Move(PASS_MOVE);
                    }
                    g.Make_Move([x, y]);
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