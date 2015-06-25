# Presentation Slides #
[Jaigo: Javascript-based Artificially Intelligent Go Opponent](http://docs.google.com/PresentationEditor?id=dgk2kqwp_171cqpccwft)

# Go #
  * Board (square grid, common sizes: 19, 13, 9)
  * Stones (signify control by a player of a grid position)
  * Liberties for c (unoccupied grid positions orthogonally adjacent to a stone of color c)
  * Chains (contiguous extents of stones of the same color)
  * Capture (the state of a chain with no liberties; captured chains are removed from the board)
  * Suicide (capturing your own chain)
  * Ko rule (no cycles shorter than 3 turns permitted)
  * Turn (pass or place a stone)

Objective: control more area or territory than opponent

zero-sum, perfect information, partisan (some moves are available to one player but not the other), deterministic strategy game

# Computer Go #
Search tree branching factory typically 150--250.
Endgames are PSPACE-hard.

## Known techniques ##
  * minimax (α-ß pruning, transposition tables, iterative deepening)
  * monte carlo
  * genetic algorithms
  * neural networks

## Current Issues ##
  * Finding a good evaluation function is hard. The human heuristics are vague, and when/how they get applied is even more vague.
  * fight between optimizing the main loop (evaluating the board) vs optimizing the small loops (given a board evaluation, local tricks to improve evaluation function). GNUGO v Go++
  * GA & NN seemed promising at first, but no commercial package uses them due to lack of speed.
  * If all old techniques are inadequate and new techniques don't pan out, whither computer go?

# JAIGO #

A javascript-based ai go agent.

## Platform/Language ##
Why javascript?
  * Professional interest
  * Most widely-deployed cross-platform runtime
  * No current go engine
  * Runs on iPhone!
  * ECMAScript 3 standard incredibly loose (so javascript can be used as functional or imperative language, making porting from python/java easy)

## Interaction/UI ##

Output in [GTP](http://www.lysator.liu.se/~gunnar/gtp/), so any GTP-compatible UI works. We are investigating two possible iPhone UI implementations. Current UI is a set of html input controls using GTP.

## Scoring ##
The board is scored using [Benson's Algorithm](http://senseis.xmp.net/?BensonsAlgorithm).
"c" stands for black or white, "-c" for the opposite color. Each point of the board is, of course, either black, white or empty.

A c chain is a non-empty maximum connected set of c points.

A c region is a non-empty maximum connected set of -c and empty points.

A c chain is unconditionally alive if and only if it belongs to a set of c chains S such that every chain B in S is adjacent to at least two c regions R that satisfy:

  1. (P1) all empty points in R are adjacent to B, and
> 2. (P2) all c chains adjacent to R belong to S.

## Board representation ##
We have 3<sup>361</sup> board states, perhaps 10<sup>768</sup> games. Representing the board turns out to be the most difficult part of writing a go engine.

Zobrist hashing: (reduce xor (map f board-positions)), f: (x, y, color) -> Z

## Engine choice ##
Criteria: What is the engine with the smallest expression in javascript and the highest kyu ranking?

### SimpleGo v1 ###
50kyu
greedy search (random move from list of moves with worst opponent score)
### SimpleGO v3 ###
30kyu
a-b pruned search
### Crawler ###
?? (~30kyu)
maintain line strength/shape
### TinyGo ###
??

## Size ##
jaigo v1 ~76KB, unoptimized. ~36k, partially optimized.

## Speed ##
not yet measured.