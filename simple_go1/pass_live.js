function Pass_Live()
{
	this.start_no = long(sys.argv[1]);
	this.end_no = long(sys.argv[2]);

	this.fp = null;//open("pass_live.log", "w") //TODO: figure out where to store a log. in a parent document tag?
	this.size = 6;
	this.limit = 12;
	this.bits = size**2;

	//print "Running with size %i with stone limit at %i" % (size, limit)
	//print "from position %s to position %s" % (start_no, end_no)
	//print "Result to screen and to pass_live.log"
	
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
	        //sys.stderr.write("%i\r" % no); //TODO: replace sys.stderr
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
                //print no, bit_count
                //print b
			}
		}
	    no = no + 1;
	}	
};