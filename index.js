// Description: This file is the entry point for the application

// Importing the required modules
const express = require("express");
const socketio = require("socket.io");

const path = require("path");

const http = require("http");
const session = require("express-session");

//creating an express app
const app = express();

//setting the public folder as the static folder
app.use(express.static(path.join(__dirname, "public")));

//session configuration
const sessionMiddleware = session({
	secret: "secret",
	resave: false,
	saveUninitialized: true,
	cookie: {
		secure: false,
		//set expiry time for session to 7 days
		maxAge: 1000 * 60 * 60 * 24 * 7,
	},
});

//creating a server
const server = http.createServer(app);
const io = socketio(server);

//using the session middleware
app.use(sessionMiddleware);
io.engine.use(sessionMiddleware);

//listening for user connection
io.on("connection", (socket) => {
	console.log("a user connected");

	//get the session id from the socket
	const session = socket.request.session;
	const sessionId = session.id;

	//the socket.id changes every time the user refreshes the page, so we use the session id to identify the user and create a room for them
	socket.join(sessionId);

  //welcome the user
  io.to(sessionId).emit("chat message", {sender: "bot", message: "Welcome to the chat app, say hello to the bot"});

  //a radom variable to store the user's progress
  let progress = 0

  //listen for the chat message event from the client
  socket.on("chat message", (message) => {

    //output the user message to the DOM by emitting the chat message event to the client
    io.to(sessionId).emit("chat message", {sender: "user", message});

     //logic to check the user's progress
    switch(progress){
      case 0:
        //if the user replies, increase the progress and send the default message
        io.to(sessionId).emit("chat message", {sender: "bot", message:`Press any of the following keys: <br>
    1. Place Order <br>
    2. Checkout Order <br>
    3. Order History <br>
    4. Cancel Order <br>`});

        progress = 1;
        break;
      case 1:
        //the user has selected an option, so we check which option they selected
        let botresponse = "";
        if(message === "1"){
          botresponse = "You selected option 1 <br> here is the menu";

        }else if(message === "2"){
          botresponse = "You selected option 2 <br> checkout your order";

        }else if (message === "3"){
          botresponse = "You selected option 3 <br> here is your order history";

        }else if(message === "4"){
          botresponse = "You selected option 4 <br>order canceled";

        }else{
          //if the user enters an invalid option, we send the default message
          botresponse = "Invalid option <br> Press any of the following keys: <br> 1. Place Order <br> 2. Checkout Order <br> 3. Order History <br> 4. Cancel Order <br>";
          progress = 1;
          io.to(sessionId).emit("chat message", {sender: "bot", message: botresponse});
          return
        }
        io.to(sessionId).emit("chat message", {sender: "bot", message: botresponse});

        //reset the progress
        progress = 0;
        break;
    }
    





  });
});

//starting the server
server.listen(3000, () => {
	console.log("listening on *:3000");
});
