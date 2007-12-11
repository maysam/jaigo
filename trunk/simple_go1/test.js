/*    size = 19
##    g = Game(size)

##    g = Game(5)
##    g.make_move((2,2))
##    g.make_move((2,3))
##    g.make_move((1,3))
##    g.make_move((1,4))
##    g.make_move((3,3))
##    g.make_move((3,4))
##    g.make_move((2,4))
##    g.make_move((0,3))
##    g.make_move((2,3))
##    import pdb; pdb.set_trace()
##    g.make_move((1,2))
##    print g.current_board
*/

function test_speed(n)
{
    var g = new Game(19);
    var t0 = new Date();
	var b;
    for (i in xrange(n)) //TODO: what is xrange?
	{
        b = g.current_board.Copy();
	}
    var t1 = new Date();
    t_elapsed = t1-t0;
    debug_output(t_elapsed);
 	debug_output(n/t_elapsed);
}

function test_position(diagram, ok_result)
{
    var g = diagram2game(diagram);
    var test_result = g.current_board.As_String_With_Unconditional_Status();
    var board_pat //= re.compile(r".*?(\+.*\+)", re.DOTALL) //TODO: re.compile?
    var m = board_pat.match(ok_result); //TODO: match()?
	var ok_result_board;
    if (m)
	{
        ok_result_board = m.group(1); //TODO: group()?
	}
    else
	{
        ok_result_board = "1";
	}
    m = board_pat.match(test_result);
    if (m)
	{
        test_result_board = m.group(1);
	}
    else
	{
        test_result_board = "2";
	}
    if (ok_result_board==test_result_board)
	{
		return;
	}
    debug_output(ok_result);
	debug_output(test_result);
    throw new EvalError("unconditional test failed");
}

function test_all()
{
	test_position("" +
	 "ABCDEFGHI\n" +
 	"+---------+\n" +
	"9|.........| 9\n" +
	"8|.XX......| 8\n" +
	"7|.X.XXX...| 7\n" +
	"6|.XXX.XOO.| 6\n" +
	"5|..XOOOX..| 5\n" +
	"4|.OOXXXX..| 4\n" +
	"3|..X.X.X..| 3\n" +
	"2|..XXXXX..| 2\n" +
	"1|.........| 1\n" +
	 "+---------+\n" +
	  "ABCDEFGHI\n",
	 "ABCDEFGHJ\n" +
	 "+---------+\n" +
	"9|.........| 9\n" +
	"8|.&&......| 8\n" +
	"7|.&:&&&...| 7\n" +
	"6|.&&&:&OO.| 6\n" +
	"5|..&ooo&..| 5\n" +
	"4|.OO&&&&..| 4\n" +
	"3|..&:&:&..| 3\n" +
	"2|..&&&&&..| 2\n" +
	"1|.........| 1\n" +
	 "+---------+\n" +
	  "ABCDEFGHJ\n");
}