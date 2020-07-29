
const express = require("express");
var favicon = require('serve-favicon');
var randomstring = require("randomstring");
const ejs = require("ejs");
const mongoose = require('mongoose')
const app = express();
var esso = require('eve-sso-simple');
var http = require('http').createServer(app);
var io = require('socket.io')(http, {
  pingInterval: 2500,
  pingTimeout: 5000
});
var cookieParser = require('cookie-parser');

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

app.use(cookieParser());
app.use(express.static("public"));
app.use('/favicon.ico', express.static('/img/favicon.ico'));
//app.use(favicon(__dirname + '/public/img/favicon.ico'));
var clientID = "887619d6fc0640ef8b503a7356e67d7a";
var secretKey = "DwaEsXggfd6qaGdumzKc25KeMMjkLeM3cCP0hboH";
var banDbUri = "mongodb+srv://admin:iH57rx3g6BUtVkng@cluster0.ixmb6.mongodb.net/Users?retryWrites=true/BannedUsers";
var reportDbUri = "mongodb+srv://admin:iH57rx3g6BUtVkng@cluster0.ixmb6.mongodb.net/Users?retryWrites=true/ReportedUsers";

var usersConnected = 0, userList = [] , messageList=[];

const bannedUsersDB = mongoose.createConnection(banDbUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const reportedUsersDB = mongoose.createConnection(banDbUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

var bannedUserSchema = mongoose.Schema({
      name: String,
      id : String
});

var reportedUserSchema = mongoose.Schema({
      _id:String,
      reportedName : String,
      reportedID : String,
      reporterName:String,
      reporterID:String,
      message:String
});

var BannedUser = bannedUsersDB.model("BannedUser", bannedUserSchema);
var ReportedUser = reportedUsersDB.model("ReportedUser", reportedUserSchema);

setInterval(sendOnlineCount, 1000); //time is in ms

app.get('/', function(req, res) {
  if(req.query.auth === 'true') {

    res.render('index.ejs', {
      authed: true,
      usersCount: userList.length
    });
  } else {
    res.render('index.ejs', {
      authed: false,
      usersCount: userList.length
    });
  }
});

app.get('/auth', function(req, res) {
  esso.login({
    client_id: clientID,
    client_secret: secretKey,
    redirect_uri: 'http://www.jita.chat/callback/',
    scope: ''
  }, res);
});

app.get('/callback', function(req, res) {
  esso.getTokens({
      client_id: clientID,
      client_secret: secretKey,
    }, req, res,
    (accessToken, charToken) => {
      res.cookie('name', charToken.CharacterName)
      res.cookie('id', charToken.CharacterID)
      res.redirect('/?auth=true')
    });
});

app.get('/room', function(req, res) {
  res.render('room.ejs');
});

app.get('/rules', function(req, res) {
  res.render('rules.ejs');
});

app.get('/banned',function(req,res){
    res.render('banned.ejs');
})

app.get('/admin-console',function(req,res){
  ReportedUser.find({},function(err,users){
    if(err){
      console.log(err);
      res.send('error');
    }
    else{
      res.render('admin.ejs',{reportList:users});

    }
  })
});


app.post('/removeReport',function(req,res){
    idToRemove = req.query.id;
    ReportedUser.deleteOne({_id:idToRemove},function(err){
      if(err){
        console.log(err);
      }
      res.redirect('/admin-console');
    });
});

app.post('/banUser',function(req,res){
    idToRemove = req.query.id;
    var user;
    ReportedUser.findOne({_id:idToRemove},function(err,doc){
      if(err){
        console.log(err);
      }
      else{
        user = doc;

      }
    });


    ReportedUser.deleteOne({_id:idToRemove},function(err){
      if(err){
        console.log(err);
        return;
      }
      userToBan = new BannedUser({
        name : user.reportedName,
        id : user.reportedID
      });
      //look for name in usersList and ban the correspoing socket id
      userList.forEach((user) => {
        if(unescape(user.name) === unescape(userToBan.name))
        {
          io.emit('ban',user.socketID);
        }
      });
      userToBan.save();
      res.redirect('/admin-console');
    });
});


http.listen(process.env.PORT || 8080, function() {
  console.log("Server started");
});

//SOCKET.IO EVENT HANDLERS
//
//
//
//



io.on('connection', (socket) => {



  socket.on('add chat message', (msg, name, id) => {
    var msgObj = {
      name : name,
      id : id,
      msg : msg
    };
    addToMessageHistory(msgObj);
    io.emit('chat message', msg, name, id, socket.id);
  });

  socket.on('newUserConnected', (name, id) => {
    banned = false;
    //check is user is banned
    BannedUser.findOne({'name': unescape(name)}, function(err, user) {
      if(err)
      {
        console.log(err);
      }
      else if(user != null)
      {
        socket.emit('redirect',"https://jita.chat/banned");
        banned = true;
      }
    });
    if(!banned){
    addElement(socket.id, name, id);
    io.emit('updateMemberList', userList);

    messageList.forEach((messageObj) => {
            socket.emit('chat message' , messageObj.msg , messageObj.name , messageObj.id , "0000");
    });
    }
    //send message history



  });


  socket.on('disconnect', () => {
    removeElement(socket.id);
    io.emit('userDisconnected', socket.id);
  });


  socket.on('sendping', function() {
    socket.emit('sendpong');
  })


  socket.on('report', function(reportedName,reportedID,reporterName,reporterID,message) {

    report = new ReportedUser({
      _id : randomstring.generate(6),
      reportedName:reportedName,
      reportedID:reportedID,
      reporterName:reporterName,
      reporterID:reporterID,
      message:message
    });

    report.save();
  });


});

//
//
//
//
//SOCKET.IO EVENT HANDLERS

//CUSTOM FUNCTIONS

function sendOnlineCount() {
  io.emit('onlineCount', userList.length);
}



function addElement(socketID, name, id) {
  userObject = {
    socketID: socketID,
    name: name,
    id: id
  };

  userList.forEach((user) => {
    if(user.id == userObject.id) {
      removeElement(user.socketID);
    }
  });

  userList.push(userObject);

  userList = userList.sort(function(a, b) {
    return a.name.localeCompare(b.name)
  });
}


function removeElement(socketID) {
  index = -1;
  len = userList.length;
  for(var i = 0; i < len; i++) {
    if(userList[i].socketID == socketID) {
      index = i;
    }
  }
  if(index > -1) {
    userList.splice(index, 1);
  }
}

function addToMessageHistory(messageObj){
  if(messageList.length < 10){
    messageList.push(messageObj);
  }
  else{
    for(var i = 0 ;i < messageList.length-1;i++){
      messageList[i] = messageList[i+1]
    }
    messageList[messageList.length-1] = messageObj;
  }
}
