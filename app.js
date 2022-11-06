'use strict';

require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const Pool = require('pg').Pool;
const jwt_decode = require('jwt-decode');


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

const verifyUserToken= function (token) {
  const decoded = jwt_decode(token);
  if (decoded.appid && decoded.appid == process.env.CLIENT_ID){
    return true;
  } else {
    return false;
  }
}

const getEmailFromToken= function (token) {
  const decoded = jwt_decode(token);
  if (decoded.upn){
    return decoded.upn;
  } else {
    return null;
  }
}


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

    // Implement form validation

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


app.post('/api/verify/', async (req, res) => {
  try {
    const token= req.body['token'] || "";

    const verified= verifyUserToken(token);
    const email= getEmailFromToken(token);

    res.status(200).send({
      'verified': verified,
      'email': email,
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
