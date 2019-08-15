const mongo = require("mongodb").MongoClient;
const clients = require("socket.io").listen(4000).sockets;

/**  Dependencies document
MongoDB: https://github.com/mongodb/node-mongodb-native
Socket.io: https://github.com/socketio/socket.io*/

// Connect to mongoDB
// MEMO: Need to run mongo or install local mongoDB
const url = "mongodb://127.0.0.1/mongochat";
mongo.connect(url, function(err, client) {
  if (err) {
    throw err;
  }
  console.log("MongoDB connected....");
  let database = client.db("mongochat");

  //connect to Socket.io
  clients.on("connection", function(socket) {
    // make query
    let chat = database.collection("chats");

    // create function to send status
    sendStatus = function(s) {
      socket.emit("status ", s);
    };

    // get chat from mongo collection
    chat
      .find()
      .limit(100)
      .sort({ _id: 1 })
      .toArray((err, res) => {
        if (err) {
          throw err;
        }
        // not error -> emit the message
        socket.emit("output", res);
      });

    // Handle input event
    socket.on("input", data => {
      let name = data.name;
      let message = data.message;

      //check for name and message
      if (name == "" || message == "") {
        //send error status
        sendStatus("Please enter name and message");
      } else {
        // insert message to database
        chat.insert({ name: name, message: message }, () => {
          clients.emit("output", [data]);

          // Send status obj
          sendStatus({
            message: "Message sent",
            clear: true
          });
        });
      }
    });
    // Handle clear
    socket.on("clear", data => {
      // Remove all chat from collection
      chat.remove({}, () => {
        // emit clear
        socket.emit("clear");
      });
    });
  });
});
