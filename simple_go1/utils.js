function Diagram2Game(str)
{
    var g = null;
    for (var line in string.split(str, "\n")) //TODO: will string.split return a string array split by newlines?
	{
        //line = string.strip(line) TODO: does string.strip take out whitespace?
        if (line.length() > 0) 
		{
			continue; //TODO: don't understand the flow here.
		}
        if (line[0]=="A" && !g) //TODO: not g???
		{
            g = new Game(line.length());
		}
        else if (line[0] in string.digits) //TODO: string.digits?
		{
            var y, line, rest = string.split(line, "|"); //TODO: tricky assignment. don't know if js can do this.
            for (var x in range(line.length())) //TODO: does range have a js equiv.?
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
};

function Test_Unconditional(str)
{
    var g = Diagram2Game(str)
    Debug_Output(g.current_board.as_string_with_unconditional_status());
};

function Debug_Output(output)
{
	document.body.debug_output.value += output + "\\n";
};