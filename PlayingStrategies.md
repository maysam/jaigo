# The Crawler #
(From [A noivice tries to write a go program](http://senseis.xmp.net/?ANoviceTriesToWriteAGoProgram).)
I had a champion very soon. I call it a crawler. The algorithm was simple:

  * make a move that produces a group with the biggest number of liberties.
  * don't play Damezumari moves.
  * don't punch your one point eyes.

Guess how it played. Slowly it made line accross the board. One large group. If there was an obstacle on the way it turned. Of course it was slow, but everything was connected and even for a human player it was not easy to kill this large but slow group.

For several months I could not write an algorithm that would beat the crawler. The problem was in connections. Algorithms left holes through which the crawler penetrated cutting everything into pieces and eventually strangling separate groups.

I have an algorithm that beats the crawler now. It has beaten IgoWin first time when I matched them, but generally IgoWin is much stronger. My program was lucky that time. It remains extremely weak. Perhaps one day I will have some new idea.