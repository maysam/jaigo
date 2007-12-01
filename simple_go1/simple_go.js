var EMPTY = ".";
var BLACK = "X";
var WHITE = "O";
var WORST_SCORE = -1000000000;
var normal_stone_value_ratio = 0.7;
var x_coords_string = "ABCDEFGHJKLMNOPQRSTUVWXYZ";
var max_size = len(x_coords_string);
var debug_flag = false;

var BOTH = BLACK + WHITE;

colors = {BLACK, WHITE}

other_side = {BLACK: WHITE, WHITE: BLACK}

PASS_MOVE = {-1, -1}

function move_as_string(move, board_size)
{
    /*convert move tuple to string
      example: (2, 3) -> B3
	*/
    move==PASS_MOVE ? return "PASS";
    x, y = move;
    return x_coords_string[x-1] + str(y);
}

function string_as_move(m, size)
{
    /*convert string to move tuple
      example: B3 -> (2, 3)
    */
    m=="PASS" ? return PASS_MOVE;
    x = x_coords_string.indexOf(m.charAt(0));
    y = m.charAt(1);
    return x,y; //TODO: is this a valid return type?
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

Block.prototype.Add_Stone(position) = function()
{
	/*add stone or empty point at given position
    */
    this.stones[position] = true;
}

Block.prototype.Remove_Stone(position) = function()
{
    /*remove stone or empty point at given position
    */
    this.stones[position] = false;
	//TODO: this may not be equivalent to del self.stones[pos]
}

Block.prototype.Add_Block(other_block) = function()
{
    /*add all stones and neighbours to this block
    */
    this.stones.Update(other_block.stones);
    this.neighbour.Update(other_block.neighbour);
	//TODO: not sure if this subobject method syntax is correct
}

Block.prototype.Mark_Stones(mark) = function()
{
    /*mark all stones with given value
    */
    for (var stone in this.stones)
	{
		this.stones[stone] = mark;		
	}
}

Block.prototype.Size() = function()
{
    /*returns block size
    */
    return this.stones.length;
}

Block.prototype.Max_Liberties() = function()
{
    /*returns maximum amount liberties possible for this block size
    */
    return this.Size() * 2 + 2;
}

Block.prototype.Get_Origin() = function()
{
    /*return origin pos of block
    */
    lst = this.stones; //TODO: is this how to copy an array by value?
    lst.sort();
    return lst[0];	
}

/*Eye: collection of empty blocks and either black or white blocks

   Attributes:
   parts: list of blocks forming this eye
*/
function Eye()
{
    this.parts = [];	
}

Eye.prototype.Iterate_Stones(self) = function()
{
    /*Go through all stones in all blocks in eye
    */
    for (var block in this.parts)
	{
		for (var stone in block.stones)
		{
			//TODO: yield stone; is there a javascript equiv to the yield keyword? http://www.network-theory.co.uk/docs/pylang/yieldstatement.html
		}
	}	
}
Eye.prototype.Mark_Status(live_color) = function()
{
	/*Go through all stones in all blocks in eye
           All opposite colored blocks are marked dead.
           Empty blocks are marked as territory for live_color.
	*/
	for (var block in this.parts)
	{
		switch (block.color)
		{
			//TODO: is status a reserved keyword in javascript? Also, is block an instance of Block, and if so, does it need to be declared/instantiated differently?
			case live_color:
				block.status = "alive";
			case other_side[live_color]:
				block.status = "dead";
			default:
				block.status = live_color + " territory";
		}
	}
}