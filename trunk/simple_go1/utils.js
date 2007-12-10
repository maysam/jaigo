function debug_output(output)
{
	document.body.debug_output.value += output + "\\n";
}

function diagram2game(str)
{
    var g = null;
    for (line in string.split(str, "\n")) //TODO: will string.split return a string array split by newlines?
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
            for (x in range(line.length())) if (range(line.length).hasOwnProperty(x))
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