'use strict';

require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const Pool = require('pg').Pool;
const jwt_decode = require('jwt-decode');

// import { verify, VerifyOptions } from 'azure-ad-verify-token';
let tokenVerify;
const dynamicImports= async () => {
  const {verify,} = await import('azure-ad-verify-token');
  tokenVerify= verify;
}
// dynamicImports().then(()=>{
//   const options = {
//     jwksUri: 'https://login.microsoftonline.com/common/discovery/keys',
//     issuer: 'https://login.microsoftonline.com/d00244c0-5012-477e-a93b-96150bb780cf/v2.0',
//     audience: '42f7b561-1c6f-451f-b1f0-ae82cd705e02',
//   };

//   const token= `eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjJaUXBKM1VwYmpBWVhZR2FYRUpsOGxWMFRPSSJ9.eyJhdWQiOiI0MmY3YjU2MS0xYzZmLTQ1MWYtYjFmMC1hZTgyY2Q3MDVlMDIiLCJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vZDAwMjQ0YzAtNTAxMi00NzdlLWE5M2ItOTYxNTBiYjc4MGNmL3YyLjAiLCJpYXQiOjE2NjYxNDMxMTIsIm5iZiI6MTY2NjE0MzExMiwiZXhwIjoxNjY2MTQ3MDEyLCJuYW1lIjoiTWFyaW9zIERlbGVnYXRlZCIsIm9pZCI6IjAwNTZjYTUxLTgwNjgtNDAwMS1hNjQzLWJkNTk5NDYxYzgxYiIsInByZWZlcnJlZF91c2VybmFtZSI6ImRlbGVnYXRlZF91c2VyQGN5cHJ1czMzOC5vbm1pY3Jvc29mdC5jb20iLCJyaCI6IjAuQVhvQXdFUUMwQkpRZmtlcE81WVZDN2VBejJHMTkwSnZIQjlGc2ZDdWdzMXdYZ0o2QU1vLiIsInN1YiI6IlRnZGlaTHFBMjZNelJOU2h5clo4ZUJJa2c1bGRZVUhRYXE3RUVWMlpQYkEiLCJ0aWQiOiJkMDAyNDRjMC01MDEyLTQ3N2UtYTkzYi05NjE1MGJiNzgwY2YiLCJ1dGkiOiJqamRtTU90SWdrbVNESlgwNmhsQkFBIiwidmVyIjoiMi4wIn0.Rv4YO_lt2mKRNNqsrKAGTKiXAeNV9Q0Rze0mK8aS1AWMI10JJx09tWF-fcCBczWfJ-vW9RW7s-eyE7mnjf87tQapbEN540HxL431GqT4UYt_ThD-delZGFF3ulJM1vLwiMcVzlDspSy911aKoC7HTQhaCPzjMKV8PXMKc3SJaYxGBf2J1BsLDeNBTvUjY0r_PBWgeqtCFtlx-mKTAm3EX_snpJ-sMS0wk0scVOQkAfo8wvYDC5H5TuwAF1E1L5lbOltEU_s0vGUtqqGKZDSlK8v6l47aZdY-Kyj-2XlKQsgNZRUw5VAeQZCfM-Z7kA-cd7J8oIfTW13c0Zk6N-uwJg`;

//   tokenVerify(token, options)
//   .then((decoded) => {
//     // verified and decoded token
//     console.log(decoded);
//   })
//   .catch((error) => {
//     // invalid token
//     console.error(error);
//   });
// });


const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    ssl: {
      rejectUnauthorized: false,
    },
  });

console.log('NODE_ENV: ' + process.env.NODE_ENV);

console.log('Version: 1.0');

const getToken= async function () {
    const REQ_URL = `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`;

    const REQ_HEADERS = {
      "Content-Type": "application/x-www-form-urlencoded"
    };
    
    const urlencoded = new URLSearchParams();
    urlencoded.append("grant_type", "client_credentials");
    urlencoded.append("client_id", process.env.CLIENT_ID);
    urlencoded.append("scope", "https://graph.microsoft.com/.default");
    urlencoded.append("client_secret", process.env.CLIENT_SECRET);
  
    const res = await fetch(REQ_URL, {
      method: 'POST',
      headers: REQ_HEADERS,
      body: urlencoded,
      redirect: 'follow'
    })
      // .then(response => response.text())
      .then(response => response.json())
      .catch(error => console.log(error));
  
    return res;
}

const createOnlineMeeting= async function (token ) {
  const REQ_URL = `https://graph.microsoft.com/v1.0/users/${process.env.USER_ID}/onlineMeetings`;

  const REQ_HEADERS = {
    "Authorization": token,
    "Content-Type": "application/json"
  };
  
  const REQ_BODY = JSON.stringify({
    "startDateTime": "2019-07-12T14:30:34.2444915-07:00",
    "endDateTime": "2019-07-12T15:00:34.2464912-07:00",
    "subject": "Citizen Requested Meeting"
  });

  const res = await fetch(REQ_URL, {
    method: 'POST',
    headers: REQ_HEADERS,
    body: REQ_BODY,
    redirect: 'follow'
  })
    // .then(response => response.text())
    .then(response => response.json())
    .catch(error => console.log(error));

  return res;
}

const deleteOnlineMeeting= async function (token, meeting_id ) {
  const REQ_URL = `https://graph.microsoft.com/v1.0/users/${process.env.USER_ID}/onlineMeetings/${meeting_id}`;

  const REQ_HEADERS = {
    "Authorization": token,
  };

  const res = await fetch(REQ_URL, {
    method: 'DELETE',
    headers: REQ_HEADERS,
    redirect: 'follow'
  })
    // .then(response => response.text())
    // .then(response => response.json())
    // .catch(error => console.log(error));

  // return res;
}

const getNewMeeting= async function () {
  const token= (await getToken()).access_token;
  const meeting= await createOnlineMeeting(token);

  const meeting_id= meeting.id;
  const meeting_url= meeting.joinWebUrl;

  return {meeting_id, meeting_url}
}

const authenticateUser= async function (email, password) {
  const REQ_URL = `https://login.microsoftonline.com/organizations/oauth2/v2.0/token`;

  const REQ_HEADERS = {
    "Content-Type": "application/x-www-form-urlencoded"
  };
  
  const urlencoded = new URLSearchParams();
  urlencoded.append("grant_type", "password");
  urlencoded.append("client_id", process.env.CLIENT_ID);
  urlencoded.append("scope", "user.read openid profile offline_access");
  urlencoded.append("client_secret", process.env.CLIENT_SECRET);
  urlencoded.append("username", email);
  urlencoded.append("password", password);

  const res = await fetch(REQ_URL, {
    method: 'POST',
    headers: REQ_HEADERS,
    body: urlencoded,
    redirect: 'follow'
  })
    // .then(response => response.text())
    .then(response => response.json())
    .catch(error => console.log(error));

  return res;
}

const verifyUserToken= function (token) {
  const decoded = jwt_decode(token);
  if (decoded.aud && decoded.aud == process.env.CLIENT_ID){
    return true;
  } else {
    return false;
  }
}

const getEmailFromToken= function (token) {
  const decoded = jwt_decode(token);
  if (decoded.preferred_username){
    return decoded.preferred_username;
  } else {
    return null;
  }
}

// getToken().then((res)=>{
//   createOnlineMeeting(res.access_token).then((res)=>{
//     console.log(res);
//   })
// })

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

app.use(express.static('public')); // Serve the Front-End

app.get('/api/', async (req, res) => {
  res.status(200).send('Azure Bot BackEnd is running!').end();
});


app.get('/api/testdb', async (req, res) => {
  try {
    const client= await pool.connect()
    try {
      let resDB = await client.query('SELECT NOW()');
      res.status(200).send(resDB['rows']).end();

    } catch (error) {
      throw error

    } finally {
      await client.release()
    }

  } catch (error) {
    console.log(error);
    res.status(400).send(error).end();
  }
});

app.get('/api/get-settings/', async (req, res) => {
  try {
    const client= await pool.connect()
    try {
      let resDB = await client.query(`
        select *
        from public.setting s 
        where s.id = 'chatbox_configuration';
      `);
      res.status(200).send(resDB['rows'][0]['jsonvalue']).end();

    } catch (error) {
      throw error

    } finally {
      await client.release()
    }

  } catch (error) {
    console.log(error);
    res.status(400).send(error).end();
  }
});

app.get('/api/get-current-queue/', async (req, res) => {
  try {
    const client= await pool.connect()
    try {
      let resDB = await client.query(`
        select count(*) as mycount
        from public.meeting m 
        where m.status = 'requested' or m.status = 'accepted';
      `);

      const count= resDB['rows'][0]['mycount'];
      res.status(200).send({
        'currentQueue': count
      }).end();

    } catch (error) {
      throw error

    } finally {
      await client.release()
    }

  } catch (error) {
    console.log(error);
    res.status(400).send(error).end();
  }
});

app.post('/api/create-meeting/', async (req, res) => {
  try {
    const form_name= req.body['form_name'] || "";
    const form_surname= req.body['form_surname'] || "";
    const form_mobile= req.body['form_mobile'] || "";
    const form_email= req.body['form_email'] || "";
    const form_afm= req.body['form_afm'] || "";
    const form_klidarithmos= req.body['form_klidarithmos'] || "";
    const form_details= req.body['form_details'] || "";

    if (form_name== "" || form_surname== "" || form_mobile== "" || form_email== "" || form_afm== ""){
      throw("Error: Παρακαλώ συμπληρώστε όλα τα πεδία με *");
    }

    const client= await pool.connect()
    let resDB;
    try {

      resDB = await client.query(`
      select *
      from public.setting s 
      where s.id = 'chatbox_configuration';
      `);

      // console.log(resDB['rows'][0]['jsonvalue']);

      const chatBoxStart= resDB['rows'][0]['jsonvalue'].chatBoxStart;
      const maxWaitingQueue= Number(resDB['rows'][0]['jsonvalue'].maxWaitingQueue);

      if (!chatBoxStart){
        throw "Error: Η υπηρεσία Live Communication είναι απενεργοποιημένη αυτή τη στιγμή";
      }

      resDB = await client.query(`
        select count(*) as mycount
        from public.meeting m 
        where m.status = 'requested' or m.status = 'accepted';
      `);

      const currentQueue= Number(resDB['rows'][0]['mycount']);


      if (currentQueue > maxWaitingQueue){
        throw "Error: Η υπηρεσία Live Communication δεν μπορεί να δεχτεί περαιτέρω μηνύματα";
      }

      const {meeting_id, meeting_url}= await getNewMeeting();
      const status= "requested";
      const created_at= new Date();

      resDB = await client.query(`
      INSERT INTO public.meeting ("meeting_id", "meeting_url", "status", "form_name", "form_surname", "form_mobile", "form_email", "form_details", "form_afm", "form_klidarithmos", "created_at") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);
            `
        , [meeting_id, meeting_url, status, form_name, form_surname, form_mobile, form_email, form_details, form_afm, form_klidarithmos, created_at]);
      

      res.status(200).send({
        "meeting_url" : meeting_url
      }).end();

    } catch (error) {
      throw error

    } finally {
      await client.release()
    }

  } catch (error) {
    console.log(error);
    res.status(400).send(error).end();
  }
});

app.get('/api/get-current-queue/', async (req, res) => {
  try {
    const client= await pool.connect()
    try {
      let resDB = await client.query(`
        select count(*) as mycount
        from public.meeting m 
        where m.status = 'requested' or m.status = 'accepted';
      `);

      const count= resDB['rows'][0]['mycount'];
      res.status(200).send({
        'currentQueue': count
      }).end();

    } catch (error) {
      throw error

    } finally {
      await client.release()
    }

  } catch (error) {
    console.log(error);
    res.status(400).send(error).end();
  }
});

app.post('/api/auth/', async (req, res) => {
  try {
    const email= req.body['email'] || "";
    const password= req.body['password'] || "";

    if (email== "" || password== ""){
      throw("Error: Παρακαλώ συμπληρώστε όλα τα πεδία.");
    }

    const authRes= await authenticateUser (email, password);
    if (authRes.error){
      throw("Error: Αποτυχία ταυτοποίησης. Παρακαλώ δοκιμάστε ξανά.");
    }

    const token_email= getEmailFromToken(authRes.id_token);

    res.status(200).send({
      'token': authRes.id_token,
      'email': token_email
    }).end();

  } catch (error) {
    console.log(error);
    res.status(400).send(error).end();
  }
});

app.post('/api/verify/', async (req, res) => {
  try {
    const token= req.body['token'] || "";

    const verified= verifyUserToken(token);

    res.status(200).send({
      'verified': verified
    }).end();

  } catch (error) {
    console.log(error);
    res.status(400).send(error).end();
  }
});

app.post('/api/set-settings/', async (req, res) => {
  try {
    const token= req.body['token'] || "";
    const chatBoxStart= req.body['chatBoxStart'] || false;
    const maxWaitingQueue= req.body['maxWaitingQueue'] || 100;
    const avgMeetingDuration= req.body['avgMeetingDuration'] || 30;

    if (!verifyUserToken(token)){
      throw("Error: Ανεπαρκή δικαιώματα");
    }

    const jsonvalue= JSON.stringify({
      'chatBoxStart': chatBoxStart,
      'maxWaitingQueue': maxWaitingQueue,
      'avgMeetingDuration': avgMeetingDuration,
    })

    const client= await pool.connect()
    let resDB;
    try {

      resDB = await client.query(`
      UPDATE public.setting s 
      SET jsonvalue = $1 
      WHERE s.id = 'chatbox_configuration';
            `
        , [jsonvalue,]);

      res.status(200).send({
        "chatbox_configuration" : jsonvalue
      }).end();

    } catch (error) {
      throw error

    } finally {
      await client.release()
    }

  } catch (error) {
    console.log(error);
    res.status(400).send(error).end();
  }
});

app.post('/api/get-meetings/', async (req, res) => {
  try {
    const token= req.body['token'] || "";

    if (!verifyUserToken(token)){
      throw("Error: Ανεπαρκή δικαιώματα");
    }

    const email= getEmailFromToken(token);

    if (!email){
      throw("Error: Ανεπαρκή δικαιώματα");
    }


    const client= await pool.connect()
    let resDB;
    try {

      resDB = await client.query(`
      select *
      from public.meeting m 
      where m.status = 'requested' or m.status = 'accepted' or date(m.created_at) = current_date;
            `
      );

      const meetings= resDB['rows'];

      res.status(200).send({
        "meetings" : meetings
      }).end();

    } catch (error) {
      throw error

    } finally {
      await client.release()
    }

  } catch (error) {
    console.log(error);
    res.status(400).send(error).end();
  }
});

app.post('/api/accept-meeting/', async (req, res) => {
  try {
    const token= req.body['token'] || "";
    const table_meeting_id= req.body['table_meeting_id'] || "";

    if (!verifyUserToken(token)){
      throw("Error: Ανεπαρκή δικαιώματα");
    }

    const email= getEmailFromToken(token);

    if (!email){
      throw("Error: Ανεπαρκή δικαιώματα");
    }


    const client= await pool.connect()
    let resDB;
    try {

      resDB = await client.query(`
      select *
      from public.meeting m 
      where m.id = $1;
            `
      , [table_meeting_id,]);

      if (resDB['rows'].length == 0) {
        throw("Error: Ανύπαρκτο meeting");
      }

      const meeting= resDB['rows'][0];

      if (meeting.status!= 'requested'){
        throw("Error: 'Αδύνατη πράξη'");
      }

      if (meeting.assigned_agent!= '-'){
        throw("Error: 'Το meeting το έχει ήδη αναλάβει άλλος πράκτορας'");
      }

      resDB = await client.query(`
      UPDATE public.meeting
      SET status = $1, assigned_agent = $2
      WHERE id = $3;
            `
        , ['accepted', email, table_meeting_id]);

      res.status(200).send({
        "success" : true
      }).end();

    } catch (error) {
      throw error

    } finally {
      await client.release()
    }

  } catch (error) {
    console.log(error);
    res.status(400).send(error).end();
  }
});

app.post('/api/done-meeting/', async (req, res) => {
  try {
    const token= req.body['token'] || "";
    const table_meeting_id= req.body['table_meeting_id'] || "";

    if (!verifyUserToken(token)){
      throw("Error: Ανεπαρκή δικαιώματα");
    }

    const email= getEmailFromToken(token);

    if (!email){
      throw("Error: Ανεπαρκή δικαιώματα");
    }


    const client= await pool.connect()
    let resDB;
    try {

      resDB = await client.query(`
      select *
      from public.meeting m 
      where m.id = $1;
            `
      , [table_meeting_id,]);

      if (resDB['rows'].length == 0) {
        throw("Error: Ανύπαρκτο meeting");
      }

      const meeting= resDB['rows'][0];

      if (meeting.status!= 'accepted'){
        throw("Error: 'Αδύνατη πράξη'");
      }

      if (meeting.assigned_agent!= email){
        throw("Error: 'Το meeting το έχει ήδη αναλάβει άλλος πράκτορας'");
      }

      resDB = await client.query(`
      UPDATE public.meeting
      SET status = $1
      WHERE id = $2;
            `
        , ['done', table_meeting_id]);

      await deleteOnlineMeeting(token, meeting.meeting_id);

      res.status(200).send({
        "success" : true
      }).end();

    } catch (error) {
      throw error

    } finally {
      await client.release()
    }

  } catch (error) {
    console.log(error);
    res.status(400).send(error).end();
  }
});

app.post('/api/reject-meeting/', async (req, res) => {
  try {
    const token= req.body['token'] || "";
    const table_meeting_id= req.body['table_meeting_id'] || "";
    const reject_reason= req.body['reject_reason'] || "";

    if (!verifyUserToken(token)){
      throw("Error: Ανεπαρκή δικαιώματα");
    }

    const email= getEmailFromToken(token);

    if (!email){
      throw("Error: Ανεπαρκή δικαιώματα");
    }


    const client= await pool.connect()
    let resDB;
    try {

      resDB = await client.query(`
      select *
      from public.meeting m 
      where m.id = $1;
            `
      , [table_meeting_id,]);

      if (resDB['rows'].length == 0) {
        throw("Error: Ανύπαρκτο meeting");
      }

      const meeting= resDB['rows'][0];

      if (!(meeting.status== 'requested' || (meeting.status== 'accepted' && meeting.assigned_agent== email))){
        throw("Error: 'Αδύνατη πράξη'");
      }

      resDB = await client.query(`
      UPDATE public.meeting
      SET status = $1, reject_reason = $2, assigned_agent = $3
      WHERE id = $4;
            `
        , ['rejected', reject_reason, email, table_meeting_id]);

      await deleteOnlineMeeting(token, meeting.meeting_id);

      res.status(200).send({
        "success" : true
      }).end();

    } catch (error) {
      throw error

    } finally {
      await client.release()
    }

  } catch (error) {
    console.log(error);
    res.status(400).send(error).end();
  }
});



// Start the server
const PORT = process.env.PORT || 8090;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});


module.exports = app;
