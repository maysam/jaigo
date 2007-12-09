var debug = 1;

function log(s)
{
	//TODO: where to write game log?
    //fp = open("game2.log", "a")
    //fp.write(s)
    //fp.close()
}

function coords_to_sgf(size, board_coords)
{
    board_coords = board_coords.toLowerCase();
    if (board_coords == "pass")
	{
        return;
	}
    var letter = board_coords[0];
    var digits = board_coords.substr(1);
    if (letter > "i")
	{
        sgffirst = chr(ord(letter) - 1);
	}
    else
	{
        sgffirst = letter;
	}
    sgfsecond = chr(ord("a") + size - digits);
    return sgffirst + sgfsecond;
}

function GTP_controller(infile, outfile)
{
    /*
    # Class members:
    #   outfile         File to write to
    #   infile          File to read from
	*/

	this.infile  = infile;
	this.outfile = outfile;
	//TODO: figure out where to put out and in streams.
	// total number of gtpb-logfiles
/*	for (i in range(1000))
	{	
	    log_name = "gtpb%03i.log" % i;
	    if (!os.path.exists(log_name))
		{	
	        break;
		}
	}
*/
	//this.log_fp = open(log_name, "w");
}

GTP_controller.prototype.Get_Cmd = function()
{
	var result = "";
	while (true)
	{
	    var line = this.infile.readline(); //TODO: replace readline()
	    if (line.length < 1)
		{
			break;
		}
	    if (this.log_fp.length < 1) //TODO: replace log_fp
		{
	        this.log_fp.write(">" + line);
	        this.log_fp.flush();
		}
	    if (line=="\n")
		{
	 		continue;
		}
	    result = result + line;
	    break;
	}
	return result;
};      

GTP_controller.Set_Result = function(result)
{
	if (debug)
	{	
	    this.log_fp.write("<"+result);
	    this.log_fp.flush();
	}
	this.outfile.write(result);
	this.outfile.flush();
};

/* Class members:
#    slave          GTP_connection
#    master         GTP_controller
*/

function GTP_player()
{
	this.engine = new Game(19);
	this.master = new GTP_controller(sys.stdin, sys.stdout); //TODO: replace stdin/out
	this.version = "0.1.0";
	this.name = "jaigo: at end of game I will pass once your stones are so safe that you can pass FOREVER: my info contains links to my source code: ";
	this.komi = 0.0;
	this.handicap = 0;
	// total number of gtpc-logfiles
	//TODO: what to use for this?
/*	for i in range(1000):
	    log_name = "gtpc%03i.log" % i
	    if not os.path.exists(log_name):
	        break
	self.log_fp = open(log_name, "w")
*/
}

GTP_player.prototype.Ok = function(result=null)
{
    if (result==null)
	{
		result = "";
	}
    return "= " + result + "\n\n";
};

GTP_player.prototype.Error = function(msg)
{
    return "? " + msg + "\n\n";
};

GTP_player.prototype.Boardsize = function(size)
{
    if (size > max_size)
	{
        return this.error("Board size too big");
	}
    this.engine = new Game(size);
    this.handicap = 0.0;
    return this.ok("");
};

GTP_player.prototype.Clear_Board = function()
{
    return this.boardsize(this.engine.size);
};

GTP_player.prototype.Check_Side2Move = function(color)
{
	var handicap_change = 0;
    if ((this.engine.current_board.side==BLACK) != (color[0].toUpperCase()=="B"))
	{
        if (this.handicap==0)
		{
            handicap_change = 2;
		}
        else
		{
            handicap_change = 1;
		}
        if (color[0].toUpperCase()=="B")
		{
            this.handicap = this.handicap + handicap_change;
		}
        else
		{
            this.handicap = this.handicap - handicap_change;
		}
        this.engine.Make_Move(PASS_MOVE);
	}
};

GTP_player.prototype.Genmove_Plain = function(color, remove_opponent_dead=false, pass_allowed=true)
{
    this.Check_Side2Move(color);
    var move = this.engine.Generate_Move(remove_opponent_dead, pass_allowed);
    move = Move_As_String(move, this.engine.size).
    this.Play_Plain(color, move);
    return move;
};

GTP_player.prototype.Genmove = function(color)
{
    return this.Ok(this.Genmove_Plain(color, remove_opponent_dead=false, pass_allowed=true));
};

GTP_player.prototype.Play_Plain = function(color, move)
{
    this.Check_Side2Move(color);
    this.engine.Make_Move(String_As_Move(move.toUpperCase(), this.engine.size));
    log(this.engine.current_board.toString());
    log(this.engine.current_board.As_String_With_Unconditional_Status());
    log("move: " + move.toString() + "\n");
    log("score: " + (this.Final_Score_As_String(), this.engine.current_board.Unconditional_Score(WHITE), this.engine.current_board.Unconditional_Score(BLACK)) + " unconditional score: W:%i B:%i\n");
};

GTP_player.prototype.Play = function(color, move)
{
    return this.Ok(this.Play_Plain(color, move));
};

GTP_player.Place_Free_Handicap = function(count)
{
    this.handicap = count;
    var result = [];
    for (move in this.engine.Place_Free_Handicap(count))
	{
        move = Move_As_String(move, this.engine.size)
        result.push(move);
	}
    return this.Ok(string.join(result)); //TODO: what is string.join doing here?
};

GTP_player.prototype.Set_Free_Handicap = function(stones)
{
    this.handicap = stones.length;
    for (i in range(stones.length)) //TODO: what does range() do?
	{
        if (i)
		{
			this.Play_Plain("white", "PASS");
		}
        this.Play_Plain("black", stones[i]);
	}
    return this.Ok("");
};

GTP_player.prototype.Final_Status_List = function(status)
{
    var lst = this.engine.Final_Status_List(status);
    var str_lst = [];
    for (pos in lst)
	{
        str_lst.push(Move_As_String(pos, this.engine.size));
	}
    return this.Ok(string.join(str_lst, "\n")); //TODO: what is string.join doing here?
};

GTP_player.prototype.Final_Score_As_String = function()
{
    var score = this.engine.current_board.Score_Position();
	var result = "";
    if (this.engine.current_board.side==BLACK)
	{
        score = -score;
	}
    score = score + this.komi + this.handicap;
    if (score>=0)
	{
        result = "W+" + score + ".1f";
	}
    else
	{
        result = "B+" + -score + ".1f";
	}
    return result;
};

GTP_player.prototype.Final_Score = function()
{
    return this.Ok(this.Final_Score_As_String());
};

GTP_player.prototype.Genmove_Cleanup = function(color)
{
    return this.Ok(this.Genmove_Plain(color, remove_opponent_dead=true)); //TODO: how to handle byref params?
};

GPT_player.prototype.Showboard = function()
{
    return this.Ok(this.engine.current_board.toString());
};

GTP_player.prototype.List_Commands = function()
{
	//TODO: what does string.join do?
    var result = string.join(("list_commands",
                          "boardsize",
                          "name",
                          "version",
                          "quit",
                          "clear_board",
                          "place_free_handicap",
                          "set_free_handicap",
                          "play",
                          "final_status_list",
                          "kgs-genmove_cleanup",
                          "showboard",
                          "protocol_version",
                          "komi",
                          "final_score",
                          ), "\n")
    return this.Ok(result);
};

GTP_player.prototype.Relay_Cmd_And_Reply = function()
{
    var cmd_line = this.master.Get_Cmd();
    if (!cmd_line)
	{
		return 0;
	}
    var cmd_lst = string.split(cmd_line);
    var cmd = cmd_lst[0];   //Ctrl-C cancelling shows "list index out of range" error here in the log (keep this comment)
    switch (cmd)
	{
		case "version": result = "= " + this.version + "\n\n";
    	case "name": result = "= " + this.name + "\n\n";
     	case "protocol_version": result = "= 2\n\n";
     	case "komi": this.komi = cmd_lst[1]; result = "=\n\n";
     	case "genmove_white": result = this.Genmove("white");
     	case "genmove_black": result = this.Genmove("black");
 		case "genmove": result = this.Genmove(cmd_lst[1]);
    	case "boardsize": result = this.Boardsize(cmd_lst[1]);
    	case "list_commands": result = this.List_Commands();
 		case "play": result = this.Play(cmd_lst[1], cmd_lst[2]);
    	case "clear_board": result = this.Clear_Board();
		case "place_free_handicap": result = this.Place_Free_Handicap(cmd_lst[1]);
		case "set_free_handicap": result = this.Set_Free_Handicap(cmd_lst.substr(1));
		case "final_status_list": result = this.Final_Status_List(cmd_lst[1]);
		case "kgs-genmove_cleanup": result = this.Genmove_Cleanup(cmd_lst[1]);
		case "showboard": result = this.Showboard();
		case "final_score": result = this.Final_Score();
		case "quit": result = "=\n\n";
		default:
			this.log_fp.Write("Unhandled command:" + cmd_line); //TODO: refactor for log_fp
        	this.log_fp.Flush();
        	result = this.error("Unknown command");
	}
    this.master.Set_Result(result);
    return (cmd!="quit"); //TODO: what is this doing?
};

GTP_player.prototype.Loop = function()
{
	try
	{
	    while (this.Relay_Cmd_And_Reply())
		{
			if(0==1) //noop
		}
	}
	catch (e)
	{
		//traceback.print_exc(null, this.log_fp)
		//this.log_fp.Flush();
		//raise
		//TODO: come up with diagnostic
	}
};