
IMG = \
	select.png \
	rectangle.png \
	connector.png \
	fill.png \
	pencil.png \
	undo.png \
	redo.png \
	gears.png

SIZE = 128

.PHONY: all
all: $(IMG)

%.png: icons.svg $(MAKEFILE_LIST)
	inkscape $< --without-gui --export-png=$@ --export-id=$* --export-width=$(SIZE) --export-height=$(SIZE)