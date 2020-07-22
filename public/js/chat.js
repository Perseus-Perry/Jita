var name = getCookie('name')
var id = getCookie('id')
var sk;
var mutedUsers=  [];
var toConnect = true;

if(name === 'undefined') {
  window.location.href = "https://jita.chat/auth";
  toConnect=false;
}

var startTime;

var forbiddenTags = ['img', 'div', 'span', 'script'];
var pingsSent = 0;
var sum = 0;

$('.editable').each(function() {
  this.contentEditable = true;
});

if(toConnect){
$(function() {
  var socket = io({
    'reconnection': true,
    'reconnectionDelay': 1000,
    'reconnectionAttempts': 25
  });

  socket.on('connect', function() {
    socket.emit('newUserConnected', name, id);
      sk = socket;
      $('.connectionStatus').text("Connected");
  })

  socket.on('disconnect',function(){
    $('.connectionStatus').text("Disconnected. Attempting To Reconnect...");

  })


  socket.on('redirect',function(url){
      window.location.href=url;
  })


  $('form').submit(function(e) {
    e.preventDefault(); // prevents page reloading
    //remove forbiddenInputs

    removeTags();
    //$('#m').html().replace(/\n/g, "<br>");
    if($('#m').html() == '') {
      return;
    }
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
    socket.emit('add chat message', $('#m').html(), name, id);
    $('#m').html('');

    return false;
  });
  socket.on('chat message', function(msg, name, id, socketID) {
    if(socketID == socket.id) {
      return;
    }
    if(mutedUsers.includes(unescape(name))){
      return;
    }
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


  function sendPing() {
    startTime = Date.now();
    socket.emit('sendping');
    pingsSent += 1;
  }
  setInterval(sendPing, 1000); //time is in ms

  socket.on('sendpong', function() {
    var time = Date.now();
    var latency = (time - startTime) / 2;
    sum += latency;
    if(pingsSent % 5 == 0) {
      var avg = sum / 5;
      updatePing(avg);
      sum = 0;
    }
  })


  function updatePing(ping) {
    $('.ping').html('Ping: ' + Math.trunc(ping) + " ms");
  }


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
  })
});
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if(parts.length === 2) return parts.pop().split(';').shift();
}

$('#message').keypress(function(event) {

  if(event.keyCode == 13 && !event.shiftKey) {
    event.preventDefault();
    $('#message').submit();
    event.preventDefault();

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

  // insert text manually
  $('#m').html(text);
});

function generateDiv(senderName, senderID, msg) {
  src = '';
  if(senderID == 'admin') {
    src = 'https://lh3.googleusercontent.com/proxy/DpKZ79F1J0xHlEdCyxvZSKsfS6bu7pEjWAX9LexWbqiVfWmyL9eONcNtijcVGMcvBWtQGqG1u7BoBA5o8j0E_q4aFhK2i2IYRfdi4ZRRy-aVr_b1E8IPRUVhRKlB3-kk5t86XHSKni3eMf0K7CY';
  } else {
    src = 'https://images.evetech.net/characters/' + senderID + '/portrait';
  }
  report = {nameToReport:unescape(senderName),IDtoReport:senderID,message:msg};
  var div = '<div class="msg"><div><img class="potrait" src="' + src + '" /></div><div class="msgText"><p  style="white-space: pre-wrap"><a href="#" ondrag="onDrag(event)" class="name">' + unescape(senderName) + "</a><span class='report' onclick='reportUser(report)' title='Report Message'> !</span><span class='report' onclick='muteUser(report)' title='Mute Sender'> X</span> > <span class='normalText'>" + msg + '</span></p></div></div>';
  return div;
}


function generateMemberDiv(name, id, socketID) {
  src = 'https://images.evetech.net/characters/' + id + '/portrait';
  var div = '<div class="member"><a href="#" ondrag="onDrag(event)"><div><img class="potrait" ondragstart="return false;" src="' + src + '" /></div><div class="memberText name"><p>' + unescape(name) + '</p></a><p style="visibility:hidden;position:absolute;">' + socketID + '</p></div></a><hr></div>';
  return div;
}

function onDrag(ev) {
  ev.dataTransfer.setData("text", 'lol');
}

function removeTags() {
  var message = $('#m');
  forbiddenTags.forEach((tag) => {
    message.find(tag).each(function(index) {
      var text = $(this).text(); //get span content
      $(this).replaceWith(text); //replace all span with just content
    });
  });


}

function drop(event) {
  removeTags();
}

function reportUser(report){
  if(unescape(name) === report.nameToReport){
    alert("You cant report yourself");
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
    alert("You cant mute yourself");
    return;
  }
  if(confirm('Mute '+report.nameToReport+" ?"))
  {
    mutedUsers.push(report.nameToReport);
    alert('User Muted');
  }
}
