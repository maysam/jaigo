paper.pdf: paper.tex paper.bib
	pdflatex paper # initial pass
	bibtex paper   # bibliography
	pdflatex paper # bibilographical feedback
	pdflatex paper # update references

clean:
	-rm *.aux *.bbl *.blg *.log *.lot *.out *.toc
	-rm paper.pdf
