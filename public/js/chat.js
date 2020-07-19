var name = getCookie('name')
var id = getCookie('id')
var startTime;

var forbiddenTags = [];

$('.editable').each(function(){
    this.contentEditable = true;
});

$(function () {
 var socket = io();
 socket.emit('newUserConnected',name,id);

 $('form').submit(function(e){
   e.preventDefault(); // prevents page reloading
   //remove forbiddenInputs

     $('#m').html(replaceAll($('#m').html()));
     if ($('#m').html() == ''){
       return;
     }
     var scroll = false;
     var toAdd = generateDiv(name,id, $('#m').html());
     var chatbox = document.getElementById('chatBox');
     if (chatbox.scrollTop >= (chatbox.scrollHeight - chatbox.offsetHeight))
     {
       scroll = true;
     }
     $('.chatBox').append(toAdd);
     if(scroll){
       chatbox.scrollTop = chatbox.scrollHeight;
     }
   socket.emit('add chat message', $('#m').html() , name , id );
   $('#m').html('');

   return false;
 });
 socket.on('chat message', function(msg,name,id,socketID){
   if(socketID == socket.id){
     return;
   }
   var scroll = false;
   var toAdd = generateDiv(name,id,msg);
   var chatbox = document.getElementById('chatBox');
   if (chatbox.scrollTop >= (chatbox.scrollHeight - chatbox.offsetHeight))
   {
     scroll = true;
   }
   $('.chatBox').append(toAdd);
   if(scroll){
     chatbox.scrollTop = chatbox.scrollHeight;
   }


 });

 socket.on('ping',function(){
   socket.emit('pong');
 })

 socket.on('updatePing',function(latency){
    $('.ping').html(latency+" ms");
 })

 socket.on('onlineCount',function(onlineCount){
   $('.onlineCount').text(onlineCount);
 });
 socket.on('updateMemberList',function(userList){
   $('.memberList').empty();
    userList.forEach((user) => {
      var div = generateMemberDiv(user.name,user.id,user.socketID);
      $('.memberList').append(div);
    });
  });
 socket.on('userDisconnected',function(socketID){
   $('p:contains('+socketID+')').parents().eq(1).remove();
 })
});

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

$('#message').keypress(function(event) {

    if (event.keyCode == 13 && !event.shiftKey) {
      event.preventDefault();
      $('#message').submit();
      event.preventDefault();

    }
});


function generateDiv(name,id , msg){
  src = 'https://images.evetech.net/characters/'+id+'/portrait';
  var div = '<div class="msg"><div><img class="potrait" src="'+src+'" /></div><div class="msgText"><p><a href="#" ondrag="onDrag(event)" class="name">'+ unescape(name) + "</a>  > <span class='normalText'>" + msg + '</span></p></div></div>';
  return div;
}


function generateMemberDiv(name,id,socketID){
  src = 'https://images.evetech.net/characters/'+id+'/portrait';
  var div = '<div class="member"><a href="#" ondrag="onDrag(event)"><div><img class="potrait" ondragstart="return false;" src="'+src+'" /></div><div class="memberText name"><p>'+unescape(name)+'</p></a><p style="visibility:hidden;position:absolute;">'+socketID+'</p></div></a><hr></div>';
  return div;
}

function onDrag(ev){
  ev.dataTransfer.setData("text", 'lol');
}

function replaceAll(str) {
  var anchorTagsRemoved = str.replace(/<img.*>.*?<\/img>/ig,'');
  anchorTagsRemoved = str.replace(/<div.*>.*?<\/div>/ig,'');
  return anchorTagsRemoved;
}
