build:
	- cd src && tsc
	cp ./src/index.html ./www/index.html
	- mkdir ./www/utils/libs
	cp ./src/utils/libs/*.js ./www/utils/libs
	cp ./src/extensions/Templates/Webgl/*.vert ./www/extensions/Templates/Webgl/
	cp ./src/extensions/Templates/Webgl/*.frag ./www/extensions/Templates/Webgl/

start:
	cd server && node index.js