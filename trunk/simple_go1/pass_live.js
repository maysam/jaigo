function Pass_Live()
{
	this.start_no = sys.argv[1]; //TODO: sys.argv?
	this.end_no = sys.argv[2];

	this.fp = null;//open("pass_live.log", "w") //TODO: figure out where to store a log. in a parent document tag?
	this.size = 6;
	this.limit = 12;
	this.bits = size * size;

	debug_output("Running with size " + size + " with stone limit at " + limit);
	debug_output("from position " + start_no + " to position " + end_no);
	debug_output("Result to screen and to pass_live.log");
	
	var simple_board2 = this.Create_Board(size);
	var no = start_no;
	while (no<=end_no and no<2**bits)
	{
	    var bit_count = 0;
	    for (var i in xrange(bits)) //TODO: xrange?
		{
	        if ((1L<<i) && no) //TODO: 1L?
			{
	            bit_count += 1;
			}
		}
	    if (no%100==0)
		{
	        debug_output(no + "\\r");
		}
	    if (bit_count<=limit)
		{
	        var simple_board = Create_Board(size)
	        for (var x,y in Iterate_Bit_Goban(no))
			{
	            simple_board[x-1][y-1] = 1;
			}
	        for (reflection_function in ref1, ref2, ref3, ref4, ref5, ref6, ref7) //TODO: reflection_function?
			{	
	            for (x in range(size)) //TODO: replace range
				{	
	                for (y in range(size))
					{	
	                    reflection_function(simple_board2, simple_board, x, y);
					}
				}
	            if (simple_board2 < simple_board)
				{	
	                break;
				}
			}
		}
        else
		{
            var b = new Board(size);
            for (x,y in Iterate_Bit_Goban(no))
			{
                b.Add_Stone(BLACK, (x, y));
			}
            if (b.Unconditional_Score(BLACK)==size**2)
			{
                //fp.write("%i: %i\n" % (no, bit_count))
                //fp.write(str(b))
                //fp.write("\n")
                //fp.flush()
                debug_output(no);
				debug_output(bit_count);
                debug_output(b);
			}
		}
	    no = no + 1;
	}	
};