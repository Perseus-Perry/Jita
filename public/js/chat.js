name = getCookie('name')
id = getCookie('id')

$(function () {
 var socket = io();

 $('form').submit(function(e){
   e.preventDefault(); // prevents page reloading
   socket.emit('chat message', $('#m').val() , name );
   $('#m').val('');
   return false;
 });
 socket.on('chat message', function(msg,name){
   $('#messages').append($('<li>').text(unescape(name)+":"+msg));
 });
});

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}
