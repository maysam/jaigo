var debug = 1;

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

function GTP_controller(log,infile, outfile)
{
    /*
    # Class members:
	#   log				File to display interaction in
    #   outfile         File to write to
    #   infile          File to read from
	*/

	this.game_log = log;//document.body.log_output;
	this.game_input = input;//document.body.gtp_input;
	this.game_output = output;
}

GTP_controller.prototype.Get_Cmd = function()
{
	var result = "";
	while (true)
	{
	    var line = this.game_input.value; //read_game_input();
		this.game_input.value = "";
	    if (line.length < 1)
		{
			break;
		}
	    if (this.game_log.length < 1) //TODO: replace log_fp
		{
	        this.game_log.value = ">" + line;
		}
	    if (line=="\n")
		{
	 		continue;
		}
	    result += line;
	    break;
	}
	return result;
};      

GTP_controller.Set_Result = function(result)
{
	if (debug)
	{	
        this.game_log.value += ">" + line;
	}
	this.game_output.value += result;
};

/* Class members:
#    slave          GTP_connection
#    master         GTP_controller
*/

function GTP_player(gtp_log, gtp_input, gtp_output)
{
	this.engine = new Game(19);
	this.master = new GTP_controller(gtp_log, gtp_input, gtp_output);
	this.version = "0.1.0";
	this.name = "jaigo: at end of game I will pass once your stones are so safe that you can pass FOREVER: my info contains links to my source code: ";
	this.komi = 0.0;
	this.handicap = 0;
}

GTP_player.prototype.Ok = function(result)
{
    if (result===null)
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
        if (this.handicap===0)
		{
            handicap_change = 2;
		}
        else
		{
            handicap_change = 1;
		}
        if (color[0].toUpperCase()==="B")
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

GTP_player.prototype.Genmove_Plain = function(color, remove_opponent_dead, pass_allowed)
{
    this.Check_Side2Move(color);
    var move = PASS_MOVE;
	move = this.engine.Generate_Move(remove_opponent_dead, pass_allowed);
    move = move_as_string(move, this.engine.size);
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
    this.engine.Make_Move(string_as_move(move.toUpperCase(), this.engine.size));
    log_output(this.engine.current_board.toString());
    log_output(this.engine.current_board.As_String_With_Unconditional_Status());
    log_output("move: " + move.toString() + "\n");
    log_output("score: " + this.Final_Score_As_String() +  this.engine.current_board.Unconditional_Score(WHITE) +  this.engine.current_board.Unconditional_Score(BLACK) + " unconditional score: W: " + WHITE + " B: " + BLACK + "\n");
};

GTP_player.prototype.Play = function(color, move)
{
    return this.Ok(this.Play_Plain(color, move));
};

GTP_player.Place_Free_Handicap = function(count)
{
    this.handicap = count;
    var result = [];
    for (move in this.engine.Place_Free_Handicap(count)) if (this.engine.Place_Free_Handicap(count).hasOwnProperty(move))
	{
        move = move_as_string(move, this.engine.size);
        result.push(move);
	}
    return this.Ok(string.join(result)); //TODO: what is string.join doing here?
};

GTP_player.prototype.Set_Free_Handicap = function(stones)
{
    this.handicap = stones.length;
    for (i in range(stones.length)) if (range(stones.length).hasOwnProperty(i))
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
    for (pos in lst) if (lst.hasOwnProperty(pos))
	{
        str_lst.push(move_as_string(pos, this.engine.size));
	}
    return this.Ok(string.join(str_lst, "\n"));
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
    var result = string.join("list_commands", "boardsize", "name", "version", "quit", "clear_board", "place_free_handicap", "set_free_handicap", "play",  "final_status_list", "kgs-genmove_cleanup", "showboard", "protocol_version", "komi", "final_score", "\n");
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
		case "version": result = "= " + this.version + "\n\n"; break;
    	case "name": result = "= " + this.name + "\n\n"; break;
     	case "protocol_version": result = "= 2\n\n"; break;
     	case "komi": this.komi = cmd_lst[1]; result = "=\n\n"; break;
     	case "genmove_white": result = this.Genmove("white"); break;
     	case "genmove_black": result = this.Genmove("black"); break;
 		case "genmove": result = this.Genmove(cmd_lst[1]); break;
    	case "boardsize": result = this.Boardsize(cmd_lst[1]); break;
    	case "list_commands": result = this.List_Commands(); break;
 		case "play": result = this.Play(cmd_lst[1], cmd_lst[2]); break;
    	case "clear_board": result = this.Clear_Board(); break;
		case "place_free_handicap": result = this.Place_Free_Handicap(cmd_lst[1]); break;
		case "set_free_handicap": result = this.Set_Free_Handicap(cmd_lst.substr(1)); break;
		case "final_status_list": result = this.Final_Status_List(cmd_lst[1]); break;
		case "kgs-genmove_cleanup": result = this.Genmove_Cleanup(cmd_lst[1]); break;
		case "showboard": result = this.Showboard(); break;
		case "final_score": result = this.Final_Score(); break;
		case "quit": result = "=\n\n"; break;
		default:
			this.log_fp.Write("Unhandled command:" + cmd_line); //TODO: refactor for log_fp
        	this.log_fp.Flush();
        	result = this.error("Unknown command");
			break;
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
			//if(1===1) //noop
		}
	}
	catch (e)
	{
		//traceback.print_exc(null, this.log_fp)
		//this.log_fp.Flush();
		debug_output(e.toString());
		debug_output(e);
		//raise
	}
};