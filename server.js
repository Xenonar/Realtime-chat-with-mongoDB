const mongo = require("mongodb").MongoClient;
const clients = require("socket.io").listen(4000).sockets;
// ToDo: Route and passport

/**  Dependencies document
MongoDB: https://github.com/mongodb/node-mongodb-native
Socket.io: https://github.com/socketio/socket.io*/

// Connect to mongoDB
// MEMO: Need to run mongo or install local mongoDB
const url = "mongodb://127.0.0.1/mongoauc";

mongo.connect(url, function(err, client) {
  if (err) {
    throw err;
  }
  console.log("MongoDB connected....");
  let database = client.db("auction");
  var getRoom = "Ar2";

  //connect to Socket.io
  clients.on("connection", function(socket) {
    // make query
    socket.on("input-room", data => {
      if (data == undefined) {
        getRoom = "Ar2";
      } else {
        getRoom = data.room;
      }
    });
    let chat = database.collection("auc");

    // create function to send status
    sendStatus = function(s) {
      socket.emit("status ", s);
    };

    // get chat from mongo collection
    chat
      .find({ room: getRoom })
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
      console.log(getRoom);
      room = data.room;
      let name = data.name;
      let message = data.message;
      let timestamp = Date.now();

      //check for name and message
      if (name == "" || message == "") {
        //send error status
        sendStatus("Please enter name and message");
      } else {
        // insert message to database setup guideline ->output
        const output = {
          room: room,
          Keys: [
            {
              name: name,
              message: message,
              time: timestamp
            }
          ]
        };
        chat.insertOne(output, (req, res) => {
          console.log(res);
          clients.emit("output", [output]);

          // Send status obj
          sendStatus({
            message: "Message sent",
            clear: true
          });
        });
      }
    });
    // Handle clear
    // ToDO: set authentication for this function
    socket.on("clear", data => {
      // Remove all chat from collection
      chat.remove({}, () => {
        // emit clear
        socket.emit("clear");
      });
    });
  });
});

// Route for future
