all: index.js dist/gvp-template/index.html

.PHONY: start

index.js: index.ts package.json
	npm run compile

dist/gvp-template/index.html: package.json src
	npm run build

start: index.js dist/gvp-template/index.html
	node index.js

cleancache:
	rm -rf dist/gvp-template/assets/cache/*

clean:
	rm -rf index.js dist/*