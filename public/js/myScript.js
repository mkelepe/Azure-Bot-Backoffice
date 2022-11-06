window.myState= {};
window.myState.isCurrentScreenHome= true;

const BACKEND_HOST= '';


const verifyToken= async (token) => {

    const REQ_URL = `${BACKEND_HOST}/api/verify/`;

    const REQ_HEADERS = {
      "Content-Type": "application/json"
    };
    
    const REQ_BODY = JSON.stringify({
      "token": token,
    });
  
    const res = await fetch(REQ_URL, {
      method: 'POST',
      headers: REQ_HEADERS,
      body: REQ_BODY,
      redirect: 'follow'
    })
    //   .then(response => response.text())
      .then(response => response.json())
      .catch(error => console.log(error));

      // console.log(res);
  
      if (res.verified){
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("email", res.email);
      } else{
        sessionStorage.clear();
        return;
      }
}

const updateSettingsElements= async function () {
    const REQ_URL = `${BACKEND_HOST}/api/get-settings/`;

    const REQ_HEADERS = {
    };
  
    const res = await fetch(REQ_URL, {
      method: 'GET',
      headers: REQ_HEADERS,
      redirect: 'follow'
    })
      // .then(response => response.text())
      .then(response => response.json())
      .catch(error => console.log(error));

      document.getElementById('inputMaxWaitingQueue').value= res.maxWaitingQueue;
      document.getElementById('inputAvgMeetingDuration').value= res.avgMeetingDuration;
      document.getElementById('chatBoxStartOn').checked= res.chatBoxStart;
      document.getElementById('chatBoxStartOff').checked= !res.chatBoxStart;
    }

document.getElementById('buttonScreenToogle').onclick= () => {    
    const titleHome= document.getElementById('titleHome');
    const titleSettings= document.getElementById('titleSettings');
    const buttonHome= document.getElementById('buttonHome');
    const buttonSettings= document.getElementById('buttonSettings');
    const screenHome= document.getElementById('screenHome');
    const screenSettings= document.getElementById('screenSettings');
    
    if (window.myState.isCurrentScreenHome) {
        updateSettingsElements();
        titleHome.classList.add('myHidden');
        titleSettings.classList.remove('myHidden');
        buttonHome.classList.remove('myHidden');
        buttonSettings.classList.add('myHidden');
        screenHome.classList.add('myHidden');
        screenSettings.classList.remove('myHidden');
    } else {
        titleHome.classList.remove('myHidden');
        titleSettings.classList.add('myHidden');
        buttonHome.classList.add('myHidden');
        buttonSettings.classList.remove('myHidden');
        screenHome.classList.remove('myHidden');
        screenSettings.classList.add('myHidden');
    }

    window.myState.isCurrentScreenHome= !window.myState.isCurrentScreenHome;
}

document.getElementById('buttonSignOutToogle').onclick= () => {    
    logout();
}

document.getElementById('buttonSettingsSave').onclick= async () => {
    const maxWaitingQueue= document.getElementById('inputMaxWaitingQueue').value;
    const avgMeetingDuration= document.getElementById('inputAvgMeetingDuration').value;
    const chatBoxStart= document.getElementById('chatBoxStartOn').checked;

    const REQ_URL = `${BACKEND_HOST}/api/set-settings/`;

    const REQ_HEADERS = {
        "Content-Type": "application/json"
      };
      
      const REQ_BODY = JSON.stringify({
        "token": sessionStorage.getItem('token'),
        "maxWaitingQueue": maxWaitingQueue,
        "avgMeetingDuration": avgMeetingDuration,
        "chatBoxStart": chatBoxStart
      });
    
      const res = await fetch(REQ_URL, {
        method: 'POST',
        headers: REQ_HEADERS,
        body: REQ_BODY,
        redirect: 'follow'
      })
      .catch(error => console.log(error));

      if (res.status== 200){
        alert('Ρυθμίσεις ανανεώθηκαν επιτυχώς.')
      } else{
        alert('Error: Οι ρυθμίσεις δεν ανανεώθηκαν!');
      }

}

const updateMeetings= async function () {
    const REQ_URL = `${BACKEND_HOST}/api/get-meetings/`;

    const REQ_HEADERS = {
        "Content-Type": "application/json"
      };
      
      const REQ_BODY = JSON.stringify({
        "token": sessionStorage.getItem('token'),
      });
    
      const res = await fetch(REQ_URL, {
        method: 'POST',
        headers: REQ_HEADERS,
        body: REQ_BODY,
        redirect: 'follow'
      });

      if (res.status!= 200){
        console.error(await res.text())
        return;
      }

      const {meetings}= await res.json();

      for (let i=0; i< meetings.length; i++){
        const m= meetings[i];
        await createMeetingRow(m.id, m.meeting_url);
        await updateMeetingRow(m);
      }
}

const createMeetingRow= async function (meetingId, meeting_url) {
    if (document.getElementById('meeting-row-' + meetingId)){
        return;
    }

    const row = document.createElement("tr");
    row.id= 'meeting-row-' + meetingId;
    row.innerHTML= `
    <td id="form_name-${meetingId}" class="myFixedColumn"></td>
    <td id="form_surname-${meetingId}" class="myFixedColumn"></td>
    <td id="form_mobile-${meetingId}" class="myFixedColumn"></td>
    <td id="form_email-${meetingId}" class="myFixedColumn"></td>
    <td id="form_afm-${meetingId}" class="myFixedColumn"></td>
    <td id="form_klidarithmos-${meetingId}" class="myFixedColumn">-</td>
    <td id="form_details-${meetingId}" class="myFixedColumn"></td>
    <td id="assigned_agent-${meetingId}" class="myFixedColumn"></td>
    <td>
      <button id="button-accept-${meetingId}" class="w3-block w3-round-large w3-hover-black myClickable w3-green" type="button">Accept</button>
    </td>
    <td>
      <button id="button-join-${meetingId}" class="w3-block w3-round-large w3-hover-black myClickable w3-purple" type="button">Join</button>
    </td>
    <td>
      <button id="button-done-${meetingId}" class="w3-block w3-round-large w3-hover-black myClickable w3-blue" type="button">Done</button>
    </td>
    <td>
      <button id="button-reject-${meetingId}" class="w3-block w3-round-large w3-hover-black myClickable w3-red" type="button">Reject</button>
    </td>
    `

    const tableMeetingsElement= document.getElementById("tableMeetings");
    tableMeetingsElement.appendChild(row);

    document.getElementById(`button-accept-${meetingId}`).onclick= createAcceptButton(meetingId);
    document.getElementById(`button-join-${meetingId}`).onclick= createJoinButton(meetingId, meeting_url);
    document.getElementById(`button-done-${meetingId}`).onclick= createDoneButton(meetingId);
    document.getElementById(`button-reject-${meetingId}`).onclick= createRejectButton(meetingId);

}

const createAcceptButton= function (meetingId){
    return async function () {
        const REQ_URL = `${BACKEND_HOST}/api/accept-meeting/`;

        const REQ_HEADERS = {
            "Content-Type": "application/json"
          };
          
          const REQ_BODY = JSON.stringify({
            "token": sessionStorage.getItem('token'),
            "table_meeting_id": meetingId,
          });
        
          const res = await fetch(REQ_URL, {
            method: 'POST',
            headers: REQ_HEADERS,
            body: REQ_BODY,
            redirect: 'follow'
          });
    
          if (res.status!= 200){
            console.error(await res.text())
            return;
          }
    
          const jsonres= await res.json();
    }
}

const createJoinButton= function (meetingId, meeting_url){
    return async function () {
        window.open(meeting_url);
    }
}

const createDoneButton= function (meetingId){
    return async function () {
        const REQ_URL = `${BACKEND_HOST}/api/done-meeting/`;

        const REQ_HEADERS = {
            "Content-Type": "application/json"
          };
          
          const REQ_BODY = JSON.stringify({
            "token": sessionStorage.getItem('token'),
            "table_meeting_id": meetingId,
          });
        
          const res = await fetch(REQ_URL, {
            method: 'POST',
            headers: REQ_HEADERS,
            body: REQ_BODY,
            redirect: 'follow'
          });
    
          if (res.status!= 200){
            console.error(await res.text())
            return;
          }
    
          const jsonres= await res.json();
    }
}

const createRejectButton= function (meetingId){
    return async function () {
        const REQ_URL = `${BACKEND_HOST}/api/reject-meeting/`;

        const REQ_HEADERS = {
            "Content-Type": "application/json"
          };
          
          const REQ_BODY = JSON.stringify({
            "token": sessionStorage.getItem('token'),
            "table_meeting_id": meetingId,
            "reject_reason": "",
          });
        
          const res = await fetch(REQ_URL, {
            method: 'POST',
            headers: REQ_HEADERS,
            body: REQ_BODY,
            redirect: 'follow'
          });
    
          if (res.status!= 200){
            console.error(await res.text())
            return;
          }
    
          const jsonres= await res.json();
    }
}

const updateMeetingRow= async function (meeting) {
    const meetingId= meeting.id;

    const form_name_element= document.getElementById(`form_name-${meetingId}`);
    if (form_name_element.innerHTML != meeting.form_name){
        form_name_element.innerHTML= meeting.form_name;
    }

    const form_surname_element= document.getElementById(`form_surname-${meetingId}`);
    if (form_surname_element.innerHTML != meeting.form_surname){
        form_surname_element.innerHTML= meeting.form_surname;
    }

    const form_mobile_element= document.getElementById(`form_mobile-${meetingId}`);
    if (form_mobile_element.innerHTML != meeting.form_mobile){
        form_mobile_element.innerHTML= meeting.form_mobile;
    }

    const form_email_element= document.getElementById(`form_email-${meetingId}`);
    if (form_email_element.innerHTML != meeting.form_email){
        form_email_element.innerHTML= meeting.form_email;
    }

    const form_afm_element= document.getElementById(`form_afm-${meetingId}`);
    if (form_afm_element.innerHTML != meeting.form_afm){
        form_afm_element.innerHTML= meeting.form_afm;
    }

    const form_klidarithmos_element= document.getElementById(`form_klidarithmos-${meetingId}`);
    if (form_klidarithmos_element.innerHTML != meeting.form_klidarithmos){
        form_klidarithmos_element.innerHTML= meeting.form_klidarithmos;
    }

    const form_details_element= document.getElementById(`form_details-${meetingId}`);
    if (form_details_element.innerHTML != meeting.form_details){
        form_details_element.innerHTML= meeting.form_details;
    }

    const assigned_agent_element= document.getElementById(`assigned_agent-${meetingId}`);
    if (assigned_agent_element.innerHTML != meeting.assigned_agent){
        assigned_agent_element.innerHTML= meeting.assigned_agent;
    }

    const accept_button_element= document.getElementById(`button-accept-${meetingId}`);
    const join_button_element= document.getElementById(`button-join-${meetingId}`);
    const done_button_element= document.getElementById(`button-done-${meetingId}`);
    const reject_button_element= document.getElementById(`button-reject-${meetingId}`);

    if (meeting.status== 'accepted' && meeting.assigned_agent!= sessionStorage.getItem('email')){
        disableButton(accept_button_element);
        disableButton(join_button_element);
        disableButton(done_button_element);
        disableButton(reject_button_element);
        return;
    }

    if (meeting.status== 'requested'){
        enableButton(accept_button_element);
        disableButton(join_button_element);
        disableButton(done_button_element);
        enableButton(reject_button_element);
        return;
    }
    if (meeting.status== 'accepted'){
        disableButton(accept_button_element);
        enableButton(join_button_element);
        enableButton(done_button_element);
        enableButton(reject_button_element);
        return;
    }
    if (meeting.status== 'done'){
        disableButton(accept_button_element);
        disableButton(join_button_element);
        disableButton(done_button_element);
        disableButton(reject_button_element);
        return;
    }
    if (meeting.status== 'rejected'){
        disableButton(accept_button_element);
        disableButton(join_button_element);
        disableButton(done_button_element);
        disableButton(reject_button_element);
        return;
    }
    
}

const disableButton= function (buttonElement) {
    buttonElement.disabled= true;
    buttonElement.classList.add('w3-grey')
    buttonElement.classList.add('myDisabledButton')
    buttonElement.classList.remove('myClickable')
    buttonElement.classList.remove('w3-hover-black')
}

const enableButton= function (buttonElement) {
    buttonElement.disabled= false;
    buttonElement.classList.remove('w3-grey')
    buttonElement.classList.remove('myDisabledButton')
    buttonElement.classList.add('myClickable')
    buttonElement.classList.add('w3-hover-black')
}

setInterval(updateMeetings, 1000);