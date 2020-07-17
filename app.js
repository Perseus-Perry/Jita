const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const https = require('https')
const app = express();
var esso = require('eve-sso-simple');
var http = require('http').createServer(app);

var io = require('socket.io')(http);


app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));

clientID = '887619d6fc0640ef8b503a7356e67d7a'
secretKey = 'DwaEsXggfd6qaGdumzKc25KeMMjkLeM3cCP0hboH'
b64 = 'ODg3NjE5ZDZmYzA2NDBlZjhiNTAzYTczNTZlNjdkN2E6RHdhRXNYZ2dmZDZxYUdkdW16S2MyNUtlTU1qa0xlTTNjQ1AwaGJvSA=='


usersConnected = 0

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
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });
  socket.on('disconnect', () => {
    usersConnected-=1;
    console.log(socket.id + ' disconnected')
    });
});


http.listen(process.env.PORT || 80, function () {
    console.log("Server started");
});
