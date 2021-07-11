const express = require("express");
const port = 4000;
const bodyParser = require("body-parser");
const cors = require("cors");
const admin = require("firebase-admin");
const { MongoClient, Logger } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9wgmh.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
require("dotenv").config();

var serviceAccount = require("./burj-al-arab-motel-firebase-adminsdk-cd2sw-0b152d38ea.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const bookings = client.db("burjAlArab").collection("bookings");

  app.post("/addBooking", (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking).then((result) => {
      res.send(result.insertedCount > 0);
    });
    console.log(newBooking);
  });

  app.get("/bookings", (req, res) => {
    // console.log(req.query.email);
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];
      console.log({ idToken });
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          if (tokenEmail == queryEmail) {
            bookings.find({ email: queryEmail }).toArray((err, documents) => {
              res.send(documents);
            });
          } else {
            res.status(401).send("Unauthorized Access");
          }
        })
        .catch((error) => {
          // Handle error
        });
    } else {
      res.status(401).send("Unauthorized Access");
    }
  });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
