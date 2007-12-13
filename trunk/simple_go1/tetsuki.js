
var currentGame

// CLASS Game
// -------------------------------------

function Game( size, handicap, komi, isBlackAI, isWhiteAI)
{
  this.boardSize=size
  this.openingMove = null
  this.lastMove = null
  this.currentColor = 0
  this.score = new Array(2)
  this.score[0]=0
  this.score[1]=0
  this.black = isBlackAI;
  this.white = isWhiteAI;
  this.handicap = handicap
  this.handicapStonesX = new Array()
  this.handicapStonesY = new Array()
  
  if (komi>0) this.score[1] += komi
  if (komi<0) this.score[0] -= komi
  this.komi = komi
  this.board = new Array(size*size)
  this.checked = new Array(size*size)
  buildBoard( size )
  for (i=0; i<size*size; i++)
  {
    this.board[i]=-1
    this.checked[i]=0
  }
}

Game.prototype.pass = function()
{
  this.move(-1,-1)
}
  
// move(x,y) 
// Put stone at x,y and update game according to the rules
Game.prototype.move = function( x, y)
{
  // Still placing handicap stones ?
  if (this.handicapStonesX.length < this.handicap)
  {
    if (x<0) return; // pass is invalid at this point
    var length = this.handicapStonesX.length;
    this.handicapStonesX[length] = x
    this.handicapStonesY[length] = y
    this.putStone( x,y,0)
    this.currentColor = 1
    return
  }
  this.unMarkNextMove( )

  // Does this match an existing move in the tree, then just walk that line
  var next
  if (this.lastMove != null) next = this.lastMove.next
  else next = this.openingMove
  while (next!=null) {
    if ((next.x == x ) && (next.y == y))
    {
      // It does! 
      next.doMove( this, this.currentColor )
      this.lastMove = next
      this.currentColor = 1-this.currentColor
      this.markNextMove(  )
      return
    }
    next = next.nextVariation 
  }

  var thisMove = new Move( x,y )

  // Put the stone on the board temporary, to test liberties
  if (x>=0)
  {
    var index = x+this.boardSize*y
    this.board[index] = this.currentColor
    
    // Check if opponents group(s) are captured
    for (i=0;i<this.boardSize*this.boardSize;i++) this.checked[i]=0
      this.checked[index]=1
    
    var captured = false
    // Check left
    if (x>0)
    {
      if (this.hasNoLiberties( x-1,y, 1-this.currentColor, 2 )) 
        if (this.capture( 2, thisMove )>0) captured= true
    }
    // Check right
    if (x<(this.boardSize-1))
    {
      if (this.hasNoLiberties(x+1,y,1-this.currentColor,3)) 
        if (this.capture( 3, thisMove )>0) captured = true
    }
    // check up
    if (y>0)
    {
      if (this.hasNoLiberties(x,y-1,1-this.currentColor, 4)) 
        if (this.capture( 4, thisMove )>0) captured = true
    }
    // check down
    if (y<(this.boardSize-1))
    {
      if (this.hasNoLiberties(x,y+1,1-this.currentColor,5)) 
        if (this.capture( 5, thisMove )>0) captured = true
    }

    // Check if move was suicide
    if (!captured)
    {  
//      debug("Checking suicide rule")
      for (i=0;i<this.boardSize*this.boardSize;i++) this.checked[i]=0
   
      if (this.hasNoLiberties(x,y,this.currentColor,1))
      {
         alert("You cannot put your own group without liberties")
         this.board[index] = -1
         this.markNextMove( )

        return
      }
    }
  }
  
  thisMove.doMove( this, this.currentColor )

  // record this move
  if (this.openingMove == null)
    // very first move
    this.openingMove = thisMove
  else
  {
    // not the very first move
    if (this.lastMove == null)
    {
      // variation on first move
      var move = this.openingMove
      while (move.nextVariation != null) move = move.nextVariation
      move.nextVariation = thisMove
      thisMove.previousVariation = move
    }
    else
    {
      if (this.lastMove.next==null)
      {
        this.lastMove.next = thisMove
      }
      else
      {
        var move = this.lastMove.next
        while (move.nextVariation != null) move = move.nextVariation
        move.nextVariation = thisMove
        thisMove.previousVariation = move
      }
    }
  }
  thisMove.previous = this.lastMove
  this.lastMove = thisMove
  this.currentColor = 1-this.currentColor
  this.markNextMove()
}
  
// putStone(x,y,color)
// ignoring the rules, just places a stone
Game.prototype.putStone = function ( x, y, color )
{
  var index = x+this.boardSize*y
  this.board[index]=color
  if (this===currentGame) setStone( x,y, color ) // update the board
}
Game.prototype.putStones = function (x,y,color )
{
  for (i=0;i<x.length;i++)
  {
    var index = x[i]+this.boardSize*y[i]
    this.board[index]=color
    if (this===currentGame) setStone( x[i],y[i], color ) // update the board     
  }
}
  
// Helper functions
// capture( id, move )
// Removes all stones that were marked with the given id in the checked matrix
Game.prototype.capture = function( id, move )
{
  var count=0
  for (y=0; y<this.boardSize; y++)
  {
    var left=this.boardSize*y
    for (x=0; x<this.boardSize; x++)
      if (this.checked[left+x]==id)
      {
        count++
        move.appendCapture( x,y)
      }
  }
  return count
}


Game.prototype.markNextMove = function(  )
{
  if (this!==currentGame) return
  if (this.showNextMove==false) return
  var move
  if (this.lastMove == null)
    move = this.openingMove
  else
    move = this.lastMove.next
  while(move)
  {
    if (move.x>=0)
      this.putStone( move.x, move.y, this.currentColor-3 )
    move = move.nextVariation
  }
}
  
Game.prototype.unMarkNextMove = function(  )
{
  if (this!==currentGame) return
  if (this.showNextMove==false) return
  var move
  if (this.lastMove == null)
    move = this.openingMove
  else
    move = this.lastMove.next
  while(move)
  {
    if (move.x>=0)
      this.putStone( move.x, move.y, -1 )
    move = move.nextVariation
  }
}
 
     
Game.prototype.isOccupied = function(x,y)
{
  var index = x+y*this.boardSize
  if (this.board[index]>=0) return true;
  return false;
}
 
  // hasNoLiberties(x,y,color,id)
  // recursive liberty-calculation routine
Game.prototype.hasNoLiberties = function( x,y, color, id )
{
//  debug("checking "+x+","+y)
  var index = x+this.boardSize*y
  if (this.checked[index]==id) return true // we've already tested this spot
  var c = this.board[index]
  if (c==-1) return false
  if (c==color) 
    this.checked[index]=id
  else 
  {
    this.checked[index]=-1
    return true
  }
  if (x>0) 
    if (!this.hasNoLiberties( x-1,y,color,id)) return false
  if (x<this.boardSize-1)
    if (!this.hasNoLiberties( x+1,y,color,id)) return false
  if (y>0)
    if (!this.hasNoLiberties( x,y-1,color,id)) return false
  if (y<this.boardSize-1)
    if (!this.hasNoLiberties( x,y+1,color,id)) return false

  return true
}
  
  // Playback features
Game.prototype.step = function( steps )
{
  this.unMarkNextMove()
  if (steps>0)
    for(i=0; i<steps; i++)
    {
      var move 
      if (this.lastMove==null) 
        move = this.openingMove
      else
        move = this.lastMove.next
      if (move!=null)
      {
        move.doMove( this, this.currentColor )
        this.currentColor = 1-this.currentColor
        this.lastMove = move
      }
    }
  else
    for(i=steps; i<0; i++)
    {
      if (this.lastMove!=null)
      {
        this.lastMove.undoMove( this, this.currentColor )
        this.currentColor = 1-this.currentColor
        this.lastMove = this.lastMove.previous
      }
    }
  this.markNextMove()
}
  
Game.prototype.deleteLastMove = function( ) 
{
  var move = this.lastMove
  if (move==null) return
  
  this.step(-1)
  this.unMarkNextMove()
  
  // Does the move have variation buddies?
  if (move.previousVariation != null) move.previousVariation.nextVariation = move.nextVariation
  if (move.nextVariatiotion != null) move.nextVariation.previousVariation = move.previousVariation
  
  // Was this move some move's next move?
  if (move.previous==null)
  {
     if (this.openingMove == move) this.openingMove = move.nextVariation
  }
  else
  {
    if (move.previous.next == move ) move.previous.next = move.nextVariation
  }
  this.markNextMove()
}
  
Game.prototype.toSGF = function()
{
  var sgf="(\n;FF[4]\nGM[1]\nRU[Japanese]\n"
  sgf += "SZ["+this.boardSize+"]\n"
  sgf += "HA["+this.handicap+"]\n"
  sgf += "KM["+this.komi+"]\n"
  sgf += "PB["+this.player[0]+"]\n"
  sgf += "PW["+this.player[1]+"]\n"
  var openingColor = 0
  if (this.handicapStonesX.length>0)
  {
    openingColor = 1
    sgf += "AB"
    for (i=0; i<this.handicapStonesX.length; i++)
    {
      sgf += "["+String.fromCharCode(97+this.handicapStonesX[i], 97+this.handicapStonesY[i]) + "]"
    }
    sgf += "\n"
  }
  // Now it's time to write the actual moves:
  if (this.openingMove != null)
  sgf += this.moveToSGF( this.openingMove, openingColor )
  sgf+=")\n"
    return sgf
}
  
Game.prototype.moveToSGF = function( move, color )
{
  var sgf=""
  while( move != null)
  {
    var moveCode = (color==0? ";B[" : ";W[")
    if (move.x==-1) moveCode += "tt]"
    else moveCode += String.fromCharCode(97+move.x, 97+move.y) + "]"
    if ((move.nextVariation!=null) || (move.previousVariation !=null))
    {
      // move is part of a several variations, must be bracketed
      sgf += "("
      sgf += moveCode;
      if (move.next != null) sgf += this.moveToSGF(move.next, 1-color ) // handle variations with 
      sgf += ")"
      move = move.nextVariation
    }
    else
    {
      sgf += moveCode;
      move = move.next
      color = 1-color
    }
  }
  return sgf
}
  
Game.prototype.save = function()
{
  var sgf = this.toSGF()
  var url = "data:text/plain,"+sgf.replace("\n"," ").replace(" ","%20")
  window.open( url )
}


// CLASS Move
// Stores all data to do/undo a single move
// -------------------------------------------

function Move( x,y ) {
  // This is where the move was played
  // Some special values: (-1,*) is a pass
  this.x=x
  this.y=y
  this.previous=null
  this.next=null
  this.previousvariation=null
  this.nextvaration=null
  this.showNextMove = true
  
  // This is an array of locations, if a move was a capture this stores the captured points
  // If the move was a handicap move, this array stores the locations
  this.capturesx = null
  this.capturesy = null
}


// Simply adds a location to the capture array
Move.prototype.appendCapture = function ( x, y )
{
  if (this.capturesx==null)
  {
    this.capturesx = new Array( )
    this.capturesy = new Array( )
  }
  var pos = this.capturesx.length
  this.capturesx[pos]=x
  this.capturesy[pos]=y
}

// Updates game according to this pre-recorded move
Move.prototype.undoMove = function ( game, color )
{
  if (this.x>=0)
  {
    game.putStone( this.x, this.y, -1 )
  
    if (this.capturesx != null)
    {
      game.putStones( this.capturesx, this.capturesy, color )
      game.score[1-color] -= this.capturesx.length
    }
  }
}

// Updates game according to this pre-recorded move
Move.prototype.doMove = function( game, color ) 
{    
  if (this.x>=0)
  {
    // regular move
    game.putStone( this.x, this.y, color )
  
    if (this.capturesx != null)
    {
      game.putStones( this.capturesx, this.capturesy, -1 )
      game.score[color] += this.capturesx.length
    }
  }
}

// HTML Helper functions
// -------------------------
// Creates an Empty Board
function buildBoard( size )
{
  document.getElementById("GameWindow").setAttribute("visible","yes")
  var hoshi1 = -1
  var hoshi2 = -1
  var hoshi3 = -1
  var tengen=-1
  if (size==9)
  {
    hoshi1=2;
    hoshi2=6;
    tengen=4;
  }
  if (size==13)
  {
    hoshi1=3
    hoshi2=9
    tengen = 6
  }
  if (size==19)
  {
    hoshi1=3
    hoshi2=9
    hoshi3=15
  }
  
  var table=document.getElementById('board')
  // clean previous game
  for (y=table.rows.length-1; y>=0; y--) table.deleteRow( y )
  
  for (y=0; y<size; y++)
  {
    var row = table.insertRow(y)
    if (y==0) row.setAttribute('row','first')
    if (y==(size-1)) row.setAttribute('row','last')
    for (x=0; x<size; x++)
    {
      var cell = row.insertCell(x)
      if (x==0) cell.setAttribute('column', 'first')
      if (x==(size-1)) cell.setAttribute('column', 'last')
      if ((((x==hoshi1) || (x==hoshi2) || (x==hoshi3)) && ((y==hoshi1) || (y==hoshi2) || (y==hoshi3))) || ((x==tengen) && (y==tengen)))
        cell.setAttribute('mark', 'star' )
      cell.setAttribute('onClick', "tap(" + x + "," + y + ")" )
    }
  }
}


function tap(x,y)
{
  // is this point already occupied?
  if (currentGame.isOccupied(x,y)==true)
  {
    showGameHud( true, x,y )
    // alert("You cannot play on an intersection that is already occupied.")
    return
  }
  currentGame.move(x,y)
}

// Changes stone at certain position
function setStone( x,y, stone )
{
//  debug("settings stone")
  var table=document.getElementById('board')
  var cell=table.rows[y].cells[x]
  
  if (0==stone)
    cell.innerHTML="<div class='black'></div>"
  else if (1==stone)
    cell.innerHTML="<div class='white'></div>"
  else if (-1==stone)
    cell.innerHTML=""
  else if (-2==stone)
    cell.innerHTML="<div class='whitespot'></div>"
  else
    cell.innerHTML="<div class='blackspot'></div>"
}

function showGameHud( visible, x,y  )
{
  var hud = document.getElementById("gameHud")
  hud.setAttribute( "visible", (visible?"yes":"no"))
  if (visible)
  {
    var pixx=(51*x)+4
    var maxx = currentGame.boardSize * 51 - 294
    if (pixx > maxx) 
      pixx = maxx
    hud.setAttribute( "style", "top: " + ((51*y)+4)+"px; left: "+pixx+"px;" )
   } 
}

function selectBoardSize( size )
{
  document.getElementById("board9").setAttribute('value',size==9?'true':'false');
  document.getElementById("board13").setAttribute('value',size==13?'true':'false');
  document.getElementById("board19").setAttribute('value',size==19?'true':'false');
}

// Called when page is loaded
function start( )
{
  var src="data:image/png;base64,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"
//  document.getElementById("close_big").setAttribute("src",src)
  document.getElementById("close_small").setAttribute("src",src)
  src="data:image/png;base64,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"
//  document.getElementById("back_big").setAttribute("src",src)
  document.getElementById("back_small").setAttribute("src",src)
  src="data:image/png;base64,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"
//  document.getElementById("forward_big").setAttribute("src",src)
  document.getElementById("forward_small").setAttribute("src",src)
  src="data:image/png;base64,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"
//  document.getElementById("delete_big").setAttribute("src",src)
  document.getElementById("delete_small").setAttribute("src",src)
  src="data:image/png;base64,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"
//  document.getElementById("more_big").setAttribute("src",src)
  document.getElementById("more_small").setAttribute("src",src)
  src="data:image/png;base64,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"
  document.getElementById("pass_small").setAttribute("src",src)
  goWindow( 0 )
  delete start; // this function is quite big and only executed once... so we can delete the function
}

function beginNewGame( )
{
  var size
  if (document.getElementById('board9').getAttribute('value')=='true') size=9
  else if (document.getElementById('board13').getAttribute('value')=='true') size=13
  else size=19
  var komi = document.getElementById('komi').value
  var isBlackAI = document.getElementById('black_ai').value
  var isWhiteAI = document.getElementById('white_ai').value
  var handicap = document.getElementById('handicap').value
  goWindow( 1 )
  if (currentGame != null) delete currentGame
  currentGame = new Game( size, handicap, komi, isBlackAI, isWhiteAI )
}

function goWindow( win )
{
   showGameHud( false, 0,0 )
 
  document.getElementById('beginWindow').setAttribute("visible", (win==0)?"inline":"no")
  document.getElementById('GameWindow').setAttribute("visible",(win==1)?"yes":"no")
  document.getElementById('InGameSettings').setAttribute("visible",(win==2)?"inline":"no")

   document.getElementById('meta').setAttribute("content", (win==1)?
  "initial-scale=1.0, width=969, maximum-scale=1.0, minimum-scale=0.3":
  "initial-scale=1.0, width=320, minimum-scale=1.0, maximum-scale=1.0")

  if (win==2)
  {
    document.getElementById('ingameblack').setAttribute("value", currentGame.player[0])
    document.getElementById('ingamewhite').setAttribute("value", currentGame.player[1])
    document.getElementById('ingamehandicap').setAttribute("value", currentGame.handicap)
    document.getElementById('ingamekomi').setAttribute("value", currentGame.komi)
  }
  setTimeout(function(){window.scrollTo(0, 1);}, 1000)
 
}

function backToGame( )
{
  currentGame.player[0] = document.getElementById('ingameblack').value
  currentGame.player[1] = document.getElementById('ingamewhite').value
  currentGame.komi = document.getElementById('ingamekomi').value
  
  goWindow(1)
}

function debug( text )
{
  var debugtable=document.getElementById('debug')
  var row = debugtable.rows.length
  var cell = debugtable.insertRow(row).insertCell(0)
  cell.innerHTML="<P>"+text+"</P>"
}