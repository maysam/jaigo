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
    if (move==PASS_MOVE)
 	{
		return "PASS";
	}
    x, y = move;
    return x_coords_string[x-1] + str(y);
}

function string_as_move(m, size)
{
    /*convert string to move tuple
      example: B3 -> (2, 3)
    */
    if (m=="PASS")
	{
		return PASS_MOVE;
	}
    x = string.find(x_coords_string, m[0]) + 1;
    y = int(m[1:]);
    return x,y;
}