
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
