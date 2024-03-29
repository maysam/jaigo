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

function test_listPotentialEyes() {
    var g = diagram2game("ABCDEFGHI\n" +
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
        "ABCDEFGHI\n");
    var list = g.current_board.listPotentialEyes(BLACK);
    if (list.length !== 2) throw new Error("wrong number of eyes");
    var flattened = {};
    for (var l in list) {
        var el = list[l];
        for (var p in el.parts) {
            var part = el.parts[p];
            for (var pos in part.stones) {
                flattened[pos] = true;
            }
        }
    }
    if (flattened[[2, 8]] === undefined ||
        flattened[[3,2]] === undefined) {
        throw new Error("misidentified eyes");
    }
    expectedEyeSubset = [[4, 5], [3, 7], [6, 3], [4, 3]];
    for (var i in expectedEyeSubset) if (expectedEyeSubset.hasOwnProperty(i)) {
	    var expectedEye = expectedEyeSubset[i];
	    if (!g.current_board.blocks[expectedEye].eye) {
		throw new Error("failed to identify potential eye " + expectedEye);
	    }
	}
}

function test_classifyPotentialEyesByColor() {
    test_listPotentialEyes();
    var g = diagram2game("ABCDEFGHI\n" +
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
        "ABCDEFGHI\n");
    var list = g.current_board.listPotentialEyes(BLACK);
    var classes = g.current_board.classifyPotentialEyesByColor(list, BLACK);
    if (classes[0].length !== 2) throw new Error("classifyPotentialEyesByColor gave false negatives for 'ok' eyes");
}

function test_countEyes() {
   var g = diagram2game("ABCDEFGHI\n" +
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
        "ABCDEFGHI\n");
   var color = BLACK;
   var board = g.current_board;
   var list = board.listPotentialEyes(color);
   var classes = board.classifyPotentialEyesByColor(list, color);
   board.prepForCountEyes(color);
   var changed_count = board.countEyes(color);
   if (changed_count !== 0) {
       throw new Error("changed_count was " + changed_count + " (expected 0)");
   }
   var eyesCount = 0;
   board.each_Blocks(color)(function (block) {
	   eyesCount += block.eye_count;
       });
   if (eyesCount !== 4) {
       throw new Error("countEyes says there are " + eyesCount + " eyes when in fact there are 4.");
   }
}

function test_speed(n)
{
    var g = new Game(19);
    var t0 = new Date();
        var b;
    for (i in xrange(n))
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
    var board_pat = /[\s\S]*?(\+[\s\S]*\+)/;
    var m = board_pat(ok_result);
    var ok_result_board;
    if (m)
        {
        ok_result_board = m[1];
        }
    else
        {
        ok_result_board = "1";
        }
    m = board_pat(test_result);
    if (m)
        {
        test_result_board = m[1];
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