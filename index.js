const express = require('express')
require('dotenv').config()
const bodyParser = require('body-parser')
const cors = require('cors')
const ObjectId = require('mongodb').ObjectId;

const admin = require('firebase-admin');
var serviceAccount = require("./book-passage-firebase-adminsdk-g8fdb-d75dcf898e.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qk4l2.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express()
const port = process.env.PORT || 5000;

app.use(bodyParser.json())
app.use(cors())


app.use(bodyParser.json())


client.connect(err => {
  const booksCollection = client.db("BookPassage").collection("books");

  app.get('/books', (req, res) => {
    booksCollection.find()
      .toArray((err, documents) => {
        res.send(documents);
      })
  })

  app.get('/book/:bookId', (req, res) => {
    const bookId = req.params.bookId
    booksCollection.find({_id: ObjectId(bookId)})
    .toArray((err, documents) => {
      res.send(documents);
    })
  })

  app.post('/addBook', (req, res) => {
    const newBookData = req.body;
    console.log('adding new event', newBookData);
    booksCollection.insertOne(newBookData)
      .then(result => {
        res.send(result)
      })
  })
  app.delete('/deleteBook/:bookId',(req, res) => {
    const bookId = ObjectId(req.params.bookId);
    booksCollection.findOneAndDelete({_id:bookId})
      .then(result => {
        console.log(result)
        res.send(result)
      })
  })

});

client.connect(err => {
  const orderCollection = client.db("BookPassage").collection("orders");

  app.post('/addOrder', (req, res) => {
    const newOrder = req.body;
    console.log('adding new order', newOrder);
    orderCollection.insertOne(newOrder)
      .then(result => {
        res.send(result)
      })
  })

  app.get('/orders', (req, res) => {
    const bearer = req.headers.authorization;
    console.log(bearer)
    if (bearer && bearer.startsWith('Bearer ')) {
      console.log('hamaise');
      const idToken = bearer.split(' ')[1];
      console.log({ idToken });
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          console.log(tokenEmail, req.query.email);
          if (tokenEmail === req.query.email) {
            orderCollection.find({ email: req.query.email })
              .toArray((errors, documents) => {
                res.send(documents)
              })
          }
          // ...
        })
        .catch((error) => {
          // Handle error
        });
    }
    // orderCollection.find({email: queryEmail})
    // .toArray((err, documents) => {
    //   res.send(documents);
    // })
  })
  
});



app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})