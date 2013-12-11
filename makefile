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
	rm -f img/*.png

script.js: controllers.ts utils.ts asciidraw.ts
	tsc $^ --out $@ --noImplicitAny --comments

img/%.png: img/icons.svg $(MAKEFILE_LIST)
	inkscape $< --without-gui --export-png=$@ --export-id=$* --export-width=$(SIZE) --export-height=$(SIZE)
