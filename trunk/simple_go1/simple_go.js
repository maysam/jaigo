var EMPTY = ".";
var BLACK = "X";
var WHITE = "O";
var WORST_SCORE = -1000000000;
var normal_stone_value_ratio = 0.7;
var x_coords_string = "ABCDEFGHJKLMNOPQRSTUVWXYZ";
var max_size = x_coords_string.length;
var debug_flag = false;

var BOTH = BLACK + WHITE;

other_side = {};
other_side[BLACK] = WHITE;
other_side[WHITE] = BLACK;

/* Douglas Crockford's prototypal
   inheritance fn */
function object(o) {
    function F() {}
    F.prototype = o;
    return new F();
}
deepValueEquality = function (a, b) {
    if (arguments.length === 2) {
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

function contains(sequence, quarry, eq) {
    eq = eq || deepValueEquality;
    for (var x in sequence) {
        if (eq(quarry, sequence[x])) {
            return true;
        }
    }
    return false;
}

function sgn(n) {
    if (n > 0) return 1;
    if (n < 0) return -1;
    if (n === 0) return 0;
}

function range(begin, end, step) {
    step = step || 1;
    if (arguments.length == 1) {
        end = arguments[0];
        begin = 0;
    }
    var direction = sgn(step);
    if (begin != end && sgn(end - begin) != direction) {
        throw new Error("inconsistent arguments <[begin, end) step>: <[" + begin + ", " + end + ") " + step + ">."); 
    }
    var a = {};
    for (var i = begin; i * direction < end * direction; i += step) {
        a[i] = i;
    }
    return a;
}

/* http://docs.python.org/lib/typesseq.html */
var xrange = range;

function randint(min, max) {
    // result is distributed pretty evenly between
    // min + 1 and max - 1, tailing off at
    // min and max. I don't think this can be
    // explained by uneven distribution of
    // floating point numbers on [0, 1] or
    // the definition of round (towards +inf).
    var result;
    if (min < 0 && max >= 0) {
        var a = -min / 2;
        var b = max / 2;
        var c = a + b;
        if (Math.random() < Math.min(a / c, b / c)) {
            result = randint(min, 0);
        }
        else {
            result = randint(0, max);
        }
    }
    else {
        result = Math.random() * (max - min) + min;
    }
    return Math.round(result);
}

function randomchoice(seq) {
//	if(seq.length == 1)
//		return seq[0];
    return seq[randint(0, seq.length-1)];
}

String.prototype.repeat = function(times) {
    var result = '';
    for (var i = 0; i < times; ++i) {
        result += this;
    }
    return result;
};

/*
 * s.update(t) means update set s, adding elements from t.
 */
function update(s, t) {
    for (var nom in t) if (t.hasOwnProperty(nom)) {
        s[nom] = t[nom];
    }
}

function map(f, s) {
    var result = object(s);
    for (var e in result) {
        var e2 = f(result[e]);
        result[e] = f(result[e]);
    }
    return result;
}

function iterateOwnProperties(target, f) {
    for (var i in target) if (target.hasOwnProperty(i)) {
        f(i);
    }
}

function KeywordArguments(template) {
    for (var i in template) if (template.hasOwnProperty(i)) {
        this[i] = template[i];
    }
}
KeywordArguments.prototype.find = function(args) {
    // The arguments pseudoarray is very special.
    // If that's the value we get for args,
    // then our usual for/in loop finds
    // nothing.
    for (var a = 0; a < args.length; ++a) {
        var arg = args[a];
        if (arg instanceof KeywordArguments) {
            return arg;
        }
    }
};
KeywordArguments.prototype.combine = function(allArgs, explicitArgs) {
    var result = explicitArgs;
    var keywords = KeywordArguments.prototype.find(allArgs);
    for (var k in keywords) if (keywords.hasOwnProperty(k)) {
        result[k] = keywords[k];
    }
    return result;
};


PASS_MOVE = [-1, -1];

function move_as_string(move, board_size)
{
    /*convert move tuple to string
      example: (2, 3) -> B3
        */
    if (deepValueEquality(PASS_MOVE, move)) {
        return "PASS";
    }
    return x_coords_string[move[0] - 1] + String(move[1]);
}

function string_as_move(m, size)
{
    /*convert string to move tuple
      example: B3 -> (2, 3)
    */
    if (m == "PASS") {
        return PASS_MOVE;
    }
    var x = x_coords_string.indexOf(m.charAt(0));
    var y = m.charAt(1);
    return [x,y];
}

function string_as_move(s)
{
	/* convert string to move tuple
	   example: "2,3" -> (2,3)
	*/
    if (s == "PASS") {
        return PASS_MOVE;
    }
	var m = s.split(",");
    var x = parseInt(m[0]);
    var y = parseInt(m[1]);
    return [x,y];
}

/* Block class

        Solidly connected group of stones or empy points as defined in Go rules

   Attributes:
   stones: position of stones or empty points
           empty points are like transparent stones
   liberties: position of liberties
   color: color of stones
*/
function Block(color)
{
    this.stones = {};
    this.neighbour = {};
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
    delete this.stones[position];
};

Block.prototype.Add_Block = function(other_block)
{
    /*add all stones and neighbours to this block
    */
    update(this.stones, other_block.stones);
    update(this.neighbour, other_block.neighbour);
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
    var result = 0;
    iterateOwnProperties(this.stones, function (i) {
            ++result;
        });
    return result;
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
    var lst = [];
    for (var s in this.stones) if (this.stones.hasOwnProperty(s)) {
        lst.push(s);
    }
    lst.sort(); //TODO: provide a suitable <=
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
            var stone = map(Number, s.split(','));
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
        for (var b in this.parts)
        {
            var block = this.parts[b];
            switch (block.color) {
                //note: status is not a reserved word in javascript.
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
function Board(size)
{ 
        /*Initialize board:
           argument: size
        */
        this.size = size;
        this.side = BLACK;
        this.captures = [];
        this.captures[WHITE] = 0;
        this.captures[BLACK] = 0;
        this.goban = []; //actual board
        this.Init_Hash();
        //Create and initialize board as empty size*size
        var board = this;
        this.each_Goban(function (pos) {
                //can't use set_goban method here, because goban doesn't yet really exists
                board.goban[pos] = EMPTY;
                board.current_hash = board.current_hash ^ board.board_hash_values[EMPTY][pos];});
        this.blocks = []; //blocks dictionary
        //Create and initialize one whole board empty block
        var new_block = new Block(EMPTY);
        this.each_Goban(function (pos) {
            new_block.Add_Stone(pos);
            board.blocks[pos] = new_block;});
        this.block_list = [new_block];
        this.chains = [];
}

Board.prototype.each_Goban = function(f)
{
    /*This goes through all positions in goban
      Example usage: see above __init__ method
    */
    for (var x in range(1, this.size + 1)) {
        for (var y in range(1, this.size + 1)) {
            if (f([x, y]) === Board.prototype.each_Goban['break']) {
                break;
            }
        }
    }
};
Board.prototype.each_Goban['continue'] = true;
Board.prototype.each_Goban['break'] = false;

Board.prototype.iterate = function(pairs, f) {
    for (var p in pairs) {
        var pair = pairs[p];
        if (1 <= pair[0] && pair[0] <= this.size && 1 <= pair[1] && pair[1] <= this.size) {
            if (f(pair) === Board.prototype.iterate['break']) {
                return;
            }
        }
    }
};
Board.prototype.iterate['continue'] = true;
Board.prototype.iterate['break'] = false;

Board.prototype.each_Neighbour = function(pos)
{
    var board = this;
    return function(f) {
        /*This goes through all neighbour positions in clockwise:
          up, right, down, left
          Example usage: see legal_move method
        */
        var x = pos[0];
        var y = pos[1];
        board.iterate(
                     [[x,y+1], [x+1,y], [x,y-1], [x-1,y]],
                     function (p) {
                         return f(p) === Board.prototype.each_Neighbour['break'] ? Board.prototype.iterate['break'] : Board.prototype.iterate['continue']});
    };
};
Board.prototype.each_Neighbour['continue'] = true;
Board.prototype.each_Neighbour['break'] = false;

Board.prototype.each_Diagonal_Neighbour = function(pos)
{
    var board = this;
    return function(f) {
        /*This goes through all neighbour positions in clockwise:
          NE, SE, SW, NW
          Example usage: see analyse_eye_point method
        */
        var x = pos[0];
        var y = pos[1];
        board.iterate(
                     [[x+1,y+1], [x+1,y-1], [x-1,y-1], [x-1,y+1]],
                     function (p) {
                         return f(p) === Board.prototype.each_Diagonal_Neighbour['break'] ? Board.prototype.iterate['break'] : Board.prototype.iterate['continue']});
    };
};
Board.prototype.each_Diagonal_Neighbour['continue'] = true;
Board.prototype.each_Diagonal_Neighbour['break'] = false;

Board.prototype.each_Blocks = function(colors)
{
    var board = this;
    return function(f) {
        /*This goes through all distinct blocks on board with given colors.
          Example usage: see analyze_unconditionally_alive
        */
        for (var b in board.block_list) {
            var block = board.block_list[b];
            if (colors.indexOf(block.color) !== -1) {
                if (f(block) === Board.prototype.each_Blocks['break']) {
                    break;
                }
            }
        }
    };
};
Board.prototype.each_Blocks['continue'] = true;
Board.prototype.each_Blocks['break'] = false;

Board.prototype.each_Neighbour_Blocks = function(block)
{
    var board = this;
    return function(f) {
        /*Go through all neighbour positions and add new blocks.
          Return once for each new block
        */
        var blocks_seen = [];
        for (var stone in block.neighbour) {
            var block2 = board.blocks[stone];
            if (!contains(blocks_seen, block2)) {
                if (f(block2) === Board.prototype.each_Neighbour_Blocks['break']) {
                    return;
                }
                blocks_seen.push(block2);
            }
        }
    };
};
Board.prototype.each_Neighbour_Blocks['continue'] = true;
Board.prototype.each_Neighbour_Blocks['break'] = false;

Board.prototype.each_Neighbour_Eye_Blocks = function(eye)
{
    var board = this;
    return function(f) {
        /*First copy eye blocks to list of blocks seen
          Then go through all neighbour positions and add new blocks.
          Return once for each new block
        */
        var blocks_seen = object(eye.parts);
        for (var b in eye.parts) {
            var block = eye.parts[b];
            for (var p in block.neighbour) {
                var pos = block.neighbour[p];
                var block2 = board.blocks[pos];
                if(blocks_seen.indexOf(block2) === -1) {
                    if (f(block2) === Board.prototype.each_Neighbour_Eye_Blocks['break']) {
                        return;
                    }
                    blocks_seen.push(block2);
                }
            }
        }
    };
};
Board.prototype.each_Neighbour_Eye_Blocks['continue'] = true;
Board.prototype.each_Neighbour_Eye_Blocks['break'] = false;

Board.prototype.Init_Hash = function()
{
    /*Individual number for every possible color and position combination */
    var board = this; // helps with the each_Goban closure
    board.board_hash_values = {};
    var colors = EMPTY+WHITE+BLACK;
    for (var c in colors) {
        var color = colors[c];
        board.each_Goban(function (pos) {
                board.board_hash_values[color] = {};
                board.board_hash_values[color][pos] = randint(-Number.MAX_VALUE, Number.MAX_VALUE);
            });
        board.current_hash = 0;
    }
};

    Board.prototype.Set_Goban = function(color, pos)
{
    /*Set stone at position to color and update hash value*/
    var old_color = this.goban[pos];
    this.current_hash = this.current_hash ^ this.board_hash_values[old_color][pos]; //TODO: this is not actually hashing properly, at least as far as I can figure. I tried changing the structure to [color][x][y], but didn't get the init right for that. Anyways, value of current_has is always 0, and I can't seem to address a hash value in the board. I've tried _values.X[1,1], _values.X["1","1"], _values["X"][1,1], _values["X"]["1","1"]. No joy. 
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
            if (deepValueEquality(pos, pos2)) {
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
	var goban = this.goban;
    this.each_Neighbour(pos)(function (pos2) {
            if (goban[pos2]==EMPTY) {
                neighbour_list.push(pos2);
            }
        });
    //check diagonal neighbour positions first
    //this is done to ensure that empty block is/will not splitted
    var diagonal_neighbour_list = [];
	var goban = this.goban;
    this.each_Diagonal_Neighbour(pos)(function (pos2) {
            if (goban[pos2]==EMPTY)
                {
                    diagonal_neighbour_list.push(pos2);
                }
        });
    return [neighbour_list, diagonal_neighbour_list];
};

Board.prototype.Is_3x3_Empty = function(pos)
{
    if (this.goban[pos]!= EMPTY) {
        return false;
    }
    var neighbors = this.List_Empty_3x3_Neighbour(pos);
    var neighbour_list = neighbors[0];
    var diagonal_neighbour_list = neighbors[1];
    if (neighbour_list.length === 4 && diagonal_neighbour_list.length === 4)
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
        temp_block.Add_Stone(pos_list[pos]);
		var goban = this.goban;
        this.each_Neighbour(pos_list[pos])(function (pos2) {
                if (goban[pos2] === color) {
                    temp_block.Add_Stone(pos2);
                }
            });
        }    
    var new_mark = 2; //When stones are added they get by default value True (==1)
    this.flood_mark(temp_block, pos_list[0], new_mark);
    for (var pos in pos_list)
        {
        if (temp_block.stones[pos_list[pos]] !== new_mark)
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
    var old_color = old_block.color;
    old_block.Remove_Stone(pos);
    if (old_block.Size() === 0)
        {
            this.block_list.splice(this.block_list.indexOf(old_block), 1);
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
    var board = this;
    var split_list = [];
    this.each_Neighbour(pos)(function (pos2) {
        var other_block = board.blocks[pos2];
        if (board.goban[pos2] === color) {
            new_block = board.Combine_Blocks(new_block, other_block);
        }
        else {
            new_block.neighbour[pos2] = true;
            if (board.goban[pos2] === old_color) {
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
                if (!old_block.stones[pos2]) //this if is slight optimization: can't be neighbour if belongs to block
                    {
                        board.each_Neighbour(pos2)(function (pos3) {
                                if (old_block.stones[pos3]) {
                                    //yes, pos2 is neighbour
                                    return board.each_Neighbour['break'];
                                }
                            });
                    }
                else //no, it's not neighbour
                    {
                        //was it neighbour to old_block? remove it if it is
                        if (old_block.neighbour[pos2] !== undefined)
                            {
                                delete oldblock.neighbour[pos2];
                            }
                    }
            });
        }
    else {
        changed_blocks.push(old_block); //now we need this
        old_block.Mark_Stones(0);
        var last_old_mark = 0;
        for (var p2 in split_list) {
            var pos2 = split_list[p2];
            var other_block = this.blocks[pos2];
            if (other_block.stones[pos2] === 0) {
                last_old_mark = last_old_mark + 1;
                this.flood_mark(other_block, pos2, last_old_mark);
                if (last_old_mark > 1) {
                    var splitted_block = this.Split_Marked_Group(other_block, last_old_mark);
                    this.Add_Block(splitted_block);
                    changed_blocks.push(splitted_block);
                }
            }
        }
    }
    if (new_block.neighbour[pos] !== undefined)
        {
            delete new_block.neighbour[pos];
        }
    for (block in changed_blocks)
        {
        this.Calculate_Neighbour(changed_blocks[block]);
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
            var temp = new_block;
            new_block = other_block;
            other_block = temp;
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
    for (var stonePosition in block.stones) {
        var stoneMark = block.stones[stonePosition];
        if (stoneMark === mark) {
            block.Remove_Stone(stonePosition);
            new_block.Add_Stone(stonePosition);
        }
    }
    return new_block;
};

Board.prototype.flood_mark = function(block, start_pos, mark)
{
    /* mark all stones reachable from given
       starting position with given mark
    */
    var to_mark = [start_pos];
    while (to_mark.length > 0)
        {
        var pos = to_mark.pop();
        if (block.stones[pos] === mark) {
            continue;
        }
        block.stones[pos] = mark;
        this.each_Neighbour(pos)(function (pos2) {
                if (block.stones[pos2] !== undefined)
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
                    if (block.stones[pos] === undefined)
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
    for (var pos in block.neighbour)
        {
			pos = string_as_move(pos);
        	if (this.goban[pos]==EMPTY)
                {
            		liberties.push(pos);
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
    if (method=="add_stone")
        {
        this.Add_Stone(color, pos);
        }
    else if (method=="change_block_color")
        {
        this.Change_Block_Color(color, pos);
        }
};

Board.prototype.Legal_Move = function(move)
{
    /*Test whether given move is legal.
       Returns truth value.
    */
    if (deepValueEquality(move, PASS_MOVE))
        {
        return true;
        }
    if (this.goban[move] === -1) {
        return false;
    }
    if (this.goban[move] !== EMPTY) {
        return false;
    }

    var result;
    var board = this;
    this.each_Neighbour(move)(function (pos) {
            if (board.goban[pos] === EMPTY) {
                result = true;
                return board.each_Neighbour['break'];
            }
            if (board.goban[pos] === board.side && board.Liberties(pos) > 1) {
                result = true;
                return board.each_Neighbour['break'];
            }
            if (board.goban[pos] === other_side[board.side] && board.Liberties(pos) === 1) {
                result = true;
                return board.each_Neighbour['break'];
            }
        });
    if (result !== undefined) {
        return result;
    }

    return false;
};

Board.prototype.Make_Move = function(move)
{
    /*Make move given in argument.
       Returns move or null if illegal.
       First we check given move for legality.
       Then we make move and remove captured opponent groups if there are any.
       While making move record what is needed to undo the move.
    */
    this.Initialize_Undo_Log();
    if (deepValueEquality(move, PASS_MOVE))
        {
        this.Change_Side();
        return move;
        }
    if (this.Legal_Move(move))
        {
        this.Add_Stone(this.side, move); //TODO: blocks don't seem to be updating from here.
        this.Add_Undo_Info("add_stone", EMPTY, move);
        var board = this;
        var remove_color = other_side[this.side];
        this.each_Neighbour(move)(function (pos) {
                if (board.goban[pos] == remove_color && board.Liberties(pos) === 0)
                    {
                        board.Remove_Block(pos);
                        board.Add_Undo_Info("change_block_color", remove_color, pos);
                    }
            });
        //this.Change_Side();
        return move;
        }
    return null;
};

Board.prototype.Undo_Move = function(undo_log)
{
        /*Undo move using undo_log.
        */
    for (var method_color_pos in undo_log)
        {
            this.Apply_Undo_Info(
                                 undo_log[method_color_pos][0],
                                 undo_log[method_color_pos][1],
                                 undo_log[method_color_pos][2]);
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
    this.each_Diagonal_Neighbour(pos)(function (pos2) {
            total_count = total_count + 1;
            if (this.goban[pos2]==other_color) {
                other_count = other_count + 1;
            }
        });
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
	var goban = this.goban; //TODO: added this to help with upcoming closure. Still having problems stemming from here.
	var blocks = this.blocks;
    this.each_Diagonal_Neighbour(pos)(function (pos2) { 
            total_count = total_count + 1;
            if (goban[pos2]==color && blocks[pos2].status=="alive")
                {
                    other_count = other_count + 1;
                }
        });
    if (total_count==4)
        {
            return (!(other_count > 1));
        }
    else
        {
            return (!(other_count > 0));
        }
};

Board.prototype.listPotentialEyes = function(eye_colors) {
    var eye_list = [];
    this.each_Blocks(EMPTY+WHITE+BLACK)(function (block) {
            block.eye = null;
        });
    var board = this;
    this.each_Blocks(eye_colors)(function (block) {
            if (block.eye) {
                return board.each_Blocks['continue'];
            }
            var current_eye = new Eye();
            eye_list.push(current_eye);
            var blocks_to_process = [block];
            while (blocks_to_process.length > 0) {
                var block2 = blocks_to_process.pop();
                if (block2.eye) {
                    continue;
                }
                block2.eye = current_eye;
                current_eye.parts.push(block2);
                for (var pos in block2.neighbour) {
                    var block3 = board.blocks[pos];
                    if (eye_colors.indexOf(block3.color) !== -1 && !block3.eye) {
                        blocks_to_process.push(block3);
                    }
                }
            }
        });
    return eye_list;
};

Board.prototype.classifyPotentialEyesByColor = function (eye_list, color) {
    var ok_eye_list = [];
    var not_ok_eye_list = []; //these might still contain dead groups if totally inside live group
    var board = this;
    for (var i in eye_list) if (eye_list.hasOwnProperty(i)) {
        var eye = eye_list[i];
        var prev_our_blocks = null;
        var eye_is_ok = false;
        var our_blocks;
        eye.each_Stones(function (stone) {
                if (board.goban[stone] !== EMPTY) {
                    return eye.each_Stones['continue'];
                }
                eye_is_ok = true;
                our_blocks = [];
                board.each_Neighbour(stone)(function (pos) {
                        var block = board.blocks[pos];
                        if (block.color === color && (our_blocks.indexOf(block) !== -1)) {
                            our_blocks.push(block);
                        }
                    });
                //list of blocks different than earlier
                if ((prev_our_blocks !== null) && (prev_our_blocks !== our_blocks)) {
                    var ok_our_blocks = [];
                    for (var b in our_blocks) {
                        var block = our_blocks[b];
                        if (prev_our_blocks.indexOf(block) !== 1) {
                            ok_our_blocks.push(block);
                        }
                    }
                    our_blocks = ok_our_blocks;
                }
                //this empty point was not adjacent to our block or there is no block that has all empty points adjacent to it
                if (our_blocks.length === 0) {
                    eye_is_ok = false;
                    return eye.each_Stones['break'];
                }                
                prev_our_blocks = our_blocks;
            });
        if (eye_is_ok) {
            ok_eye_list.push(eye);
            eye.our_blocks = our_blocks;
        }
        else {
            not_ok_eye_list.push(eye);
            //remove reference to eye that is not ok
            for (block in eye.parts) {
                block.eye = null;
            }
        }
    }
    return [ok_eye_list, not_ok_eye_list];
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
    var eye_colors = EMPTY + other_side[color];
    var eye_list = this.listPotentialEyes(eye_colors);
    var board = this;
    //check that all empty points are adjacent to our color
    var lists = this.classifyPotentialEyesByColor(eye_list, color);
    var not_ok_eye_list; //these might still contain dead groups if totally inside live group
    eye_list = lists[0];
    not_ok_eye_list = lists[1];

    //first we assume all blocks to be ok
    this.each_Blocks(color)(function (block) {
            block.eye_count = 2;
        });
    //main loop: at end of loop check if changes
    while (true) {
        var changed_count = 0;
        this.each_Blocks(color)(function (block) {
                //not really needed but short and probably useful optimization
                if (block.eye_count < 2) {
                    return board.each_Blocks['continue'];
                }
                //count eyes
                var block_eye_list = [];
                for (var stone in block.neighbour)
                {
                        var eye = board.blocks[stone].eye;
                        if (eye && block_eye_list.indexOf(eye) == -1)
                    { 
                                block_eye_list.push(eye);
                    }
                }
                //count only those eyespaces which have empty point(s) adjacent to this block
                block.eye_count = 0;
                for (var e in block_eye_list) {
                    var eye = block_eye_list[e];
                    if (contains(eye.our_blocks, block, deepValueEquality)) {
                        block.eye_count = block.eye_count + 1;
                    }
                }
                if (block.eye_count < 2) {
                    changed_count = changed_count + 1;
                }
            });
        //check eyes for required all groups 2 eyes
        var ok_eye_list = [];
        for (var e in eye_list) {
            var eye = eye_list[e];
            eye_is_ok = true;
            this.each_Neighbour_Eye_Blocks(eye)(function (block) {
                    if (block.eye_count < 2) {
                        eye_is_ok = false;
                        return board.each_Neighbour_Eye_Blocks['break'];
                    }
                });
            if (eye_is_ok) {
                ok_eye_list.push(eye);
            }
            else {
                changed_count = changed_count + 1;
                not_ok_eye_list.push(eye);
                //remove reference to eye that is not ok
                for (var b in eye.parts) {
                    var epb = eye.parts[b];
                    epb.eye = null;
                }
            }
            eye_list = ok_eye_list;
        }
        if (changed_count === 0) {
            break;
        }
    }
    //mark alive and dead blocks
    this.each_Blocks(color)(function(block) {
            if (block.eye_count >= 2) //TODO: why is this always 0?
                {
                    block.status = "alive";
                }
        });
    for (var e in eye_list) if (eye_list.hasOwnProperty(e)) {
        var eye = eye_list[e];
        eye.Mark_Status(color);
    }
    //Unconditional dead part:
    //Mark all groups with only 1 potential empty point and completely surrounded by live groups as dead.
    //All empty points adjacent to live group are not counted.
    for (var eg in not_ok_eye_list) {
        var eye_group = not_ok_eye_list[eg];
        eye_group.dead_analysis_done = false;
    }
    for (var eg in not_ok_eye_list) {
        var eye_group = not_ok_eye_list[eg];
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
        var blocks_to_analyse = object(eye_group.parts); //TODO: does this work?
        while ((blocks_to_analyse.length > 0) && two_eyes_impossible) {
            var block = blocks_to_analyse.pop();
            if (block.eye) {
                block.eye.dead_analysis_done = true;
            }
            blocks_analysed.push(block);
            if (block.status === "alive") {
                if (block.color === color) {
                    has_unconditional_neighbour_block = true;
                }
                else {
                    two_eyes_impossible = false;
                }
                continue;
            }
            maybe_dead_group.parts.push(block);
            for (var pos in block.stones) {
                eye_block.Add_Stone(pos);
                var eye_type;
                if (block.color === EMPTY) {
                    eye_type = this.Analyse_Eye_Point(pos, color);
                }
                else if (block.color === color) {
                    eye_type = this.Analyse_Opponent_Stone_As_Eye_Point(pos);
                }
                else {
                    continue;
                }
                if (eye_type === null) {
                    continue;
                }
                if (eye_type === true) {
                    if (true_eye_list.length === 2) {
                        two_eyes_impossible = false;
                        break;
                    }
                    else if (true_eye_list.length === 1) {
                        if (this.Are_Adjacent_Points(pos, true_eye_list[0])) {
                            //Second eye point is adjacent to first one.
                            true_eye_list.push(pos);
                        }
                        else {
                            //Second eye point is not adjacent to first one.
                            two_eyes_impossible = false;
                            break;
                        }
                    }
                    else {
                        //len(empty_list) == 0
                        true_eye_list.push(pos);
                    }
                }
                else {
                    //eye_type==False
                    false_eye_list.push(pos);
                }
            }
            if (two_eyes_impossible) {
                //bleed to neighbour blocks that are at other side of blocking color block:
                //consider whole area surrounded by unconditional blocks as one group
                for (var pos in block.neighbour) {
                    var block = this.blocks[pos];
                    if (blocks_analysed.indexOf(block) == -1 && blocks_to_analyse.indexOf(block) === -1) {
                        blocks_to_analyse.push(block);
                    }
                }
            }
        }            
        //must be have some neighbour groups:
        //for example board that is filled with stones except for one empty point is not counted as unconditionally dead
        if (two_eyes_impossible && has_unconditional_neighbour_block) {
            if ((true_eye_list.length > 0 && false_eye_list.length > 0) || false_eye_list.length >= 2) {
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
                for (var eye in both_eye_list) {
                    this.each_Neighbour(eye)(function (pos) {
                        if (eye_block.stones.indexOf(pos) != -1) {
                            this.flood_mark(eye_block, pos, new_mark);
                            var splitted_block = this.split_marked_group(eye_block, new_mark);
                            stone_block_list.push(splitted_block);
                        }
                    });
                }
                //Add eyes to block neighbour.
                for (var eye in both_eye_list) {
                    this.each_Neighbour(eye)(function (pos) {
                        for (var b in stone_block_list) {
                            var block = stone_block_list[b];
                            if (block.stones[pos] !== undefined) {
                                block.neighbour[eye] = true;
                            }
                        }
                    });
                }
                //main false eye loop: at end of loop check if changes
                while (true) {
                    var changed_count = 0;
                    //Remove actual false eyes from list.
                    for (var b in stone_block_list) {
                        var block = stone_block_list[b];
                        var blockNeighbourLength = (function () {
                                var result = 0;
                                iterateOwnProperties(block.neighbour, function (i) {
                                        ++result;
                                    });
                                return result;
                            })();
                        if (blockNeighbourLength === 1) {
                            var neighbour_list = (function () {
                                    var result = [];
                                    iterateOwnProperties(block.neighbour, function (i) {
                                        result.append(i);
                                    });
                                    return result;
                                })();
                            var eye = neighbour_list[0];
                            both_eye_list.remove(eye);
                            //combine this block and eye into other blocks by 'filling' false eye
                            block.Add_Stone(eye);
                            for (var block2 in object(stone_block_list)) {
                                if ((block !== block2) && (block2.neighbour[eye] !== undefined)) {
                                    block.Add_Block(block2);
                                    stone_block_list.splice(stone_block_list.indexOf(block2),1);
                                }
                            }
                            delete block.neighbour[eye];
                            changed_count = changed_count + 1;
                            break; //we have changed stone_block_list, restart
                        }
                    }
                    if (changed_count.length === 0) {
                        break;
                    }
                }
                //Check if we have enough eyes.
                if (both_eye_list.length > 2) {
                    two_eyes_impossible = false;
                }
                else if (both_eye_list.length === 2) {
                    if (!this.Are_Adjacent_Points(both_eye_list[0], both_eye_list[1])) {
                        two_eyes_impossible = false;
                    }
                }
            }
            //False eye analysis done: still surely dead
            if (two_eyes_impossible) {
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
    //TODO: What does this argument resolve to in py?
    this.each_Blocks(BLACK+WHITE+EMPTY)(function (block) {
            block.status = "unknown";
        });
    this.Analyze_Color_Unconditional_Status(BLACK);
    this.Analyze_Color_Unconditional_Status(WHITE);
    //cleanup
    this.each_Blocks(BLACK+WHITE+EMPTY)(function (block) {
            block.eye = null;
        });
};

Board.prototype.Has_Block_Status = function(colors, status)
{
    var result;
    this.each_Blocks(colors)(function (block) {
            if (block.status==status) {
                result = true;
                return Board.prototype.each_Blocks['break'];
            }
        });
    return result || false;
};

Board.prototype.Territory_As_Dict = function()
{
    var territory = {};
    this.each_Blocks(EMPTY)(function (block) {
            if ((block.status==(WHITE + " territory")) || (block.status==(BLACK + " territory")))
                {
                    update(territory, block.stones);
                }
        });
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
        this.each_Neighbour_Blocks(block)(function (block2) {
                if (block2.color==other_side[block.color] && (this.Block_Liberties(block2)==1)) {
                    for (var stone in block.neighbour) {
                        if (block2.stones[stone] !== undefined) {
                            liberties = liberties + 0.5;
                        }
                    }
                }
            });
        var liberty_ratio = liberties / block.Max_Liberties();
        score = block.Size() * normal_stone_value_ratio * (1 - Math.pow(1-liberty_ratio, 2));
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
    this.each_Blocks(BLACK+WHITE+EMPTY)(function (block) {
            score = score + Board.prototype.Score_Block(block);
        });
    return score;
};

Board.prototype.Unconditional_Score = function(color)
{
    var score = 0;
    this.Analyze_Unconditional_Status();
    this.each_Blocks(WHITE+BLACK+EMPTY)(function (block) {
            if ((block.status == (color + " territory")) || (block.color == color && block.status == "alive") || (block.color == other_side[color] && block.status == "dead"))
                {
                    score = score + block.Size();
                }
        });
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
    for (var y in range(this.size, 0, -1))
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
        for (var x in range(1, this.size+1))
                {
                    line = line + this.goban[[x, y]];
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
    var color_and_status_to_character = (
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
        })();
    this.Analyze_Unconditional_Status();
    var s = this.side + " to move:\n"; //TODO: if we print this out first, then when we compare boards, this stuff will be the first line compared?
    s = s + "Captured stones: ";
    s = s + "White: " + this.captures[WHITE].toString();
    s = s + " Black: " + this.captures[BLACK].toString() + "\n"; 
    var board_x_coords = "   " + x_coords_string.slice(0, this.size);
    s = s + board_x_coords + "\n";
    s = s + "  +" + "-".repeat(this.size) + "+\n";

    for (var y in range(this.size, 0, -1)) //TODO: [Noel] do we need to strip whitespace chars from y? [Sean] I think we do not, because range is an object whose property names and values match each other. The names are strings, but the range result is not, and the for-loop won't coerce it to a string. So, the spaces you see in the printed representation aren't at issue here. I think. Do you have a test case that proves me wrong? [Noel] No, I noticed that the result board string didn't seem to be parsing out properly on the test page, and was wondering if whitespace was responsible.
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
        for (var x in range(1, this.size+1))
                {
                    //TODO: [Noel] I don't think this is the correct way to compose & call the color_and_status_to_character function. [Sean] color_and_status_to_character is a function in the mathematical sense, but because it is efficiently implemented as a straightforward lookup, I thought it would be cleanest to use JavaScript's property dictionary to implement it. So, I think this does work, but I'm not sure if I have a good test case... [Noel] Gotcha. 
                    var pos_as_character = color_and_status_to_character[this.goban[[x, y]] + this.blocks[[x,y]].status];
                    line = line + pos_as_character;
                }
        s = s + line + "|" + board_y_coord + "\n";
        }
    s = s + "  +" + "-".repeat(this.size) + "+\n";
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
    return [undo_log, board_key];
};

Game.prototype.Legal_Move = function(move)
{
    /* check whether move is legal
       return truth value
       first check move legality on current board
       then check for repetition (situational super-ko)
    */

    if (deepValueEquality(move, PASS_MOVE)) {
        return true;
    }
    if (!this.current_board.Legal_Move(move)) {
        return false;
    }
    var logkey = this.Make_Unchecked_Move(move);
    var undo_log = logkey[0];
    var board_key = logkey[1];
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
    var logkey = this.Make_Unchecked_Move(move);
    var undo_log = logkey[0];
    var board_key = logkey[1];
    //TODO: Disabled the conditional since hashing is not working.if (!deepValueEquality(move, PASS_MOVE) && (this.position_seen.indexOf(board_key) == -1))
/*        {
        this.current_board.Undo_Move(undo_log);
        return null;
        }*/
    this.undo_history.push(undo_log);
    this.move_history.push(move);
    if (!deepValueEquality(move, PASS_MOVE))
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
    if (this.move_history.length === 0) {
        return null;
    }
    var last_move = this.move_history.pop();
    if (!deepValueEquality(last_move, PASS_MOVE))
        {
            //TODO: disabled this until hashing works this.position_seen.splice(this.current_board.key(), 1);
        }
    var last_undo_log = this.undo_history.pop();
    this.current_board.Undo_Move(last_undo_log);
    return this.current_board;
};

Game.prototype.each_Moves = function()
{
    return function(f) {
        /* Go through all legal moves including pass move
         */
        f(PASS_MOVE);
        this.current_board.each_Goban(function (move) {
                if (this.Legal_Move(move)) {
                    if (f(move) === Game.prototype.each_Moves['break']) {
                        return this.current_board.each_Goban['break'];
                    }
                }
            });
    };
};
Game.prototype.each_Moves['continue'] = true;
Game.prototype.each_Moves['break'] = false;

Game.prototype.List_Moves = function()
{
    /* return all legal moves including pass move
    */
    var all_moves = [PASS_MOVE];
	var board = this.current_board
	board.each_Goban(function (move) {
		if (board.Legal_Move(move)){
                all_moves.push(move);
            }});
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
    if (!deepValueEquality(move, PASS_MOVE)) {
        var block = cboard.blocks[move];
        var liberties = cboard.List_Block_Liberties(block);
        //Check if this group is now in atari.
        if (liberties.length()==1) {
            var move2 = liberties[0];
            if (this.Make_Move(move2)) {
                //get score from our viewpoint: negative of opponent score
                var score = -cboard.Score_Position();
                if (score > best_score) {
                    best_score = score;
                }
                this.Undo_Move();
            }
        }
        else {
            //Check if some our neighbour group is in atari instead.
            cboard.each_Neighbour(move)(function (stone) {
                    var block = cboard.blocks[stone];
                    if (block.color==cboard.side && cboard.Block_Liberties(block) === 1) {
                        //make_move later changes block.neighbour dictionary in some cases so this is needed
                        cboard.each_Neighbour_Blocks(block)(function (block2) {
                                var liberties = cboard.List_Block_Liberties(block2);
                                if (liberties.length() === 1) {
                                    var move2 = liberties[0];
                                    if (this.Make_Move(move2)) {
                                        //get score from our viewpoint: negative of opponent score
                                        var score = -cboard.Score_Position();
                                        if (score > best_score) {
                                            best_score = score;
                                        }
                                        this.Undo_Move();
                                    }
                                }
                            });
                    }
                });
        }
    }
    this.Undo_Move();
    return best_score;
};

Game.prototype.Select_Crawler_Move = function(remove_opponent_dead, pass_allowed)
{
	if (arguments.length < 2) 
        {
                if (arguments.length < 1) 
                {
                remove_opponent_dead = false;
                }
                pass_allowed = true;
    }
    var args = KeywordArguments.prototype.combine(arguments, {remove_opponent_dead: remove_opponent_dead, pass_allowed : pass_allowed});
    
	/* find the move that produces the largest liberties.
	   reject a move if it results in less liberties for the block than before.
	*/
	var best_moves = [];
	var most_liberties = 0;
	
	if (this.move_history.length <= 1)
	{
		//for the first move, do something intelligent in the middle.
		var middle_moves = this.current_board.List_Empty_3x3_Neighbour([9,9]);
		return randomchoice(middle_moves[0]);
	}
	
	for (var b in this.current_board.block_list)
	{
		if (this.current_board.block_list[b].color === this.current_board.side)
		{
			var liberties = this.current_board.List_Block_Liberties(this.current_board.block_list[b]);
			for (var liberty in liberties)
			{
				var current_block_liberties = this.current_board.Block_Liberties(this.current_board.block_list[b]);
				if (current_block_liberties >= most_liberties)
				{
					this.Make_Move(liberties[liberty]);
					var new_block_liberties = this.current_board.Block_Liberties(this.current_board.block_list[b]);
					if (new_block_liberties >= current_block_liberties)
					{
						best_moves.push(liberties[liberty]);
					}
					this.Undo_Move();
				}
			}
		}
	}
	if (best_moves.length > 0)
	{
		return randomchoice(best_moves);
	}
	else
	{
		return this.Select_Random_Move();
	}
};

Game.prototype.Select_Scored_Move = function(remove_opponent_dead, pass_allowed) {
    if (arguments.length < 2) 
        {
                if (arguments.length < 1) 
                {
                remove_opponent_dead = false;
                }
                pass_allowed = true;
    }
    var args = KeywordArguments.prototype.combine(arguments, {remove_opponent_dead: remove_opponent_dead, pass_allowed : pass_allowed});

    /* Go through all legal moves.
       Keep track of best score and all moves that achieve it.
       Select one move from best moves and return it.
    */
    var territory_moves_forbidden = args['pass_allowed'];
    var base_score = this.current_board.Score_Position();
    if (debug_flag)
        {
        //print "?", base_score
        }
    //if abs(base_score)==self.size**2:
    //    import pdb; pdb.set_trace()
    var has_unknown_status_block = this.current_board.Has_Block_Status(WHITE+BLACK+EMPTY, "unknown");
    var has_opponent_dead_block = this.current_board.Has_Block_Status(other_side[this.current_board.side], "dead");
    //has unsettled blocks
        if (has_unknown_status_block) {
            args['pass_allowed'] = false;
        }
    //dead removal has been requested and there are dead opponent stones
    if (args['remove_opponent_dead'] && has_opponent_dead_block)
        {
        territory_moves_forbidden = false;
        args['pass_allowed'] = false;
        }
    var forbidden_moves =
        territory_moves_forbidden ?
        this.current_board.Territory_As_Dict() :
        [];
    var best_score = WORST_SCORE;
    var best_moves = [];
        this.each_Moves()(function (move) {
                if (forbidden_moves[move] !== undefined) {
                    return this.each_Moves['continue'];
                }
                score = -Game.prototype.Score_Move(move) - base_score;
                //self.make_move(move)
                //get score from our viewpoint: negative of opponent score
                //score = -self.current_board.score_position() - base_score
                //score = -self.score_position() - base_score
                if (debug_flag)
                    {
                        debug_output(score + move_as_string(move, this.size));
                    }
                //self.undo_move()
                //Give pass move slight bonus so its preferred among do nothing moves
                if (deepValueEquality(move, PASS_MOVE))
                    {
                        if (!args['pass_allowed']) {
                            return this.each_Moves['continue'];
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
            });
        if (debug_flag)
        {       
        debug_output("!" + best_score + best_moves); //map(lambda m,s=self.size:move_as_string(m, s), best_moves));
        }
        if (best_moves.length() === 0) {
            return PASS_MOVE;
        }
        return randomchoice(best_moves);
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
            var move;
                if (this.current_board.side==WHITE)
                {
             this.Make_Move(PASS_MOVE);
                }
         if (move_candidates)
                {
             move = randomchoice(move_candidates);
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
             move = this.Select_Scored_Move(new KeywordArguments({pass_allowed: false}));
                }
                if (this.make_move(move)) {
                    result.push(move);
                }
                if (move_candidates.indexOf(move) !== -1)
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
    this.current_board.each_Blocks(WHITE+BLACK)(function (block) {
            if (block.status==status)
                {
                    result_list.push(block.Get_Origin());
                }
        });
    return result_list;
};

Game.prototype.Select_Random_Move = function()
{
    /* return randomly selected move from all legal moves
    */
    return randomchoice(this.List_Moves());
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
                            board.each_Neighbour(move)(function (pos2) {
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
    if (capture_or_defence_moves) 
        {
                return randomchoice(capture_or_defence_moves);
    }
    if (make_eye_moves) 
        {
                return randomchoice(make_eye_moves);
    }
    if (remove_liberty) 
        {
                return randomchoice(remove_liberty);
    }
    if (all_moves)
        {
                return randomchoice(all_moves);
        }
    else
        {
        //if len(eye_moves)>=6:
        //    return random.choice(eye_moves)
        return PASS_MOVE;
        }
};

Game.prototype.Generate_Move = function(remove_opponent_dead, pass_allowed, ai) 
{
    if (arguments.length < 3) 
    {
		if (arguments.length < 2) 
		{
			if(arguments.length < 1)
			{
			 	remove_opponent_dead = false;						
			}
			pass_allowed = true;					
		}
		ai = "scored_move";
    }
    /* generate move using scored move generator
    */
    //return self.select_random_move()
	if(ai == "scored_move")
	{
    	return this.Select_Scored_Move(remove_opponent_dead, pass_allowed);
	}
	else if (ai == "crawler")
	{
		return this.Select_Crawler_Move(remove_opponent_dead, pass_allowed);
	}
	else
	{
    	return this.Select_Scored_Move(remove_opponent_dead, pass_allowed);		
	}
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
        debug_output(move_as_string(move, g.size));
        debug_output(g.current_board);
        debug_output(g.current_board.as_string_with_unconditional_status());
        debug_output(g.current_board.score_position());
        //if last 2 moves are pass moves: exit loop
        if (g.move_history.length()>=2 && deepValueEquality(g.move_history[g.move_history.length - 1], PASS_MOVE) && deepValueEquality(g.move_history[g.move_history.length - 2], PASS_MOVE))
                {
            break;
                }
        }
};