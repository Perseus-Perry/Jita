var name = getCookie('name');
var id = getCookie('id');
var sk;
var mutedUsers=  [];
var toConnect = true;
var startTime = 0 , forbiddenTags = ['img', 'div', 'span', 'script','button'];
var pingsSent = 0;
var sum = 0;
var report;

//REDIRECT TO LOGIN IF COOKIES NOT SET
if(name === 'undefined') {
  window.location.href = "https://jita.chat/auth";
  toConnect=false;
}
$('#m').focus();
setInterval(sendPing, 1000); //time is in ms
setInterval(resetBody,500); //temp fix for overflow

if(toConnect){
  $(function() {

    var socket = io({'reconnection': true,'reconnectionDelay': 1000,'reconnectionAttempts': 25});

    socket.on('connect', function() {
      socket.emit('newUserConnected', name, id);
      sk = socket;
      $('.connectionStatus').text("Connected");
    });

    socket.on('disconnect',function(){
      $('.connectionStatus').text("Disconnected. Attempting To Reconnect...");
    });

    socket.on('redirect',function(url){
        window.location.href=url;
    });

    socket.on('chat message', function(msg, name, id, socketID) {
      if(socketID == socket.id) {
        return;
      }
      if(mutedUsers.includes(unescape(name))){
        return;
      }
      msg=$.trim(msg);
      var scroll = false;
      var toAdd = generateDiv(name, id, msg);
      var chatbox = document.getElementById('chatBox');
      if(chatbox.scrollTop >= (chatbox.scrollHeight - chatbox.offsetHeight)) {
        scroll = true;
      }
      $('.chatBox').append(toAdd);
      if(scroll) {
        chatbox.scrollTop = chatbox.scrollHeight;
      }
    });

    socket.on('sendpong', function() {
      var time = Date.now();
      var latency = (time - startTime) / 2;
      sum += latency;
      if(pingsSent % 5 == 0) {
        var avg = sum / 5;
        updatePing(avg);
        sum = 0;
      }
    });

    socket.on('onlineCount', function(onlineCount) {
      $('.onlineCount').text(onlineCount);
    });

    socket.on('updateMemberList', function(userList) {
      $('.memberList').empty();
      userList.forEach((user) => {
        var div = generateMemberDiv(user.name, user.id, user.socketID);
        $('.memberList').append(div);
      });
    });

    socket.on('userDisconnected', function(socketID) {
      $('p:contains(' + socketID + ')').parents().eq(1).remove();
    });

    socket.on('ban',function(socketID){
      console.log('ban');
      if(socket.id===socketID){
      window.location.href="https://jita.chat/banned";
      }
    });

  });
}


//CONTROL FLOW MODIFIERS
// ---------------------
// ---------------------

$('form').submit(function(e){

  e.preventDefault();
  removeTags();
  if($('#m').html() == '')
  {
    return;
  }
  $('#m').html($.trim($('#m').html()));
  var scroll = false;
  var toAdd = generateDiv(name,id, $('#m').html());
  var chatbox = document.getElementById('chatBox');

  if(chatbox.scrollTop >= (chatbox.scrollHeight - chatbox.offsetHeight)) {
    scroll = true;
  }

  $('.chatBox').append(toAdd);

  if(scroll) {
    chatbox.scrollTop = chatbox.scrollHeight;
  }

  sk.emit('add chat message', $('#m').html(), name, id);
  $('#m').html('');
  $('#m').focus();
  return false;
});


$('#message').keypress(function(event) {
  if(event.keyCode == 13 && !event.shiftKey) {
    event.preventDefault();
    $('#message').html($.trim($('#message').html()));
    $('#message').submit();
  }
});

document.getElementById('m').addEventListener("paste", function(e) {
  e.preventDefault();
  var text = '';
  if(e.clipboardData || e.originalEvent.clipboardData) {
    text = (e.originalEvent || e).clipboardData.getData('text/plain');
  } else if(window.clipboardData) {
    text = window.clipboardData.getData('Text');
  }
  removeTags();
  var newText = $('#m').html() +" "+ text;
  $('#m').html(newText);
});


// ---------------------
// ---------------------
//CONTROL FLOW MODIFIERS


// DIV GENERATORS
// ---------------------
// ---------------------

function generateDiv(senderName, senderID, msg) {
  src = 'https://images.evetech.net/characters/' + senderID + '/portrait';
  report = {nameToReport:unescape(senderName),IDtoReport:senderID,message:msg};
  var div = '<div class="msg"><div><img class="messagePotrait" src="' + src + '" /></div><div class="msgText"><p  style="white-space: pre-wrap"><a href="#" ondrag="onDrag(event)" class="name">' + unescape(senderName) + "</a><span class='report' onclick='reportUser(report)' title='Report Message'> !</span><span class='report' onclick='muteUser(report)' title='Mute Sender'> X</span>   >   <span class='normalText'>" + msg + '</span></p></div></div>';
  return div;
}


function generateMemberDiv(name, id, socketID) {
  src = 'https://images.evetech.net/characters/' + id + '/portrait';
  var div = '<div class="member"><a href="#" ondrag="onDrag(event)"><div><img class="potrait" ondragstart="return false;" src="' + src + '" /></div><div class="memberText name"><a href="#" ondrag="onDrag(event)"><p>' + unescape(name) + '</p></a><p style="visibility:hidden;position:absolute;">' + socketID + '</p></div></div>';
  return div;
}


// ---------------------
// ---------------------
// DIV GENERATORS


function resetBody(){
var body =   $('body');
body.scrollTop = body.scrollHeight;
}


function sendPing() {
  startTime = Date.now();
  sk.emit('sendping');
  pingsSent += 1;
}

function updatePing(ping) {
  $('.ping').html('Ping: ' + Math.trunc(ping) + " ms");
}

function drop(event) {
  removeTags();
}

function reportUser(report){
  if(unescape(name) === report.nameToReport){
    alert("You can not report yourself");
    return;
  }
  var confirmed = confirm("Report Message?");
  if(!confirmed){
    return;
  }
  else{
    console.log('reported');
    sk.emit('report',report.nameToReport,report.IDtoReport,unescape(name),id,report.message);
    alert("Message Reported");
  }
}

function muteUser(report){
  if(unescape(name) === report.nameToReport){
    alert("You can not mute yourself");
    return;
  }
  if(confirm('Mute '+report.nameToReport+" ?"))
  {
    mutedUsers.push(report.nameToReport);
    alert('User Muted');
  }
}

function removeTags() {
  var message = $('#m');
  forbiddenTags.forEach((tag) => {
    message.find(tag).each(function(index) {
      var text = $(this).text();
      $(this).replaceWith(text);
    });
  });
}


function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}
