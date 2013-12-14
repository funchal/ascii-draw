IMG = \
	img/select.png \
	img/rectangle.png \
	img/connector.png \
	img/pencil.png \
	img/undo.png \
	img/redo.png \
	img/favicon.png

SIZE = 128

.PHONY: all
all: script.js $(IMG)

.PHONY: clean
clean:
	rm -f script.js

.PHONY: imgclean
imgclean:
	rm -f img/*.png

.PHONY: check
check:
	jshint -c jshint.json script.js

script.js: src/asciidraw.ts $(wildcard src/*.ts) $(MAKEFILE_LIST)
	tsc $< --out $@ --noImplicitAny

img/%.png: img/icons.svg $(MAKEFILE_LIST)
	inkscape $< --without-gui --export-png=$@ --export-id=$* --export-width=$(SIZE) --export-height=$(SIZE)
