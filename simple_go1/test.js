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

function Test_Speed(n)
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
    alert(t_elapsed, n/t_elapsed); //TODO: figure out how to report on a test.
};

function Test_Position(diagram, ok_result)
{
    var g = Diagram2Game(diagram);
    var test_result = g.current_board.As_String_With_Unconditional_Status();
    var board_pat = re.compile(r".*?(\+.*\+)", re.DOTALL) //TODO: re.compile?
    var m = board_pat.match(ok_result); //TODO: match()?
	var ok_result_board = "";
    if (m)
	{
        ok_result_board = m.group(1); //TODO: group()?
	}
    else
	{
        ok_result_board = "1";
	}
    m = board_pat.match(test_result)
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
    alert(ok_result); //TODO: figure out how to report on test
	alert(test_result);
    throw new EvalError("unconditional test failed");
};

function Test_All()
{
	test_position("
	  ABCDEFGHI
	 +---------+
	9|.........| 9
	8|.XX......| 8
	7|.X.XXX...| 7
	6|.XXX.XOO.| 6
	5|..XOOOX..| 5
	4|.OOXXXX..| 4
	3|..X.X.X..| 3
	2|..XXXXX..| 2
	1|.........| 1
	 +---------+
	  ABCDEFGHI",
	"
	  ABCDEFGHJ
	 +---------+
	9|.........| 9
	8|.&&......| 8
	7|.&:&&&...| 7
	6|.&&&:&OO.| 6
	5|..&ooo&..| 5
	4|.OO&&&&..| 4
	3|..&:&:&..| 3
	2|..&&&&&..| 2
	1|.........| 1
	 +---------+
	  ABCDEFGHJ
	");
};``