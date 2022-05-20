require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
let bodyParser = require('body-parser')

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));

//Mongo db Config
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI);

//Create Schema for shorten url
const Schema = mongoose.Schema;

const shortURLSchema = new Schema({
  short_url: { type: Number},
  original_url: { type: String}
});

let ShortURL = mongoose.model('ShortURL', shortURLSchema)

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.route('/api/shorturl/:shortURL?')
  .get((req, res) => {
    if (isNaN(req.params.shortURL))
    {
      res.json({"error": "Wrong format"})
    }
    else
    {
      ShortURL.findOne( {short_url: req.params.shortURL}, function(err, data){
        if (!data)
        {
          res.json({"error": "No short URL found for the given input"})
        }
        else
        {
          let url = data.original_url;
          res.writeHead(301, {
            location: url
          });
          res.end();
        }
      })
    }
  })
  .post((req, res) => {
    //Check the url is vaild
    if (req.body.url.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g))
    {
      //Check if url exist in db
      ShortURL.findOne( {original_url: req.body.url}, function(err, data){
        if (err) return console.error(err);
        if (!data)
        {
          //Create new url
          ShortURL.estimatedDocumentCount(function (err, count) {
            if (err) return console.error(err);
            let newShortURL = new ShortURL({
              original_url: req.body.url,
              short_url: count + 1
            })
  
            newShortURL.save(function(err, data) {
              if (err) return console.error(err);
              res.json({"original_url": data.original_url, "short_url": data.short_url})
            })
          })
        } else
        {
          res.json({"original_url": data.original_url, "short_url": data.short_url})
        }
      })
    }
    else
    {
      res.json({"error": "invalid url"});
    }
  })

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
