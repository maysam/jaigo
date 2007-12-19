Board.prototype.Analyze_Color_Unconditional_Status = function(color)
{
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
            if (block.eye_count >= 2)
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
        var blocks_to_analyse = object(eye_group.parts);
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
