const express = require("express");
const ejs = require("ejs");
const app = express();
var esso = require('eve-sso-simple');
var http = require('http').createServer(app);
var io = require('socket.io')(http,{pingInterval:2500,pingTimeout:5000});
var cookieParser = require('cookie-parser');


app.use(cookieParser());
app.use(express.static("public"));

clientID = '887619d6fc0640ef8b503a7356e67d7a'
secretKey = 'DwaEsXggfd6qaGdumzKc25KeMMjkLeM3cCP0hboH'

var startTime;
usersConnected = 0;
userList = [];

setInterval(sendOnlineCount, 1000); //time is in ms
setInterval(sendPing, 10000); //time is in ms

app.get('/',function(req,res){
  if(req.query.auth==='true'){

    res.render('index.ejs',{authed:true,usersCount:userList.length})
  }
  else{
        res.render('index.ejs',{authed:false,usersCount:userList.length})
  }
})

app.get('/auth',function(req,res){
  esso.login(
        {
            client_id: clientID,
            client_secret: secretKey,
            redirect_uri: 'http://www.jita.chat/callback/',
            scope: ''
        }, res);
})

app.get('/callback',function(req,res){
  esso.getTokens({
          client_id: clientID,
          client_secret: secretKey,
          }, req, res,
          (accessToken, charToken) => {
            res.cookie('name',charToken.CharacterName)
            res.cookie('id',charToken.CharacterID)
            res.redirect('/?auth=true')
          }
      );


})

app.get('/room',function(req,res){
  res.render('room.ejs')
})


io.on('connection', (socket) => {

});



io.on('connection', (socket) => {

  socket.on('add chat message', (msg,name,id) => {
    io.emit('chat message', msg , name , id , socket.id);
  });

  socket.on('newUserConnected',(name,id) => {
    user = {socketID:socket.id,name:name,id:id};
    userList.push(user);
    userList = userList.sort(function(a,b) { return a.name.localeCompare(b.name)});
    io.emit('updateMemberList',userList);
  });
  socket.on('disconnect', () => {
    removeElement(socket.id);
    io.emit('userDisconnected',socket.id);
  });
  socket.on('pong',function(){
    var date = new Date();
    var time = date.getMilliseconds();
    var latency = time-startTime;
    socket.emit('updatePing',latency);
  })

});
  function sendOnlineCount() {
    io.emit('onlineCount',userList.length);

  }

  function sendPing() {
    var date = new Date();
    startTime = date.getMilliseconds();
    io.emit('ping',userList.length);
  }



  function removeElement(socketID) {
    index = -1
    len = userList.length;
    for(var i=0;i<len;i++){
      if(userList[i].socketID == socketID){
        index = i
      }
    }
    if (index > -1) {
        userList.splice(index, 1);
    }
}


http.listen(process.env.PORT || 8080, function () {
    console.log("Server started");
});
