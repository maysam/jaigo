var EMPTY = ".";
var BLACK = "X";
var WHITE = "O";
var WORST_SCORE = -1000000000;
var normal_stone_value_ratio = 0.7;
var x_coords_string = "ABCDEFGHJKLMNOPQRSTUVWXYZ";
var max_size = x_coords_string.length;
var debug_flag = false;

var BOTH = BLACK + WHITE;

other_side = {BLACK: WHITE, WHITE: BLACK};

/* Douglas Crockford's prototypal
   inheritance fn */
function object(o) {
    function F() {}
    F.prototype = o;
    return new F();
}
function Pair(x, y) {
    this.x = x;
    this.y = y;
}
deepValueEquality = function (other) {
    var a = this;
    var b = other;
    if (arguments.length == 2) {
	a = arguments[0];
	b = arguments[1];
    }
    if (!(a instanceof Object)) {
	return a === b;
    }
    for (var e in b) {
	if (a[e] != b[e]) {
	    return false;
	}
    }
    return true;
};
Pair.prototype.equals = deepValueEquality;
function move(x, y) {
    return object(new Pair(x, y));
}

function contains(sequence, quarry, eq) {
    for (var x in sequence) {
	if (eq(quarry, sequence[x])) {
	    return true;
	}
    }
    return false;
}

function range(begin, end, step) {
    step = step || 1;
    if (arguments.length == 1) {
	end = arguments[0];
	begin = 0;
    }
    var a = [];
    var c = 0;
    for (var i = begin; i < end; i += step) {
	a[c++] = i;
    }
    return a;
}



PASS_MOVE = move(-1, -1);

function move_as_string(move, board_size)
{
    /*convert move tuple to string
      example: (2, 3) -> B3
	*/
    if (PASS_MOVE.equals(move)) {
	return "PASS";
    }
    return x_coords_string[move.x - 1] + str(move.y);
}

function string_as_move(m, size)
{
    /*convert string to move tuple
      example: B3 -> (2, 3)
    */
    if (m == "PASS") {
	return PASS_MOVE;
    }
    x = x_coords_string.indexOf(m.charAt(0));
    y = m.charAt(1);
    return move(x,y);
}

/* Block class

	Solidly connected group of stones or empy points as defined in Go rules

   Attributes:
   stones: position of stones or empty points
           empty points are like trasparent stones
   liberties: position of liberties
   color: color of stones
*/
function Block(color)
{
	this.stones = [];
	this.neighbour = [];
	this.color = color;
}

Block.prototype.Add_Stone = function(position)
{
	/*add stone or empty point at given position
    */
    this.stones[position] = true;
};

Block.prototype.Remove_Stone = function(position)
{
    /*remove stone or empty point at given position
    */
    this.stones[position] = false;
	//TODO: this may not be equivalent to del self.stones[pos]
};

Block.prototype.Add_Block = function(other_block)
{
    /*add all stones and neighbours to this block
    */
    this.stones.Update(other_block.stones);
    this.neighbour.Update(other_block.neighbour);
	//TODO: not sure if this subobject method syntax is correct
};

Block.prototype.Mark_Stones = function(mark)
{
    /*mark all stones with given value
    */
    for (var stone in this.stones)
	{
		this.stones[stone] = mark;		
	}
};

Block.prototype.Size = function()
{
    /*returns block size
    */
    return this.stones.length;
};

Block.prototype.Max_Liberties = function()
{
    /*returns maximum amount liberties possible for this block size
    */
    return this.Size() * 2 + 2;
};

Block.prototype.Get_Origin = function()
{
    /*return origin pos of block
    */
    lst = this.stones.slice(0, a.length);
    lst.sort();
    return lst[0];	
};

/*Eye: collection of empty blocks and either black or white blocks

   Attributes:
   parts: list of blocks forming this eye
*/
function Eye()
{
    this.parts = [];	
}

Eye.prototype.each_Stones = function(f)
{
    /*Go through all stones in all blocks in eye
    */
    for (var b in this.parts) {
	var block = this.parts[b];
	for (var s in block.stones) {
	    var stone = block.stones[s];
	    if (f(stone) === Eye.prototype.each_Stones['break']) {
		return;
	    }
	}
    }	
};
Eye.prototype.each_Stones['continue'] = true;
Eye.prototype.each_Stones['break'] = false;

Eye.prototype.Mark_Status = function(live_color)
{
	/*Go through all stones in all blocks in eye
           All opposite colored blocks are marked dead.
           Empty blocks are marked as territory for live_color.
	*/
	for (var block in this.parts)
	{
		switch (block.color)
		{
			//note: status is not a reserved word in javascript.
		        //TODO: Also, is block an instance of Block, and if so, does it need to be declared/instantiated differently?
			case live_color:
				block.status = "alive";
			break;
			case other_side[live_color]:
				block.status = "dead";
			break;
			default:
				block.status = live_color + " territory";
			break;
		}
	}
};

/*Go board: one position in board and relevant methods

   Attributes:
   size: board size
   side: side to move
   captures: number of stones captured
   self.goban: actual board
   blocks: solidly connected group of stones or empty points as defined in Go rules
           there is reference to same block from every position block has stone
   chains: connected group of stones
           This is for v0.2 or later. Not used currently.
*/
function Board(board_size)
{ 
	/*Initialize board:
           argument: size
	*/
	this.board_size = board_size;
	this.side = BLACK;
	this.captures = [];
	this.captures[WHITE] = 0;
	this.captures[BLACK] = 0;
	this.goban = []; //actual board
	this.init_hash();
	//Create and initialize board as empty board_size*board_size
	this.each_Goban(function (pos) {
		//can't use set_goban method here, because goban doesn't yet really exists
		this.goban[pos] = EMPTY;
		this.current_hash = this.current_hash ^ this.board_hash_values[EMPTY][pos];});
	this.blocks = []; //blocks dictionary
	//Create and initialize one whole board empty block
	var new_block = new Block(EMPTY);
	this.each_goban(function (pos) {
	    new_block.add_stone(pos);
	    this.blocks[pos] = new_block;});
	this.block_list = [new_block];
	this.chains = [];
}

Board.prototype.each_Goban = function()
{
    /*This goes through all positions in goban
       Example usage: see above __init__ method
    */
    for (var x in range(1, this.board_size+1)) {
	for (var y in range(1, this.board_size+1)) {
	    return [x, y];
	}
    }
};

Board.prototype.each_Neighbour = function(pos)
{
    return function(f) {
	/*This goes through all neighbour positions in clockwise:
	  up, right, down, left
	  Example usage: see legal_move method
	*/
	var x = pos.x;
	var y = pos.y;
	for (var x2y2 in [new Pair(x,y+1), new Pair(x+1,y), new Pair(x,y-1), new Pair(x-1,y)]) {
	    if (1 <= x2y2.x && x2y2.x <= this.board_size && 1 <= x2y2.y && x2y2.y <= this.board_size) {
        	f(x2y2);
	    }
	}
    };
};
Board.prototype.each_Neighbour['continue'] = true;
Board.prototype.each_Neighbour['break'] = false;

Board.prototype.Iterate_Diagonal_Neighbour = function(pos)
{
    /*This goes through all neighbour positions in clockwise:
       NE, SE, SW, NW
       Example usage: see analyse_eye_point method
    */
    var x = pos.x;
    var y = pos.y;
    for (var x2y2 in [new Pair(x+1,y+1), new Pair(x+1,y-1), new Pair(x-1,y-1), new Pair(x-1,y+1)])
	{
        if (1 <= x2y2.x && x2y2.x <= this.board_size && 1 <= x2y2.y && x2y2.y <=this.board_size)
		{	
		    //TODO: yield (x2, y2);
		}
	}
};

Board.prototype.Iterate_Blocks = function(colors)
{
    /*This goes through all distinct blocks on board with given colors.
       Example usage: see analyze_unconditionally_alive
    */
    for (var block in this.block_list)
	{
        if (block.color in colors)
		{
		    //TODO: yield block;
		}
	}
};

Board.prototype.Iterate_Neighbour_Blocks = function(block)
{
    /*Go through all neighbour positions and add new blocks.
       Return once for each new block
    */
    var blocks_seen = [];
    for (var stone in block.neighbour)
	{
		if(blocks_seen.indexOf(this.blocks[stone]) == -1)
		{
		    //TODO: yield block2;
		    blocks_seen.push(block2);
		}
	}
};

Board.prototype.Iterate_Neighbour_Eye_Blocks = function(eye)
{
	/*First copy eye blocks to list of blocks seen
	   Then go through all neighbour positions and add new blocks.
	   Return once for each new block
	*/
        var blocks_seen = object(eye.parts);
	for (var block in eye.parts)
	{
		for (var pos in block.neighbour)
		{
			if(blocks_seen.indexOf(this.blocks[pos]) == -1)
			{
			    //TODO: yield block2;
			    blocks_seen.push(block2);
			}
		}
	}
};

Board.prototype.Init_Hash = function()
{
    /*Individual number for every possible color and position combination */
    this.board_hash_values = [];
    for (var color in EMPTY+WHITE+BLACK) {
	this.each_goban(function (pos) {
		this.board_hash_values[color] = [];
        	this.board_hash_values[color][pos] = Math.floor(Math.random() * (Number.MAX_VALUE - Number.MIN_VALUE + 1)) + Number.MIN_VALUE; //TODO: check to make sure this returns a random int in [-max, max]
	    });
    	this.current_hash = 0;
    }
};

    Board.prototype.Set_Goban = function(color, pos)
{
    /*Set stone at position to color and update hash value*/
    var old_color = this.goban[pos];
    this.current_hash = this.current_hash ^ this.board_hash_values[old_color][pos];
    this.goban[pos] = color;
    this.current_hash = this.current_hash ^ this.board_hash_values[color][pos];
};

Board.prototype.Key = function()
{
    /*This returns unique key for board.
       Returns hash value for current position (Zobrist hashing)
       Key can be used for example in super-ko detection
    */
    return this.current_hash;
};

Board.prototype.Change_Side = function()
{
	this.side = other_side[this.side];
};

Board.prototype.Are_Adjacent_Points = function(pos1, pos2)
{
    /*Tests whether pos1 and pos2 are adjacent.
       Returns True or False.
    */
    var result;
    this.each_Neighbour(pos1)(function (pos) {
	    if (pos.equals(pos2)) {
		result = true;
		return this.each_Neighbor['break'];
	    }
	    result = false;
	    return this.each_Neighbour['continue'];
	});
    return result;
};

Board.prototype.List_Empty_3x3_Neighbour = function(pos)
{
    //check normal neighbour positions first
    var neighbour_list = [];
    this.each_Neighbour(pos)(function (pos2) {
	    if (this.goban[pos2]==EMPTY) {
		neighbour_list.append(pos2);
	    }
	});
    //check diagonal neighbour positions first
    //this is done to ensure that empty block is/will not splitted
    var diagonal_neighbour_list = [];
    for (var pos2 in this.iterate_diagonal_neighbour(pos))
	{
        if (this.goban[pos2]==EMPTY)
		{
            diagonal_neighbour_list.append(pos2);
		}
	}            
    return new Pair(neighbour_list, diagonal_neighbour_list);
};

Board.prototype.Is_3x3_Empty = function(pos)
{
    if (this.goban[pos]!= EMPTY) {
	return false;
    }
    var neighbors = this.List_Empty_3x3_Neighbour(pos);
    var neighbour_list = neighbors.x;
    var diagonal_neighbour_list = neighbors.y;
    if (neighbour_list.length==4 && diagonal_neighbour_list.length==4)
	{
        return true;
	}
    return false;
};

Board.prototype.Simple_Same_Block = function(pos_list)
{
    /*Check if all positions in pos_list are in same block.
       This searches only at immediate neighbour.
       Return True if they are or False if not or can't decide with this simple search.
    */
    if (pos_list.length <= 1)
	{
        return true;
	}
    var color = this.goban[pos_list[0]];
    var temp_block = new Block(color);
    //Add all stones in pos_list and their neighbour to block if they have same color.
    for (var pos in pos_list)
	{
        temp_block.Add_Stone(pos);
        this.each_Neighbour(pos)(function (pos2) {
		if (this.goban[pos2]==color) {
		    temp_block.Add_Stone(pos2);
		}
	    });
	}    
    var new_mark = 2; //When stones are added they get by default value True (==1)
    this.flood_mark(temp_block, pos_list[0], new_mark);
    for (var pos in pos_list)
	{
        if (temp_block.stones[pos]!=new_mark)
		{
            return false;
		}
	}
    return true;
};

Board.prototype.Add_Stone = function(color, pos)
{
    /*add stone or empty at given position
       color: color of stone or empty
       pos: position of stone
       This will create new block for stone
       and add stones from same colored neighbour blocks if any.
       Also makes every position in combined block to point to block.
       Remove pos from existing block and potentially split it.
       Finally calculate new neighbours for all changed blocks:
       This is needed only when block is split into 2 or more blocks.
       Other cases are handed in need to do basis.
    */
    var old_block = this.blocks[pos];
    old_color = old_block.color;
    old_block.Remove_Stone(pos);
    if (old_block.Size() === 0)
	{
        this.block_list.Remove(old_block);
	}
    this.Set_Goban(color, pos);
    var new_block = new Block(color);
    new_block.Add_Stone(pos);
    this.Add_Block(new_block);
    var changed_blocks = []; //only those blocks that need complete neighbour calculation

    //old_block: Is anything left?
    //           Is it split into pieces?
    //new_block: Is there existing same colored neighbour blocks?
    //both and all existing neighbours: calculate neighbor list (from scratch?)
    //........OO.........
    //......OO.O.........
    //......O.!.O...OOOO.
    //.......O.OO...O..O.
    //.XXX...XX....XX.O..
    //.X.!XX.X.!XX.X.!...
    //.XXX...XX.....X.O..
    //..........X!X......
    //...........O.......

    //combine and split blocks as needed
    var split_list = [];
    this.each_neighbour(pos)(function (pos2) {
	    var other_block = this.blocks[pos2];
	    if (this.goban[pos2]==color) {
		new_block = this.Combine_Blocks(new_block, other_block);
	    }
	    else {
		new_block.neighbour[pos2] = true;
		if (this.goban[pos2]==old_color) {
		    split_list.push(pos2);
		}
	    }
	});
    //If these splits are actually trivially same: do update fast
    if (this.Simple_Same_Block(split_list))
	{
        old_block.neighbour[pos] = true;
        //are pos neighbour positions also neighbour to reduced old_block?
        this.each_Neighbour(pos)(function (pos2) {
		if (old_block.stones.indexOf(pos2) == -1) //this if is slight optimization: can't be neighbour if belongs to block
		    {
			for (var pos3 in this.Iterate_Neighbour(pos2))
			    {
				if (pos3 in old_block.stones)
				    {
					//yes, pos2 is neighbour
					return this.each_Neighbour['break'];
				    }
			    }
		    }
		else //no, it's not neighbour
		    {
	         	//was it neighbour to old_block? remove it if it is
	         	if (pos2 in old_block.neighbour)
			    {
				oldblock.neighbour.splice(old_block.neighbour.indexOf(pos2),1);
			    }
		    }
	    });
	}
    else
	{
        changed_blocks.push(old_block); //now we need this
        old_block.Mark_Stones(0);
        var last_old_mark = 0;
        for (var pos2 in split_list)
		{
            var other_block = this.blocks[pos2];
            if (other_block.stones[pos2] === 0)
			{
                last_old_mark = last_old_mark + 1;
                this.Flood_Mark(other_block, pos2, last_old_mark);
                if (last_old_mark>1)
				{
                    var splitted_block = this.Split_Marked_Group(other_block, last_old_mark);
                    this.Add_Block(splitted_block);
                    changed_blocks.push(splitted_block);
				}
			}
		}
	}
    if (pos in new_block.neighbour)
	{
        new_block.neighbour.splice(new_block.neighbour.indexOf(pos),1);
	}
    for (block in changed_blocks)
	{
        this.Calculate_Neighbour(block);
	}
	/*    for block in self.block_list:
            old_neighbour = block.neighbour
            self.calculate_neighbour(block)
            if old_neighbour!=block.neighbour:
                print old_neighbour
                print block.neighbour
                import pdb; pdb.set_trace()
	*/
};

Board.prototype.Add_Block = function(block)
{
    this.block_list.push(block);
    for (var stone in block.stones)
	{
        this.blocks[stone] = block;
	}
};

Board.prototype.Combine_Blocks = function(new_block, other_block)
{
    /*add all stones from other block to new block
       make board positions to point at new block
    */
    if (new_block==other_block) {
	return new_block;
    }
    if (new_block.Size() < other_block.Size())
	{
        //Optimization: for example if new_block size is one as is usually case and other_block is most of board as is often case when combining empty point to mostly empty board.
        new_block = other_block;
		other_block = new_block;
	}
	
    new_block.Add_Block(other_block);
    for (var stone in other_block.stones)
	{
        this.blocks[stone] = new_block;
	}
    this.block_list.splice(this.block_list.indexOf(other_block),1);
    return new_block;
};

Board.prototype.Split_Marked_Group = function(block, mark)
{
    /*move all stones with given mark to new block
       Return splitted group.
    */
    var new_block = new Block(block.color);
    for (var stone in block.stones) //TODO: is this right for block.stones.items(), which in py returns a tuple of values stored in stones?
	{
        if (stone.mark==mark) //TODO: does the stones object have this property?
		{
            block.Remove_Stone(stone);
            new_block.Add_Stone(stone);
		}
	}
    return new_block;
};

Board.prototype.Flood_Mark = function(block, start_pos, mark)
{
    /* mark all stones reachable from given
       starting position with given mark
    */
    var to_mark = [start_pos];
    while (to_mark) //TODO: what will a javascript while do when given to_mark?
	{
        var pos = to_mark.pop();
        if (block.stones[pos]==mark) {
	    continue;
	}
        block.stones[pos] = mark;
        this.each_Neighbour(pos)(function (pos2) {
		if (pos2 in block.stones)
		    {
			to_mark.push(pos2);
		    }
	    });
	}
};

Board.prototype.Calculate_Neighbour = function(block)
{
    /*find all neighbour positions for block
    */
    block.neighbour = [];
    for (var stone in block.stones)
	{
	    this.each_Neighbour(stone)(function (pos) {
		    if (block.stones.indexOf(pos) == -1)
			{
			    block.neighbour[pos] = true;
			}
		});
	}
};

Board.prototype.Change_Block_Color = function(color, pos)
{
    /*change block color and
       set same color to all block positions in goban
    */
    var block = this.blocks[pos];
    block.color = color;
    for (var pos2 in this.blocks[pos].stones)
	{
        this.Set_Goban(color, pos2);
	}
};

Board.prototype.Remove_Block = function(pos)
{
    this.Change_Block_Color(EMPTY, pos);
};

Board.prototype.List_Block_Liberties = function(block)
{
    /*Returns list of liberties for block of stones.
    */
    var liberties = [];
    for (var pos2 in block.neighbour)
	{
        if (this.goban[pos2]==EMPTY)
		{
            liberties.push(pos2);
		}
	}
    return liberties;
};

Board.prototype.Block_Liberties = function(block)
{
    /*Returns number of liberties for block of stones.
    */
    var liberties = this.List_Block_Liberties(block);
    return liberties.length;
};

Board.prototype.Liberties = function(pos)
{
    /*Returns number of liberties for block of stones in given position.
    */
    return this.Block_Liberties(this.blocks[pos]);
};

Board.prototype.Initialize_Undo_Log = function()
{
    /*Start new undo log
    */
    this.undo_log = [];
};

Board.prototype.Add_Undo_Info = function(method, color, pos)
{
    /* Add info needed to undo move
       at start of log.
       Its added to start because changes are undone in reverse direction.
    */
    this.undo_log.splice(0, 0, [method, color, pos]);
};

Board.prototype.Apply_Undo_Info = function(method, color, pos)
{
    /*Apply given change to undo part of move.
    */
    if (method.name=="add_stone") //TODO: is method.name the property match?
	{
        this.Add_Stone(color, pos);
	}
    else if (method.name=="change_block_color")
	{
        this.Change_Block_Color(color, pos);
	}
};

Board.prototype.Legal_Move = function(move)
{
    /*Test whether given move is legal.
       Returns truth value.
    */
    if (move==PASS_MOVE)
	{
        return true;
	}
    if (this.goban.indexOf(move) == -1) {
	return false;
    }
    if (self.goban[move]!=EMPTY) {
	return false;
    }

    var result;
    this.each_Neighbour(move)(function (pos) {
	    if (this.goban[pos]==EMPTY) {
		result = true;
		return this.each_Neighbour['break'];
	    }
	    if (this.goban[pos]==this.side && this.Liberties(pos)>1) {
		result = true;
		return this.each_Neighbour['break'];
	    }
	    if (this.goban[pos]==other_side[this.side] && this.Liberties(pos)==1) {
		result = true;
		return this.each_Neighbour['break'];
	    }
	});
    if (result !== undefined) return result;

    return false;
};

Board.prototype.Make_Move = function(move)
{
    /*Make move given in argument.
       Returns move or None if illegl.
       First we check given move for legality.
       Then we make move and remove captured opponent groups if there are any.
       While making move record what is needed to undo the move.
    */
    this.Initialize_Undo_Log();
    if (move==PASS_MOVE)
	{
        this.Change_Side();
        return move;
	}
    if (this.Legal_Move(move))
	{
	this.Add_Stone(this.side, move);
	this.Add_Undo_Info("add_stone", EMPTY, move);
        var remove_color = other_side[this.side];
        this.each_Neighbour(move)(function (pos) {
		if (this.goban[pos] == remove_color && this.Liberties(pos) === 0)
		    {
			this.Remove_Block(pos);
			this.Add_Undo_Info("change_block_color", remove_color, pos);
		    }
	    });
        this.Change_Side();
        return move;
	}
    return null;
};

Board.prototype.Undo_Move = function(undo_log)
{
	/*Undo move using undo_log.
	*/
    this.Change_Side();
    for (var method_color_pos in undo_log)
	{
	    this.Apply_Undo_Info(
				 method_color_pos[0],
				 method_color_pos[1],
				 method_color_pos[2]);
	}
};

Board.prototype.Analyse_Eye_Point = function(pos, other_color)
{
    /* Analyse one point for eye type.
       If not empty or adjacent to other color: return None.
       Otherwise analyse True/False status of eye.

       True(!) and false(?) eyes.
       XXX XXO XXO XXO OXO OXO
       X!X X!X X?X X?X X?X X?X
       XXX XXX OXX XXO XXO OXO
       
       --- --- --- +-- +--
       X!X X?X X?X |!X |?X
       XXX XXO OXO |XX |XO
       
       2 empty points: True(!) and false(?) eyes.
       This works just fine with normal (false) eye code.
       XXXX XXXO XXXO XXXO OXXO OXXO
       X!!X X!!X X!!X X!?X X!?X X??X
       XXXX XXXX OXXX XXXO XXXO OXXO
       
       ---- ---- ---- +--- +---
       X!!X X!?X X??X |!!X |!?X
       XXXX XXXO OXXO |XXX |XXO
       
       3 empty points in triangle formation: True(!) and false(?) eyes.
       This works just fine with normal (false) eye code.
       XXXX XXXO XXXO XXXO OXXO OXXO
       X!!X X!!X X!!X X!!X X!!X X?!X
       XX!X XX!X OX!X XX!X XX!X OX!X
        XXX  XXX  XXX  XXO  XXO  XXO
       
       XXXX XXXO XXXO XXXO OXXO OXXO
       X!!X X!!X X!!X X!!X X!!X X?!X
       XX!X XX!X OX!X XX?X XX?X OX?X
        OXX  OXX  OXX  OXO  OXO  OXO
    */

    if (this.goban[pos]!=EMPTY)
	{
        return null;
	}
    this.each_Neighbour(pos)(function (pos2) {
	    if (this.goban[pos2]==other_color) {
		return null;
	    }
	});
    var total_count = 0;
    var other_count = 0;
    for (var pos2 in this.Iterate_Diagonal_Neighbour(pos)) {
        total_count = total_count + 1;
        if (this.goban[pos2]==other_color) {
	    other_count = other_count + 1;
	}
    }
    if (total_count==4)
	{
	    return (!(other_count > 1));
	}
    else
	{
	    return (!(other_count > 0));
	}
};

Board.prototype.Analyse_Opponent_Stone_As_Eye_Point = function(pos)
{
    /* Analyse one point for eye type.
       Otherwise analyse True/False status of eye.
       Only take into account live other color stones.
       

       True(O) and false(o) eyes.
       @ == unconditionally live O stone.
       XXX XX@ XX@ XX@ @X@ @X@
       .OX .OX .oX .oX .oX .oX
       XXX XXX @XX XX@ XX@ @X@
       
       --- --- --- +-- +--
       .OX .oX .oX |O. |o.
       XXX XX@ @X@ |XX |X@
       
    */
    var total_count = 0;
    var other_count = 0;
    var color = this.goban[pos];
    for (var pos2 in this.Iterate_Diagonal_Neighbour(pos))
	{
        total_count = total_count + 1;
        if (this.goban[pos2]==color && this.blocks[pos2].status=="alive")
		{
            other_count = other_count + 1;
		}
	}
    if (total_count==4)
	{
	    return (!(other_count > 1));
	}
    else
	{
	    return (!(other_count > 0));
	}
};

Board.prototype.Analyze_Color_Unconditional_Status = function(color)
{
    /* This is Benson's Algorithm for unconditional life.
	   1) List potential eyes (eyes: empty+opponent areas flood filled):
          all empty points must be adjacent to those neighbour blocks with given color it gives eye.
       2) List all blocks with given color
          that have at least 2 of above mentioned areas adjacent
          and has empty point from it as liberty.
       3) Go through all potential eyes. If there exists neighbour
          block with less than 2 eyes: remove this this eye from list.
       4) If any changes in step 3, go back to step 2.
       5) Remaining blocks of given color are unconditionally alive and
          and all opponent blocks inside eyes are unconditionally dead.
       6) Finally update status of those blocks we know.
       7) Analyse dead group status.

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
         ABCDEFGHI

         ABCDE
        +-----+
       5|.....|
       4|.XXX.|
       3|.X.X.|
       2|X.X..|
       1|XXX..|
        +-----+
         ABCDE

         ABCDEFGH
        +--------+
       8|........| 8
       7|..XXXXXX| 7
       6|..X..X.X| 6
       5|.XOOOXXX| 5
       4|.X..X...| 4
       3|.XXXX...| 3
       2|..X.X...| 2
       1|..XXX...| 1
        +--------+
       
         ABC
        +---+
       3|OO.| 3
       2|OXX| 2
       1|.OX| 1
        +---+
         ABC
        
         ABC
        +---+
       3|.OO| 3
       2|O.O| 2
       1|.O.| 1
        +---+
         ABC

         ABCDE
        +-----+
       5|X.XO.| 5
       4|.XXOO| 4
       3|X.XO.| 3
       2|OXXO.| 2
       1|.OXO.| 1
        +-----+
         ABCDE

         ABCDE
        +-----+
       5|X.X.O| 5
       4|.XX.O| 4
       3|X.X.O| 3
       2|OXXO.| 2
       1|.OX..| 1
        +-----+
         ABCDE
       
         ABCDEFGHJK
        +----------+
      10|XX.XOO.XX.|10
       9|.OXXXOXX.X| 9
       8|OXX.OXOOXX| 8
       7|OOOXXX.XX.| 7
       6|OXXOOXX.OX| 6
       5|X.X.X..XX.| 5
       4|XXOXXXXOOX| 4
       3|.XOXXXXOOX| 3
       2|XOOOXOOO.X| 2
       1|.OOXXOOOOX| 1
        +----------+
         ABCDEFGHJK
       
         ABCDEFGHJ
        +---------+
       9|O.O.O..X.| 9
       8|.O.O..XX.| 8
       7|O.OO.XX.O| 7
       6|OX.O.X.O.| 6
       5|.O.O.X.O.| 5
       4|O.O..XO.O| 4
       3|.OO..OXO.| 3
       2|OO.O.OXXX| 2
       1|..O.XX.X.| 1
        +---------+
         ABCDEFGHJ

         ABCDE
        +-----+
       5|.OOO.| 5
       4|OXXXO| 4
       3|OX.XO| 3
       2|OXXXO| 2
       1|.OOO.| 1
        +-----+
         ABCDE

         ABCDE
        +-----+
       5|!!?.?| 5
       4|XXXOX| 4
       3|XXXOO| 3
       2|.OOO.| 2
       1|?XO.O| 1
        +-----+
         ABCDE

         ABCDE
        +-----+
       5|XXXO.| 5
       4|X.XO.| 4
       3|XXOOO| 3
       2|X.XOO| 2
       1|XXXO.| 1
        +-----+
         ABCDE
       
         ABCDEFG
        +-------+
       7|.OOOOX.| 7
       6|OXXXOX.| 6
       5|OX.XOX.| 5
       4|OOXOOXX| 4
       3|OX.XOX.| 3
       2|OXXXOX.| 2
       1|.OOOOX.| 1
        +-------+
         ABCDEFG
       
         ABCDEFG
        +-------+
       7|OOOOOOO| 7
       6|OOXXXXO| 6
       5|OXXX.XO| 5
       4|OOOXXXO| 4
       3|O.XX.XO| 3
       2|OOOXXXO| 2
       1|O..OOOO| 1
        +-------+
         ABCDEFG
       
         ABCDEFG
        +-------+
       7|.O.OOX.| 7
       6|OXXXOX.| 6
       5|OX.XOX.| 5
       4|OXXOOXX| 4
       3|OX.XOX.| 3
       2|OXXXOX.| 2
       1|.OOOOX.| 1
        +-------+
         ABCDEFG
       
         ABCDEFG
        +-------+
       7|OO.OOO.| 7
       6|OXXXOOO| 6
       5|OX.XOXX| 5
       4|OXXOOX.| 4
       3|OX.XOXX| 3
       2|OXXXOX.| 2
       1|.OOOOX.| 1
        +-------+
         ABCDEFG
       
         ABCDEFG
        +-------+
       7|.OOOOX.| 7
       6|OXXXOX.| 6
       5|OX.XOX.| 5
       4|O.X.OXX| 4
       3|OX.XOX.| 3
       2|OXXXOX.| 2
       1|.OOOOX.| 1
        +-------+
         ABCDEFG
                  
         ABCDEFG
        +-------+
       7|OOOOOOO| 7
       6|OXXXXXO| 6
       5|OX.X.XO| 5
       4|OXX.XXO| 4
       3|OXXXXXO| 3
       2|OXOOOXO| 2
       1|OO?!?OO| 1
        +-------+
         ABCDEFG
                  
         ABCDEFGHJ
        +---------+
       9|.XXXXXXO.| 9
       8|OXOOO.XOO| 8
       7|OXO.O.XO.| 7
       6|OXXO.OXOO| 6
       5|O.XOOOXXO| 5
       4|O.XXXX?!X| 4
       3|OOOOOOX?X| 3
       2|.O.O.OOXO| 2
       1|.O.O..OOO| 1
        +---------+
         ABCDEFGHJ

         ABCDEFGHJ
        +---------+
       9|XXXXXXO..| 9
       8|XOOOXXOOO| 8
       7|XO.OX.O..| 7
       6|XOOXXOOO.| 6
       5|X.OXOXXOO| 5
       4|XOOXX?!XO| 4
       3|XO.OOX?XO| 3
       2|XOOOOOXOO| 2
       1|XXXXXXXO.| 1
        +---------+
         ABCDEFGHJ

         ABCDEF
        +------+
       6|?....?| 6
       5|.XXXX.| 5
       4|.X.X.?| 4
       3|?.X.X.| 3
       2|!.XXX.| 2
       1|!?...?| 1
        +------+
         ABCDEF

         ABCDEF
        +------+
       6|O!O!!!| 6
       5|!OOOOO| 5
       4|OO.OXX| 4
       3|X.O?X.| 3
       2|OOXXOO| 2
       1|!OOOO!| 1
        +------+
         ABCDEF

         ABCDEFG
        +-------+
       7|O.O....| 7
       6|.OOOOOO| 6
       5|OO.OXXX| 5
       4|X.O.X..| 4
       3|OOXOXXX| 3
       2|.OOOOOO| 2
       1|O.O....| 1
        +-------+
         ABCDEFG

         ABCDEFGHJ
        +---------+
       9|.........| 9
       8|.OOOOOOO.| 8
       7|.OXXXXXO.| 7
       6|.OX.O.XO.| 6
       5|.OOXXXOO.| 5
       4|.OO.X.OO.| 4
       3|.OXXXXXO.| 3
       2|OOX.O.XOO| 2
       1|.OXXXXXO.| 1
        +---------+
         ABCDEFGHJ

         ABCDEFG
        +-------+
       7|OOOOOOO| 7
       6|OXXXXXO| 6
       5|OX.X.XO| 5
       4|OXX.XXO| 4
       3|OXXXXXO| 3
       2|OXOOOXO| 2
       1|OO?X?OO| 1
        +-------+
         ABCDEFG
    */

	//find potential eyes
    var eye_list = [];
    var not_ok_eye_list = []; //these might still contain dead groups if totally inside live group
    var eye_colors = EMPTY + other_side[color]; //TODO: I don't understand this assignment
    for (var block in self.iterate_blocks(EMPTY+WHITE+BLACK))
{
        block.eye = null;
}
    for (block in this.Iterate_Blocks(eye_colors))
	{
	    if (block.eye) {
		continue; //TODO: not sure how js will evaluate that conditional
	    }
        var current_eye = new Eye();
        eye_list.push(current_eye);
        var blocks_to_process = [block];
        while (blocks_to_process) //TODO: not sure how js will evaluate this conditional
		{
            var block2 = blocks_to_process.pop();
            if (block2.eye) {
		continue;
	    }
            block2.eye = current_eye;
            current_eye.parts.push(block2);
            for (var pos in block2.neighbour)
			{
                var block3 = this.blocks[pos];
                if (block3.color in eye_colors && !block3.eye)
				{
                    blocks_to_process.push(block3);
				}
			}
		}
	}
	//check that all empty points are adjacent to our color
    var ok_eye_list = [];
    for (var eye in eye_list)
	{
        var prev_our_blocks = null;
        eye_is_ok = false;
	eye.each_Stones(function (stone) {
		if (this.goban[stone]!=EMPTY) {
		    return eye.each_Stones['continue'];
		}
		eye_is_ok = true;
		var our_blocks = [];
		this.each_Neighbour(stone)(function (pos) {
			var block = this.blocks[pos];
			if (block.color == color && (our_blocks.indexOf(block) !== -1)) {
			    our_blocks.push(block);
			}
		    });
		//list of blocks different than earlier
		if ((prev_our_blocks !== null) && (prev_our_blocks != our_blocks)) {
		    var ok_our_blocks = [];
		    for (var block in our_blocks) {
			if (block in prev_our_blocks) {
			    ok_our_blocks.push(block);
			}
		    }
		    our_blocks = ok_our_blocks;
		}
		//this empty point was not adjacent to our block or there is no block that has all empty points adjacent to it
		if (!our_blocks) {
		    eye_is_ok = false;
		    return eye.each_Stones['break'];
		}                
		prev_our_blocks = our_blocks;
	    });
        if (eye_is_ok)
		{
            ok_eye_list.push(eye);
            eye.our_blocks = our_blocks;
		}
        else
		{
            not_ok_eye_list.push(eye);
            //remove reference to eye that is not ok
            for (block in eye.parts)
			{
                block.eye = null;
			}
		}
	}
	
    eye_list = ok_eye_list;

    //first we assume all blocks to be ok
    for (var block in this.Iterate_Blocks(color))
	{
        block.eye_count = 2;
	}
    //main loop: at end of loop check if changes
    while (true)
	{
        var changed_count = 0;
        for(var block in this.Iterate_Blocks(color))
		{
            //not really needed but short and probably useful optimization
		    if (block.eye_count < 2) {
			continue;
		    }
            //count eyes
            var block_eye_list = [];
            for (var stone in block.neighbour)
			{
                var eye = this.blocks[stone].eye;
                if (eye && block_eye_list.indexOf(eye) == -1) //TODO: how will js evaluate 'eye' in conditional? what is the point of using eye?
				{ 
					block_eye_list.push(eye);
				}
			}
            //count only those eyespaces which have empty point(s) adjacent to this block
            block.eye_count = 0;
            for (var eye in block_eye_list)
			{
			    if (contains(eye.our_blocks, block, deepValueEquality))
				{
                    block.eye_count = block.eye_count + 1;
				}
			}
            if (block.eye_count < 2)
			{
                changed_count = changed_count + 1;
			}
		}
        //check eyes for required all groups 2 eyes
        var ok_eye_list = [];
        for (var eye in eye_list)
		{
            eye_is_ok = true;
            for (var block in this.Iterate_Neighbour_Eye_Blocks(eye))
			{
                if (block.eye_count < 2)
				{
                    eye_is_ok = false;
                    break;
				}
			}
            if (eye_is_ok)
			{
                ok_eye_list.push(eye);
			}
            else
			{
                changed_count = changed_count + 1;
                not_ok_eye_list.push(eye);
                //remove reference to eye that is not ok
                for (block in eye.parts)
				{
                    block.eye = null;
				}
			}
            eye_list = ok_eye_list;
		}
        if (changed_count === 0)
		{
            break;
		}
	}
    //mark alive and dead blocks
    for (var block in this.Iterate_Blocks(color))
	{
        if (block.eye_count >= 2)
		{
            block.status = "alive";
		}
	}
    for (var eye in eye_list)
	{
        eye.Mark_Status(color);
	}
    //Unconditional dead part:
    //Mark all groups with only 1 potential empty point and completely surrounded by live groups as dead.
    //All empty points adjacent to live group are not counted.
    for (eye_group in not_ok_eye_list)
	{
        eye_group.dead_analysis_done = false;
	}
    for (eye_group in not_ok_eye_list)
	{
	    if (eye_group.dead_analysis_done) {
		continue;
	    }
        eye_group.dead_analysis_done = true;
        var true_eye_list = [];
        var false_eye_list = [];
        var eye_block = new Block(eye_colors);
        //If this is true then creating 2 eyes is impossible or we need to analyse false eye status.
       //If this is false, then we are unsure and won't mark it as dead.
        var two_eyes_impossible = true;
        var has_unconditional_neighbour_block = false;
        var maybe_dead_group = new Eye();
        var blocks_analysed = [];
        var blocks_to_analyse = object(eye_group.parts);
        while ((blocks_to_analyse.length > 0) && two_eyes_impossible)
		{
            var block = blocks_to_analyse.pop();
            if (block.eye)
			{
                block.eye.dead_analysis_done = true;
			}
            blocks_analysed.push(block);
            if (block.status=="alive")
			{
                if (block.color==color)
				{
                    has_unconditional_neighbour_block = true;
				}
                else
				{
                    two_eyes_impossible = false;
				}
                continue;
			}
            maybe_dead_group.parts.push(block);
            for (var pos in block.stones)
			{
                eye_block.Add_Stone(pos);
                if (block.color==EMPTY)
				{
                    eye_type = this.Analyse_Eye_Point(pos, color);
				}
                else if (block.color==color)
				{
                    eye_type = this.Analyse_Opponent_Stone_As_Eye_Point(pos);
				}
                else
				{
                    continue;
				}
                if (eye_type === null)
				{
                    continue;
				}
                if (eye_type === true)
				{
                    if (true_eye_list.length === 2)
					{
                        two_eyes_impossible = false;
                        break;
					}
                    else if (true_eye_list.length === 1)
					{
                        if (this.Are_Adjacent_Points(pos, true_eye_list[0]))
						{
                            //Second eye point is adjacent to first one.
                            true_eye_list.push(pos);
						}
                        else
 						{
							//Second eye point is not adjacent to first one.
                            two_eyes_impossible = false;
                            break;
						}
					}
                    else
					{
						//len(empty_list) == 0
                        true_eye_list.push(pos);
					}
				}
                else
				{
					//eye_type==False
                    false_eye_list.push(pos);
				}
			}
            if (two_eyes_impossible)
			{
                //bleed to neighbour blocks that are at other side of blocking color block:
                //consider whole area surrounded by unconditional blocks as one group
                for (var pos in block.neighbour)
				{
                    var block = this.blocks[pos];
                    if (blocks_analysed.indexOf(block) == -1 && blocks_to_analyse.indexOf(block) == -1)
					{
                        blocks_to_analyse.push(block);
					}
				}
			}
		}            
        //must be have some neighbour groups:
        //for example board that is filled with stones except for one empty point is not counted as unconditionally dead
        if (two_eyes_impossible && has_unconditional_neighbour_block)
		{
            if ((true_eye_list.length > 0 && false_eye_list.length > 0) || false_eye_list.length >= 2)
			{
                //Need to do false eye analysis to see if enough of them turn to true eyes.
                var both_eye_list = true_eye_list.concat(false_eye_list);
                var stone_block_list = [];
                //Add holes to eye points
                for (var eye in both_eye_list)
				{
                    eye_block.Remove_Stone(eye);
				}
                //Split group by eyes.
                var new_mark = 2; //When stones are added they get by default value true (==1)
                for (var eye in both_eye_list)
				{
				    this.each_Neighbour(eye)(function (pos) {
					    if (eye_block.stones.indexOf(pos) != -1) {
						this.Flood_Mark(eye_block, pos, new_mark);
						var splitted_block = this.split_marked_group(eye_block, new_mark);
						stone_block_list.push(splitted_block);
					    }
					});
				}
                //Add eyes to block neighbour.
                for (var eye in both_eye_list)
				{
				    this.each_Neighbour(eye)(function (pos) {
					    for (var block in stone_block_list)
						{
						    if (block.stones.indexOf(pos) != -1)
							{
							    block.neighbour[eye] = true;
							}
						}
					});
				}
                //main false eye loop: at end of loop check if changes
                while (true)
				{
				    var changed_count = 0;
                    //Remove actual false eyes from list.
                    for (block in stone_block_list)
					{
                        if (block.neighbour.length==1)
						{
                             var neighbour_list = block.neighbour.keys();
                             var eye = neighbour_list[0];
                             both_eye_list.remove(eye);
                             //combine this block and eye into other blocks by 'filling' false eye
                             block.Add_Stone(eye);
                             for (var block2 in object(stone_block_list))
							{
                                 if ((block!=block2) && (block2.neighbour.indexOf(eye) != -1))
								{
                                    block.Add_Block(block2);
										stone_block_list.splice(stone_block_list.indexOf(block2),1);
								}
							}
                            block.neighbour.splice(block.neighbor.indexOf(eye),1);
                             changed_count = changed_count + 1;
                             break; //we have changed stone_block_list, restart
						}
					}
                    if (changed_count.length === 0)
					{
                        break;
					}
				}
                //Check if we have enough eyes.
                if (both_eye_list.length > 2)
				{
                    two_eyes_impossible = false;
				}
                else if (both_eye_list.length == 2)
				{
                    if (!this.Are_Adjacent_Points(both_eye_list[0], both_eye_list[1]))
					{
                        two_eyes_impossible = false;
					}
				}
			}
            //False eye analysis done: still surely dead
            if (two_eyes_impossible)
			{
                maybe_dead_group.Mark_Status(color);
			}
		}
	}
};

Board.prototype.Analyze_Unconditional_Status = function()
{
    /*Analyze unconditional status for each color separately
    */
    //Initialize status to unknown for all blocks
    for (var block in this.Iterate_Blocks(BLACK+WHITE+EMPTY)) //TODO: What does this argument resolve to in py?
	{
        block.status = "unknown";
	}
    //import pdb; pdb.set_trace()
    this.Analyze_Color_Unconditional_Status(BLACK);
    this.Analyze_Color_Unconditional_Status(WHITE);
    //cleanup
    for (var block in this.Iterate_Blocks(BLACK+WHITE+EMPTY))
	{
        block.eye = null;
	}
};

Board.prototype.Has_Block_Status = function(colors, status)
{
    for (var block in this.Iterate_Blocks(colors))
	{
	    if (block.status==status) {
		return true;
	    }
	}
    return false;
};

Board.prototype.Territory_As_Dict = function()
{
    var territory = [];
    for (var block in this.Iterate_Blocks(EMPTY))
	{
        if ((block.status==(WHITE + " territory")) || (block.status==(BLACK + " territory")))
		{
            territory.Update(block.stones);
		}
	}
    return territory;
};

Board.prototype.Score_Stone_Block = function(block)
{
    /* Score white/black block.
       All blocks whose status we know will get full score.
       Other blocks with unknown status will get score depending on their liberties and number of stones.

       ....8....8-4=4....
       ...XXX...XXX.O....
       ..................
       .7-4=3..6-2=4.....
       ....XX...XX..7-3=4
       .....X...OX...XXX.
       ...............O..
       .....O............
       ..................
       ..................

       ..................
       .....@OOO.........
       .AXXXBxxxO........
       .....@OOO.........
       ..................
       ..................
       @:filled(@) or empty(.)
       s = block.size()
       l = block.liberties()
       L = block.max_liberties()
       s * l / L
       X:3
       x:3/8(.375)
       AX:4 
       XBx@:7*7/16(3.0625)
       XBx.:7*9/16(3.9375)
       X+x:3.375
       AX+x:4.375
       
       r = l / L
       s * (1 - (1-r)^2)
       X:3
       x:0.703125
       AX:4
       XBx@:4.78515625
       XBx.:5.66015625
       X+x:3.703125
       AX+x:4.703125

       ..................
       .....@OO..........
       ..AXXBxxO.........
       .....@OO..........
       ..................
       ..................
       r = l / L
       s * (1 - (1-r)^2)
       X:2
       x:0.611111111112
       X+x:2.611111111112
       AX:3
       AX+x:3.611111111112
       XBx@:3.29861111112
       XBx.:4.13194444444
       
       0.525 A3
       0.2296875 B3
       0.0875 C1
       -0.13125 C3

         ABC    A3
        +---+
       3|x..|3  X:1.5
       2|OXX|2  x:0.4375
       1|.o.|1  O:-0.4375
        +---+    :1.5
         ABC

         ABC    B3
        +---+
       3|.X.|3  X:1.828125
       2|OXX|2  O:-0.75
       1|.o.|1   :1.078125
        +---+   ->.328125
         ABC
    */

	var score = 0;
    if (block.status=="alive")
	{
        score = block.Size();
	}
    else if (block.status=="dead")
	{
        score = - block.Size();
	}
    else
	{
        var liberties = this.Block_Liberties(block);
        //grant half liberty for each neightbour stone in atari
        for (var block2 in this.Iterate_Neighbour_Blocks(block))
		{
            if (block2.color==other_side[block.color] && (this.Block_Liberties(block2)==1))
			{
                for (var stone in block.neighbour)
				{
                    if (stone in block2.stones)
					{
                        liberties = liberties + 0.5;
					}
				}
			}
		}
        var liberty_ratio = liberties / block.Max_Liberties();
        score = block.Size() * normal_stone_value_ratio * (1 - pow(1-liberty_ratio, 2));
	}
    return score;
};

Board.prototype.Score_Block = function(block)
{
    /*Score block.
       All blocks whose status we know will get full score.
       White/black blocks will be scored by separate method and
       then we change sign if block was for other side.
    */
	var score = 0;
    if (block.color==EMPTY)
	{
        if (block.status==this.side + " territory")
		{
            score = block.Size();
		}
        else if (block.status==other_side[this.side] + " territory")
		{
            score = -block.Size();
		}
        else //empty block with unknown status
		{
            score = 0;
		}
	}
    else
	{
        if (block.color==this.side)
		{
            score = this.Score_Stone_Block(block);
		}
        else //block.color==other_side[self.side]
		{
			score = -this.Score_Stone_Block(block);
		}
	}
    return score;
};

Board.prototype.Score_Position = function()
{
    /* Score position.
       Analyze position and then sum score for all blocks.
       All blocks whose status we know will get full score.
       Returned score is from side to move viewpoint.
    */
    var score = 0;
    this.Analyze_Unconditional_Status();
    for (block in this.Iterate_Blocks(BLACK+WHITE+EMPTY))
	{
        score = score + this.Score_Block(block);
	}
    return score;
};

Board.prototype.Unconditional_Score = function(color)
{
    var score = 0;
    this.Analyze_Unconditional_Status();
    for (var block in this.Iterate_Blocks(WHITE+BLACK+EMPTY))
	{
        if ((block.status == (color + " territory")) || (block.color == color && block.status == "alive") || (block.color == other_side[color] && block.status == "dead"))
		{
            score = score + block.Size();
		}
	}
    return score;
};

Board.prototype.toString = function()
{
    /* Convert position to string suitable for printing to screen.
       Returns board as string.
    */
    var s = this.side + " to move:\n";
    s = s + "Captured stones: ";
    s = s + "White: " + this.captures[WHITE].toString();
    s = s + " Black: " + this.captures[BLACK].toString() + "\n";
    var board_x_coords = "   " + x_coords_string.slice(0, this.size);
    s = s + board_x_coords + "\n";
    s = s + "  +" + "-"*this.size + "+\n";

	var board_y_coord = "";
    for (var y in range(this.size, 0, -1)) //TODO: what is range()?
	{
        if (y < 10)
		{
            board_y_coord = " " + y.toString();
		}
        else
		{
            board_y_coord = y.toString();
		}
        var line = board_y_coord + "|";
        for (var x in range(1, self.size+1)) //TODO: I'm uncertain about this loop as well.
		{
            line = line + this.goban[x][y];
		}
        s = s + line + "|" + board_y_coord + "\n";
	}
    s = s + "  +" + "-"*this.size + "+\n";
    s = s + board_x_coords + "\n";
    return s;
};

Board.prototype.As_String_With_Unconditional_Status = function()
{
    /*Convert position to string suitable for printing to screen.
       
       Each position gets corresponding character as defined here:
       Empty          : .
       Black          : X
       White          : O
       Alive black    : &
       Alive white    : @
       Dead black     : x
       Dead white     : o
       White territory: =
       Black territory: :
       
       Returns board as string.
    */
    var color_and_status_to_character =
      function () {
	var c = {};
	c[EMPTY + "unknown"] = EMPTY;
	c[BLACK + "unknown"] = BLACK;
	c[WHITE + "unknown"] = WHITE;
	c[BLACK + "alive"] = "&";
	c[WHITE + "alive"] = "@";
	c[BLACK + "dead"] = "x";
	c[WHITE + "dead"] = "o";
	c[EMPTY + WHITE + " territory"] = "=";
	c[EMPTY + BLACK + " territory"] = ":";
	return c;
      }();
    this.Analyze_Unconditional_Status();
    var s = this.side + " to move:\n";
    s = s + "Captured stones: ";
    s = s + "White: " + this.captures[WHITE].toString();
    s = s + " Black: " + this.captures[BLACK].toString() + "\n";
	var board_x_coords = "   " + x_coords.slice(0, this.size).toString(); //TODO: not sure about this syntax
    s = s + board_x_coords + "\n";
    s = s + "  +" + "-"*this.size + "+\n";
    for (var y in range(this.size, 0, -1)) //TODO: range?
	{
		var board_y_coord = "";
        if (y < 10)
		{
            board_y_coord = " " + y.toString();
		}
        else
		{
            board_y_coord = y.toString();
		}
        var line = board_y_coord + "|";
        for (var x in range(1, this.size+1)) //TODO: range?
		{
		    var pos_as_character = color_and_status_to_character[this.goban[x][y] + this.blocks[x][y].status];
            line = line + pos_as_character;
		}
        s = s + line + "|" + board_y_coord + "\n";
	}
    s = s + "  +" + "-"*this.size + "+\n";
    s = s + board_x_coords + "\n";
    return s;
};

/* Game class: record and move generation

   Attributes:
   size: board size
   current_board: current board position
   move_history: past moves made
   undo_history: undo info for each past move
   position_seen: keeps track of position seen: this is used for super-ko detection
*/

function Game(size)
{
        /*Initialize game:
           argument: size
        */
        this.size = size;
        this.current_board = new Board(size);
        this.move_history = [];
        this.undo_history = [];
        this.position_seen = [];
        this.position_seen[this.current_board.Key()] = true;
}

Game.prototype.Make_Unchecked_Move = function(m)
{
    /* This is utility method.
       This does not check legality.
       It makes move in current_board and returns undo log and also key of new board
    */
    this.current_board.Make_Move(m);
    var undo_log = this.current_board.undo_log;
    var board_key = this.current_board.Key();
    return move(undo_log, board_key);
};

Game.prototype.Legal_Move = function(move)
{
    /* check whether move is legal
       return truth value
       first check move legality on current board
       then check for repetition (situational super-ko)
    */

    if (move==PASS_MOVE) {
	return true;
    }
    if (!this.current_board.Legal_Move(move)) {
	return false;
    }
    var undo_log, board_key = this.Make_Unchecked_Move(move); //TODO: going back to the earlier question on returning a tuple, does this assignment work?
    this.current_board.Undo_Move(undo_log);
    if (contains(position_seen, board_key, deepValueEquality)) {
	return false;
    }
    return true;
};

Game.prototype.Make_Move = function(move)
{
    /* make given move and return new board
       or return None if move is illegal
       First check move legality.
       This checks for move legality for itself to avoid extra make_move/make_undo.
       This is a bit more complex but maybe 2-3x faster.
       Then make move and update history.
    */
    if (!this.current_board.Legal_Move(move)) {
	return null;
    }
    var undo_log, board_key = this.Make_Unchecked_Move(move); //TODO: see earlier question
    if (move!=PASS_MOVE && (this.position_seen.indexOf(board_key) == -1))
	{
        this.current_board.Undo_Move(undo_log);
        return null;
	}
    this.undo_history.Append(undo_log);
    this.move_history.Append(move);
    if (move!=PASS_MOVE)
	{
        this.position_seen[board_key] = true;
	}
    return this.current_board;
};

Game.prototype.Undo_Move = function()
{
    /*undo latest move and return current board
       or return None if at beginning.
       Update repetition history and make previous position current.
    */
    if (!this.move_history) {
	return null;
    }
    var last_move = this.move_history.pop();
    if (last_move!=PASS_MOVE)
	{
	    this.position_seen.splice(this.current_board.key(), 1);
	}
    var last_undo_log = this.undo_history.pop();
    this.current_board.Undo_Move(last_undo_log);
    return this.current_board;
};

Game.prototype.Iterate_Moves = function()
{
    /* Go through all legal moves including pass move
    */
    //TODO: yield PASS_MOVE;
    this.current_board.each_Goban(function (move) {
	    if (this.Legal_Move(move))
		{
		    //TODO: yield move;
		}
	});
};

Game.prototype.List_Moves = function()
{
    /* return all legal moves including pass move
    */
    var all_moves = [PASS_MOVE];
    for (var move in this.current_board.Ierate_Goban())
	{
	    if (this.Legal_Move(move)) {
		    all_moves.push(move);
		}
	}
    return all_moves;
};

Game.prototype.Score_Move = function(move)
{
    /* Score position after move
       and go through moves that capture block that is part of move if any.
       Return best score from these.
    */
    this.Make_Move(move);
    var cboard = this.current_board;
    var best_score = cboard.Score_Position();
    if (move!=PASS_MOVE)
	{
        var block = cboard.blocks[move];
        var liberties = cboard.List_Block_Liberties(block);
        //Check if this group is now in atari.
        if (liberties.length()==1)
		{
            var move2 = liberties[0];
            if (this.Make_Move(move2))
			{
                //get score from our viewpoint: negative of opponent score
                var score = -cboard.Score_Position();
                if (score > best_score)
				{
                   best_score = score;
				}
                this.Undo_Move();
			}
		}
        else
		{
            //Check if some our neighbour group is in atari instead.
		    cboard.each_Neighbour(move)(function (stone) {
			    var block = cboard.blocks[stone];
			    if (block.color==cboard.side && cboard.Block_Liberties(block)==1)
				{
				    //make_move later changes block.neighbour dictionary in some cases so this is needed
				    for (var block2 in list(cboard.Iterate_Neighbour_Blocks(block))) // TODO: what is list()?
					{
					    var liberties = cboard.List_Block_Liberties(block2);
					    if (liberties.length()==1)
						{
						    var move2 = liberties[0];
						    if (this.Make_Move(move2))
							{
							    //get score from our viewpoint: negative of opponent score
							    var score = -cboard.Score_Position();
							    if (score > best_score) {
								best_score = score;
							    }
							    this.Undo_Move();
							}
						}
					}
				}
			});
		}
	}
    this.Undo_Move();
    return best_score;
};

Game.prototype.Select_Scored_Move = function(remove_opponent_dead, pass_allowed) //TODO: is this a matching pattern, or an optional argument, or an initial assignment. I assume it's the last.

{
	remove_opponent_dead = false;
	pass_allowed = true;
    /* Go through all legal moves.
       Keep track of best score and all moves that achieve it.
       Select one move from best moves and return it.
    */
    var territory_moves_forbidden = pass_allowed;
    var base_score = this.current_board.Score_Position();
    if (debug_flag)
	{
        //print "?", base_score
	}
    //if abs(base_score)==self.size**2:
    //    import pdb; pdb.set_trace()
    var has_unknown_status_block = this.current_board.Has_Block_Status(WHITE+BLACK+EMPTY, "unknown"); //TODO: not sure how this call works
    var has_opponent_dead_block = this.current_board.Has_Block_Status(other_side[this.current_board.side], "dead");
    //has unsettled blocks
	if (has_unknown_status_block) {
	    pass_allowed = false;
	}
    //dead removal has been requested and there are dead opponent stones
    if (remove_opponent_dead && has_opponent_dead_block)
	{
        territory_moves_forbidden = false;
        pass_allowed = false;
	}
    forbidden_moves =
	territory_moves_forbidden ?
        this.current_board.Territory_As_Dict() :
	[];
    var best_score = WORST_SCORE;
    var best_moves = [];
    for(var move in this.Iterate_Moves())
	{
	    if (move in forbidden_moves) {
		continue;
	    }
        score = -this.Score_Move(move) - base_score;
        //self.make_move(move)
        //get score from our viewpoint: negative of opponent score
        //score = -self.current_board.score_position() - base_score
        //score = -self.score_position() - base_score
        if (debug_flag)
		{
            //print score, move_as_string(move, self.size)
		}
        //self.undo_move()
        //Give pass move slight bonus so its preferred among do nothing moves
        if (move==PASS_MOVE)
		{
		    if (!pass_allowed) {
			continue;
		    }
            score = score + 0.001;
		}
        if (score >= best_score)
		{
            if (score > best_score)
			{
               best_score = score;
               best_moves = [];
			}
            best_moves.push(move);
		}
	}
    if (debug_flag)
	{	
        //print "!", best_score, map(lambda m,s=self.size:move_as_string(m, s), best_moves)
	}
	if (best_moves.length() === 0) {
	    return PASS_MOVE;
	}
    return random.choice(best_moves); //TODO: what is random.choice?
};

Game.prototype.Place_Free_Handicap = function(count)
{
     var result = [];
     var move_candidates = [];
     this.current_board.each_Goban(function (move) {
	     if (this.current_board.Is_3x3_Empty(move)) {
		 move_candidates.push(move);
	     }
	 });
     while (result.length() < count)
	{
		if (this.current_board.side==WHITE)
		{
             this.Make_Move(PASS_MOVE);
		}
         if (move_candidates)
		{
             move = random.choice(move_candidates); //TODO: what is random.choice()?
		}
        else
		{
             move = PASS_MOVE;
		}
        //check if heuristics is correct, if not, then we use normal move generation routine
        var current_score = this.current_board.Score_Position();
        var score_diff = -this.Score_Move(move) - current_score;
        //0.001: because floating point math is inaccurate
        if (score_diff + 0.001 < normal_stone_value_ratio)
		{
             if (debug_flag)
			{
                 //print self.current_board
                 //print move, score_diff
			}
            move = this.Select_Scored_Move(pass_allowed=false);
		}
		if (this.make_move(move)) {
		    result.push(move);
		}
        if (move in move_candidates)
		{
             move_candidates.remove(move);
		}
	}
    return result;
};

Game.prototype.Final_Status_List = function(status)
{
    /* list blocks with given color and status
    */
    var result_list = [];
    this.current_board.Analyze_Unconditional_Status();
    for (var block in this.current_board.Iterate_Blocks(WHITE+BLACK))
	{
        if (block.status==status)
		{
            result_list.push(block.Get_Origin());
		}
	}
    return result_list;
};

Game.prototype.Select_Random_Move = function()
{
    /* return randomly selected move from all legal moves
    */
    return random.choice(this.list_moves()); //TODO: what is random.choice()?
};

Game.prototype.Select_Random_No_Eye_Fill_Move = function()
{
    /* return randomly selected move from all legal moves but don't fill our own eyes
       not that this doesn't make difference between true 1 space eye and 1 space false eye
    */
    var all_moves = [];
    var eye_moves = [];
    var capture_or_defence_moves = [];
    var make_eye_moves = [];
    var remove_liberty = [];
    var board = this.current_board;
    board.each_Goban(function (move) {
	    if (this.Legal_Move(move)) {
		board.each_Neighbour(move)(function (pos) {
			if (board.goban[pos]!=board.side) {
			    all_moves.push(move);
			    return board.each_Neighbour['break'];
			}
			else {
			    eye_moves.push(move);
			}
		    });
		board.each_Neighbour(move)(function (pos) {
			if (board.goban[pos] != EMPTY && board.liberties(pos) === 1) {
			    capture_or_defence_moves.push(move);
			    return board.each_Neighbour['break'];
			}
		    });
		board.each_Neighbour(move)(function (pos) {
			if (board.goban[pos]==EMPTY) { 
			    board.each_Neighbour(move)(function (pos2) {
				    if (pos2!=move && board.goban[pos2]!=board.side) {
					return board.each_Neighbour['break'];
				    }
				    else {
					make_eye_moves.append(move);
				    }
				});
			}
		    });
		board.each_Neighbour(move)(function (pos) {
			if (board.goban[pos]==other_side[board.side]) {
			    board.Iterate_Neighbour(move)(function (pos2) {
				    if (board.goban[pos2]==board.side) {
					remove_liberty.push(move);
				    }
				    return board.each_Neighbour['break'];
				});
			    return board.each_Neighbour['break'];
			}
		    });
	    }
	});
    //TODO: are these conditionals syntax correct?
    if (capture_or_defence_moves) {
	return random.choice(capture_or_defence_moves); //TODO: random.choice?
    }
    if (make_eye_moves) {
	return random.choice(make_eye_moves);
    }
    if (remove_liberty) {
	return random.choice(remove_liberty);
    }
    if (all_moves)
	{
 		return random.choice(all_moves);
	}
    else
	{
        //if len(eye_moves)>=6:
        //    return random.choice(eye_moves)
        return PASS_MOVE;
	}
};

Game.prototype.Generate_Move = function(remove_opponent_dead, pass_allowed) //TODO: is this a matching pattern, or an optional argument, or an initial assignment. I assume it's the last.
{
	remove_opponent_dead = false;
	pass_allowed;
    /* generate move using scored move generator
    */
    //return self.select_random_move()
    return this.Select_Scored_Move(remove_opponent_dead, pass_allowed);
};

function main()
{
    /* Play game against itself on 5x5 board.
       Print all positions and moves made while playing.
    */
    //random.seed(1)
    size = 19;
    g = new Game(size);
    while (true)
	{
        var move = g.Generate_Move();
        g.Make_Move(move);
        //print move_as_string(move, g.size)
        //print g.current_board
        //print g.current_board.as_string_with_unconditional_status()
        //print g.current_board.score_position()
        //import pdb; pdb.set_trace()
        //if last 2 moves are pass moves: exit loop
        //if len(g.move_history)==10:
        //    break
        if (g.move_history.length()>=2 && g.move_history[-1]==PASS_MOVE && g.move_history[-2]==PASS_MOVE)
		{
            break;
		}
	}
};