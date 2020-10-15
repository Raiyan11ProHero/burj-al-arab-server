const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ydkdb.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const port = 5000


const app = express()

app.use(cors());
app.use(bodyParser.json());


var serviceAccount = require("./configs/burj-al-arab-6cf9d-firebase-adminsdk-i9npn-abd7fc6110.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIRE_DB
});



const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const bookings = client.db("burjAlArab").collection("bookings");

  app.post('/addBooking', (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking)
      .then(result => {
        res.send(result.insertedCount > 0);
      })
  })

  app.get('/bookings', (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer')) {
      const idToken = bearer.split(' ')[1];
      admin.auth().verifyIdToken(idToken)
        .then(function (decodedToken) {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          if (tokenEmail == queryEmail) {
            bookings.find({ email: queryEmail })
              .toArray((err, documents) => {
                res.status(200).send(documents);
              })
          }
          else{
            res.status(401).send('Hey!! Who are you? This is an <b>unauthorized access!!</b>')
          }
        }).catch(function (error) {
          res.status(401).send('Hey!! Who are you? This is an <b>unauthorized access!!</b>')
        });
    }

    else{
      res.status(401).send('Hey!! Who are you? This is an <b>unauthorized access!!</b>')
    }




  })
});

app.listen(process.env.PORT || port)