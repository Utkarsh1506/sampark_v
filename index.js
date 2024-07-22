require('dotenv').config(); //port 5000

const express = require('express');
const app = express();
const path = require('path');

var mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/video-call-app');

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

app.listen(5000, ()=>{
    console.log('Server is running');
});


const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

app.set('view engine','ejs');
app.set('views','./views');

app.use(express.static('public'));

const userRoute = require('./routes/userRoute');
app.use('/',userRoute);

var websocketServ = require('ws').Server;

var wss= new websocketServ({
    port:8000
});
var users={};

wss.on("connection",function(conn){
console.log("User Connected");

conn.on("message",function(message){

    var data;

    try{

        data= JSON.parse(message);
    }catch(e){
        console.log(e);
    }
    switch(data.type){
        case "online":
            users[data.name]=conn;
            conn.name=data.name;

           sendToOtherUser(conn,{
           type:"online",
         success:true 

        })
    break;
    case "offer":
        var connect=users[data.name];
        if(connect !=null){
            conn.otherUser=data.name;
            console.log(data.offer);

            sendToOtherUser(connect,{
                type:"offer",
                offer:data.offer,
                name:conn.name,
                image: data.image
            });
            
        }
        else{
            sendToOtherUser(conn,{
                type:"not_available",
                name:data.name,
            });
        }
        break;
        
            case "answer":
            var connect = users[data.name];
            if(connect!=null){
                conn.otherUser=data.name;
                sendToOtherUser(connect,{
                    type:"answer",
                    answer:data.answer
                });
            }
            break;

            case "candidate":
                var connect=users[data.name];
                if(connect!=null){
                    sendToOtherUser(connect,{
                        type:"candidate",
                        candidate:data.candidate
                    });
                }
                break;

                case "reject":
                var connect=users[data.name];
                if(connect!=null){
                    sendToOtherUser(connect,{
                        type:"reject",
                        name:conn.name
                    });
                }
                break;

                case "accept":
                var connect=users[data.name];
                if(connect!=null){
                    sendToOtherUser(connect,{
                        type:"accept",
                        name:conn.name
                    });
                }
                break;

                case "leave":
                var connect=users[data.name];
                connect.otherUser=null;
                if(connect!=null){
                    sendToOtherUser(connect,{
                        type:"leave",
                    });
                }
                break;

                default:
                    sendToOtherUser(connect,{
                        type:"error",
                        message:data.type+"not found!"
                    });
                break;
                
    }

});

  conn.on("close",function(){
    console.log("Connection closed");
  })
});

function sendToOtherUser(connection,message){
    connection.send(JSON.stringify(message));
}