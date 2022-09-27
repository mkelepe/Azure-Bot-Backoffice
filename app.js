'use strict';

require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const Pool = require('pg').Pool;

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS
  });

console.log('NODE_ENV: ' + process.env.NODE_ENV);

console.log('Version: 1.0');

const app = express();

app.use(express.raw({limit: '5mb'}));
app.use(express.text({limit: '5mb'}));
app.use(express.json({limit: '5mb'}));
app.use(express.urlencoded({extended: true, limit: '5mb',}));

app.use(function(req, res, next) { 
  res.header("Access-Control-Allow-Origin", "*"); 
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, X-Auth, Admin-Key, Reset-Token");
  next();
});

app.get('/api/', async (req, res) => {
  res.status(200).send('Azure Bot BackEnd is running!').end();
});


app.get('/api/testdb', async (req, res) => {
  try {
    const client= await pool.connect()
    try {
      // await client.query('BEGIN')
      let resDB = await client.query('SELECT NOW()');
      res.status(200).send(resDB['rows']).end();
      // await client.query('COMMIT')

    } catch (error) {
      // await client.query('ROLLBACK')
      throw error

    } finally {
      await client.release()
    }

  } catch (error) {
    console.log(error);
    res.status(400).send(error).end();
  }
});

app.get('/get-waiting-list/', async (req, res) => {
  res.status(200).send('Azure Bot Backoffice is running!').end();
});

app.post('/create-meeting/', async (req, res) => {
  res.status(200).send('Azure Bot Backoffice is running!').end();
});


// Start the server
const PORT = process.env.PORT || 8090;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});


module.exports = app;
