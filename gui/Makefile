.PHONY: all
all: script.js

.PHONY: clean
clean:
	rm -f script.js

script.js: utils.ts asciidraw.ts
	tsc $^ --out $@ --noImplicitAny