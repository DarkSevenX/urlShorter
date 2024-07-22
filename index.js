require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Database = require('better-sqlite3');
const shortid = require('shortid');

const app = express();
const db = new Database('links.db')

db.exec(`
  CREATE TABLE IF NOT EXISTS urls(
    originalUrl TEXT NOT NULL,
    shortUrl INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT
  )
`);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use((req,res,next) => {
  console.log(`${req.method} - ${req.path}`)
  next()
})

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', (req, res) => {
  let { url: originalUrl } = req.body;

  const urlRegex = /^(http|https):\/\/[^ "]+$/;
  const regex = new RegExp(urlRegex);

  if (!originalUrl.match(regex)) {
    res.json({ error: 'invalid url' });
    return;
  }

  let url = db.prepare('SELECT * FROM urls WHERE originalUrl = ?').get(originalUrl);

  if (!url) {
    const insert = db.prepare('INSERT INTO urls(originalUrl) VALUES(?)');
    const result = insert.run(originalUrl);
    const newUrl = db.prepare('SELECT * FROM urls WHERE originalUrl = ?').get(originalUrl);
    res.json({
      original_url: newUrl.originalUrl,
      short_url: newUrl.shortUrl
    });
  } else {
    res.json({
      original_url: url.originalUrl,
      short_url: url.shortUrl
    });
  }
});

app.get('/api/shorturl/:shortUrl', (req, res) => {
  const { shortUrl } = req.params;
  const url = db.prepare('SELECT * FROM urls WHERE shortUrl = ?').get(shortUrl);

  if (!url) {
    res.json({ error: 'url not found' });
  } else {
    res.redirect(url.originalUrl);
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
