var name = getCookie('name')
var id = getCookie('id')



$(function () {
 var socket = io();
 socket.emit('newUserConnected',name,id);
 $('form').submit(function(e){
   e.preventDefault(); // prevents page reloading
   socket.emit('chat message', $('#m').val() , name , id );
   $('#m').val('');
   return false;
 });
 socket.on('chat message', function(msg,name,id){
   var toAdd = generateDiv(name,id,msg);
   $('.chatBox').append(toAdd);
 });
 socket.on('onlineCount',function(onlineCount){
   console.log(onlineCount);
   $('.onlineCount').text(onlineCount);
 });
 socket.on('addMember',function(name,id){
    var div = generateMemberDiv(name,id);
    $('.memberList').append(div);
 });
});

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

$('#message').keypress(function(event) {

    if (event.keyCode == 13 || event.which == 13) {
      event.preventDefault();
      $('#message').submit();
      event.preventDefault();

    }
});


function generateDiv(name,id , msg){
  src = 'https://images.evetech.net/characters/'+id+'/portrait';
  var div = '<div class="msg"><div><img class="potrait" src="'+src+'" /></div><div class="msgText"><p>'+ unescape(name) + " > <span class='normalText'>" + msg + '</span></p></div></div>';
  return div;
}


function generateMemberDiv(name,id){
  src = 'https://images.evetech.net/characters/'+id+'/portrait';
  var div = '<div class="member"><div><img class="potrait" src="'+src+'" /></div><div class="memberText"><p>'+unescape(name)+'</p></div><hr></div>';
  return div;
}
