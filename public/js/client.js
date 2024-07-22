var connection=new WebSocket("ws://localhost:8000")
connection.onopen =function(){
    console.log("Connected to the server!");
}
var recordButton =document.querySelector("#start-recording");
var downloadVideo =document.querySelector("#download-video");

recordButton.addEventListener("click",function(){

    if(recordButton.textContent=='Start Recording'){
        startRecording();
    }
    else{
        stopRecording();
        recordButton.textContent='Start Recording';
        downloadVideo.disabled = false;
    }
})

downloadVideo.addEventListener("click",()=>{

    const blob= new Blob(recordedBlobs,{
        type:"video/webm"
    });

    const url=window.URL.createObjectURL(blob);
    const a= document.createElement('a');
    a.style.display='none'; 
    a.href=url;
    a.download= 'webrtc_recorded.webm';
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url)
    },100);

});
function handleDataAvailable(event){
    if( event.data && event.data.size>0){
        recordedBlobs.push(event.data);
    }
}
function startRecording()
{
    recordedBlobs =[];
    let options ={
        mimeType:'video/webm;codecs=vp9,opus'
    }

    if(!MediaRecorder.isTypeSupported(options.mimeType)){
        console.error('${options.mimeType} is not supported');
        options = {
            mimeType:'video/webm;codecs=vp8,opus'
        }
        if(!MediaRecorder.isTypeSupported(options.mimeType)){
            console.error('${options.mimeType} is not supported');
            options = {
                mimeType:'video/webm'
            }
            if(!MediaRecorder.isTypeSupported(options.mimeType)){
                console.error('${options.mimeType} is not supported');
                options = {
                    mimeType:''
                }
            }
        }
    }
    try{
        mediaRecorder=new MediaRecorder(window.stream,options);
    }
    catch (error){
        console.error("Media recorder error:",error);
    }
    mediaRecorder.start();
    recordButton.textContent='Stop Recording';
        downloadVideo.disabled = true;
        mediaRecorder.ondataavailable=handleDataAvailable;
}
function stopRecording()
{
    mediaRecorder.stop();
}
connection.onmessage=function(msg){
    var data=JSON.parse(msg.data)

    switch(data.type){
            case "online":
            onlineProcess(data.success);
            break;
            case "not_available": 
            call_status.innerHTML='';
            alert(data.name+" is offline!");
            call_btn.removeAttribute("disabled");

            break;

            case "offer":
            
            call_btn.setAttribute("disabled","disabled");             
            call_status.innerHTML='<div class="calling-status-wrap card black white-text"> <div class="user-image"> <img src="'+data.image+'" class="caller-image circle" alt=""> </div> <div class="user-name">'+data.name+'</div> <div class="user-calling-status">Calling...</div> <div class="calling-action"> <div class="call-accept"><i class="material-icons green darken-2 white-text audio-icon">call</i></div> <div class="call-reject"><i class="material-icons red darken-3 white-text close-icon">close</i></div> </div> </div>';
        
            var call_accept=document.querySelector('.call-accept');
            var call_reject=document.querySelector('.call-reject');

            call_accept.addEventListener("click",function(){
                recordButton.disabled=false;
                offerProcess(data.offer,data.name);
                call_status.innerHTML='<div class="call-status-wrap white-text"> <div class="calling-wrap"> <div class="calling-hang-action"> <div class="videocam-on"> <i class=material-icons teal darken-2 white-text video-toggle">videocam</i> </div> <div class="audio-on"> <i class="material-icons teal darken-2 white-text audio-toggle">mic</i> </div> <div class="call-cancel"> <i class="call-cancel-icon material-icons red darker-3 white-text">call</i> </div> </div> </div> </div>';
                acceptCall(data.name);


               var video_toggle=document.querySelector(".videocam-on");
               var audio_toggle=document.querySelector(".audio-on");

                video_toggle.onclick=function(){
                    stream.getVideoTracks()[0].enabled=!(stream.getVideoTracks()[0].enabled);
                    
                    var video_toggle_class=document.querySelector(".video-toggle");
                    if(video_toggle_class.innerText=='videocam'){
                        video_toggle_class.innerText ='videocam_off';

                    }
                    else
                    {
                        video_toggle_class.innerText ='videocam';

                    }
                
                }
                audio_toggle.onclick=function(){
                    stream.getAudioTracks()[0].enabled=!(stream.getAudioTracks()[0].enabled);
                    
                    var audio_toggle_class=document.querySelector(".audio-toggle");
                    if(audio_toggle_class.innerText=='mic'){
                        audio_toggle_class.innerText ='mic_off';

                    }
                    else
                    {
                        audio_toggle_class.innerText ='mic';

                    }
                
                }

            });
            call_reject.addEventListener("click",function(){
                call_status.innerHTML='';
                alert('CALL IS DICLINED!');
                call_btn.removeAttribute("disabled");

                rejectedCall(data.name);


            });
            break;
            case "answer":
                answerProcess(data.answer);
            break;
            case "candidate":
                candidateProcess(data.candidate);
            break;
            case "reject":
                rejectProcess();
            break;
            case "accept":
                acceptProcess();
            break;
            case "leave":
                leaveProcess();
            break; 
            default:
            break;   
            
    }

 }
connection.onerror=function(error){
    console.log(error)
}

var name;
var connectedUser;
var myConn;
var local_video = document.querySelector('#local-video');
var remote_video = document.querySelector('#remote-video');

var call_to_username_input = document.querySelector('#username-input');
var call_btn = document.querySelector('#call-btn');
var call_status=document.querySelector('.call-hang-status');


navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

call_btn.addEventListener("click",function(){
    var call_to_username = call_to_username_input.value;
    if(call_to_username.length>0){
        connectedUser = call_to_username.toLowerCase();
        
        if(username==connectedUser){
            alert("YOU CAN'T CALL TO YOURSELF!")
        }
        else{
            call_status.innerHTML='<div class="calling-status-wrap card black white-text"> <div class="user-image"> <img src="/images/download.jpg" class="caller-image circle" alt=""> </div> <div class="user-name">Unknown</div> <div class="user-calling-status">Calling...</div> <div class="calling-action">  <div class="call-reject"><i class="material-icons red darken-3 white-text close-icon">close</i></div> </div> </div>';
          
            setUserProfile(connectedUser);

            var call_reject=document.querySelector('.call-reject');

            call_reject.addEventListener("click",function(){
                call_status.innerHTML='';
                alert('CALL IS DICLINED!');
                call_btn.removeAttribute("disabled");

                rejectedCall(connectedUser);


            });
          
            call_btn.setAttribute("disabled","disabled");
            myConn.createOffer(function(offer){
                send({
                    type:"offer",
                    offer: offer,
                    image:userImage
                });
                myConn.setLocalDescription(offer);
    
            
            },function(error){
                alert("offer has not created!"); 
            });
        }
    }
    else{
        alert("Enter Username!");
    }
});


setTimeout(function(){
    if(connection.readyState==1){
        if(username!=null){
            name=username;
            console.log("Username is :- "+name);
            send({
                type:"online",
                name:name
            });
    
        }
    }
    else{
        console.log("Something went wrong!");
    }
},3000);

function send (message){
    if(connectedUser){
        
        message.name=connectedUser;
    }
    connection.send(JSON.stringify(message));
}

function onlineProcess(success){
    if(success){
        navigator.getUserMedia(
            {
                audio:true,
                video:true,
            },
            function(myStream) {
                stream = myStream;
                local_video.srcObject = stream;
                
                var configuration={
                    "iceServers":[
                        {"url":"stun:stun2.l.google.com:19302"}
                    ]
                }
              myConn= new  webkitRTCPeerConnection(configuration,{
                optional:[{
                    RtpDataChannels: true
                }]
               });
               myConn.addStream(stream);

               myConn.onaddstream=function(e){
                remote_video.srcObject=e.stream;

                call_status.innerHTML='<div class="call-status-wrap white-text"> <div class="calling-wrap"> <div class="calling-hang-action"> <div class="videocam-on"> <i class="material-icons teal darken-2 white-text video-toggle">videocam</i> </div> <div class="audio-on"> <i class="material-icons teal darken-2 white-text audio-toggle">mic</i> </div> <div class="call-cancel"> <i class="call-cancel-icon material-icons red darker-3 white-text">call</i> </div> </div> </div> </div>';


                var video_toggle=document.querySelector(".videocam-on");
                var audio_toggle=document.querySelector(".audio-on");
 
                 video_toggle.onclick=function(){
                     stream.getVideoTracks()[0].enabled=!(stream.getVideoTracks()[0].enabled);
                     
                     var video_toggle_class=document.querySelector(".video-toggle");
                     if(video_toggle_class.innerText=='videocam'){
                         video_toggle_class.innerText ='videocam_off';
 
                     }
                     else
                     {
                         video_toggle_class.innerText ='videocam';
 
                     }
                 
                 }
                 audio_toggle.onclick=function(){
                     stream.getAudioTracks()[0].enabled=!(stream.getAudioTracks()[0].enabled);
                     
                     var audio_toggle_class=document.querySelector(".audio-toggle");
                     if(audio_toggle_class.innerText=='mic'){
                         audio_toggle_class.innerText ='mic_off';
 
                     }
                     else
                     {
                         audio_toggle_class.innerText ='mic';
 
                     }
                 
                 }

                 hangUp();

               }

               myConn.onicecandidate=function(event){
                if(event.candidate){
                    send({
                        type:"candidate",
                        candidate: event.candidate
                    })

                }
               }

            },
            function(error) {
                alert("You can't access Media");    
            }
        );
    }
    else{
        alert("Something went wrong");
    }
}

function offerProcess(offer,name)
{
    connectedUser = name;
    console.log(connectedUser);
    myConn.setRemoteDescription(new RTCSessionDescription(offer));
 //create answer to an offer or first user.


    myConn.createAnswer(function(answer){
        myConn.setLocalDescription(answer);
        send({
            type:"answer",
            answer:answer
        });
    
    } ,function(error)
     {
    alert("Answer has not created");
     });
}

    function answerProcess(answer){
       myConn.setRemoteDescription(new RTCSessionDescription(answer));
    };


    function candidateProcess(candidate){
        myConn. addIceCandidate(new RTCIceCandidate(candidate)); 
    }


    function setUserProfile(name)
    {
        var xhtr=new XMLHttpRequest();
        xhtr.open("GET","/get-user-profile?name="+name,true);
        xhtr.send();

        xhtr.onreadystatechange=function(){
            if(this.readyState==4 && this.status == 200){
                var obj=JSON.parse(this.responseText);
                if(obj.success){
                    var data=obj.data;
                    var caller_image=document.querySelector('.caller-image');
                    var user_name=document.querySelector('.user-name');

                    caller_image.setAttribute('src',data.image);
                    user_name.innerHTML=data.name;

                }
            }
        };
    }

   function rejectedCall(rejected_user){
    send({
        type:"reject",
        name:rejected_user
    });
   }

   function rejectProcess(){

    call_status.innerHTML='';
    call_btn.removeAttribute("disabled");
   }

   function acceptCall(call_name){
    send({
        type:"accept",
        name:call_name
    });
   }


   function acceptProcess(){
    call_status.innerHTML='';
    recordButton.disabled=false;
   }

   function hangUp(){
    var call_cancel=document.querySelector(".call-cancel");
    call_cancel.addEventListener("click",function(){

        send({
            type:"leave"

        });

        leaveProcess()

    });
   }

   function leaveProcess(){
    call_btn.removeAttribute("disabled");
    call_status.innerHTML='';
    remote_video.src=null;
    myConn.close();
    myConn.onicecandidate=null;
    myConn.onaddstream=null;
    connectedUser=null;

   }