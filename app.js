const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const https = require('https')
const app = express();
var esso = require('eve-sso-simple');
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var cookieParser = require('cookie-parser');



app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cookieParser());
app.use(express.static("public"));

clientID = '887619d6fc0640ef8b503a7356e67d7a'
secretKey = 'DwaEsXggfd6qaGdumzKc25KeMMjkLeM3cCP0hboH'

usersConnected = 0
  setInterval(doStuff, 1000); //time is in ms
app.get('/',function(req,res){
  if(req.query.auth==='true'){

    res.render('index.ejs',{authed:true,usersCount:usersConnected})
  }
  else{
        res.render('index.ejs',{authed:false,usersCount:usersConnected})
  }
})

app.get('/auth',function(req,res){
  esso.login(
        {
            client_id: clientID,
            client_secret: secretKey,
            redirect_uri: 'http://localhost/callback/',
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
  usersConnected+=1;
});



io.on('connection', (socket) => {

  socket.on('chat message', (msg,name,id) => {
    io.emit('chat message', msg , name ,id);
  });

  socket.on('newUserConnected',(name,id) => {
    io.emit('addMember',name,id);
  });
  socket.on('disconnect', () => {
    usersConnected-=1;
    //console.log(socket.id)
  });



});
  function doStuff() {
    io.emit('onlineCount',usersConnected);

  }


http.listen(process.env.PORT || 80, function () {
    console.log("Server started");
});
