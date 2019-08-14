# Thirteen
A turn-based pattern matching card game using Bootstrap, Javascript/jQuery, Node.js, Express, Axios, and Socket.io.

I created this project for my [CS 465 Full Stack Web Development](https://cs465-565-webdev.github.io/) class at [Portland State University](https://www.pdx.edu/) taught by [Caterina Paun](https://github.com/caterinasworld).

Thirteen is a game I grew up playing with my friends. It's a really popular game in asia and goes by many different names.
There's also many different variations of the game with different rules, but for this implementation I'm using the rules I grew
up playing with. This game is meant to be played by 4 people and requires some strategy and a bit of luck.

A demo of the game can be played at https://project-thirteen.appspot.com which is hosted on Google's App Engine using a flexible environment.

_Note: You may need to click an icon to Load Unsafe Script in your browser to view the 'how to play' link._


## Disclaimer
This was built in a rush so the code is very inefficient and not structured the way I'd like. It requires a major refactor which I may do over the rest of my summer break.


## Dev Dependencies
* Browser-sync
* Nodemon



## Project Dependencies
* Express
* Axios
* Socket.io



## To run the project locally:
First, clone the project and change to the project directory.
```
git clone https://github.com/Bounnoy/thirteen.git

cd thirteen
```

Edit the `client/index.html` to point to your localhost...
```javascript
var socket = io.connect('http://thirteen.sytes.net');
```
...to...
```javascript
var socket = io.connect('http://localhost');
```

Install the project's dependencies.
```
npm install
```

Run the project in developer mode.
```
npm run dev
```

Or in production mode.
```
npm start
```
