window.myGlobalSpace= {};
window.myGlobalSpace.allRestID= [];
window.myGlobalSpace.RestID= "None";

wakeUpServer= () => {
    let data= [];
    data.push("None");
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        console.log("Server is up!")
        // alert ("Okay");
        // let table= JSON.parse(JSON.parse(this.responseText).Message);
      } else if (this.readyState == 4 && this.status != 200) {
        // alert ("Error: " + this.responseText);
      }
    };
    xhttp.open("POST", "https://tensortech.herokuapp.com/post/wakeUp", true);
    xhttp.setRequestHeader("Content-type", "text/plain; charset=utf-8");
    xhttp.send(JSON.stringify(data));
  }
  
  wakeUpServer();

  document.getElementById("cmdSendMessage").onclick= () => {
    let name= document.getElementById("cname").value;
    let email= document.getElementById("cemail").value;
    let subject= document.getElementById("csubject").value;
    let message= document.getElementById("cmessage").value;

    if (name== "" || email== "" || subject== "" || message== ""){
      alert("Error: Please fill in all fields in the form.");
      return;
    }

    if (document.getElementById("cHP").value!= ""){
      return;
    }

    // Clear fields
    document.getElementById("cname").value= "";
    document.getElementById("cemail").value= "";
    document.getElementById("csubject").value= "";
    document.getElementById("cmessage").value= "";

    // Send Form
    let data={};
    data['name']= name;
    data['email']= email;
    data['subject']= subject;
    data['message']= message;
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        alert("Thank you for your message!");
      } else if (this.readyState == 4 && this.status != 200) {
        alert ("Error: Something went wrong, please try again later.");
        console.log(this.responseText);
      }
    };
    xhttp.open("POST", "https://tensortech.herokuapp.com/post/sendContactFormMessage", true);
    xhttp.setRequestHeader("Content-type", "text/plain; charset=utf-8");
    xhttp.send(JSON.stringify(data));
  }