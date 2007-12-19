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
