var debug = 1;

function log(s)
{
	//TODO: where to write game log?
    //fp = open("game2.log", "a")
    //fp.write(s)
    //fp.close()
};

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
    sgfsecond = chr(ord("a") + int(size) - int(digits));
    return sgffirst + sgfsecond;
};

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
};

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
};

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