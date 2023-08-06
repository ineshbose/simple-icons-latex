#!/bin/bash

mkdir -p simpleicons simpleicons/{doc,enc,map,opentype,tex,tfm,type1}
cp README.md simpleicons
mv -t simpleicons/doc simpleicons.pdf simpleicons.tex bindings.tex
cp simpleicons/doc/simpleicons.pdf .

mv *.enc simpleicons/enc
mv simpleicons.map simpleicons/map
mv SimpleIcons.otf simpleicons/opentype
mv -t simpleicons/tex simpleicons.sty *glyphs-*.tex *.fd
mv *.tfm simpleicons/tfm
mv SimpleIcons.pfb simpleicons/type1

zip -r simpleicons.zip ./simpleicons