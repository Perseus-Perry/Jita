var name = getCookie('name')
var id = getCookie('id')

$('.editable').each(function(){
    this.contentEditable = true;
});

$(function () {
 var socket = io();
 socket.emit('newUserConnected',name,id);




 $('form').submit(function(e){
   e.preventDefault(); // prevents page reloading
   socket.emit('chat message', $('#m').html() , name , id );
   console.log($('#m').html()) ;
   $('#m').html('');
   return false;
 });
 socket.on('chat message', function(msg,name,id){
   var toAdd = generateDiv(name,id,msg);
   $('.chatBox').append(toAdd);
 });
 socket.on('onlineCount',function(onlineCount){
   $('.onlineCount').text(onlineCount);
 });
 socket.on('updateMemberList',function(userList){
   $('.memberList').empty();
    userList.forEach((user) => {
      var div = generateMemberDiv(user.name,user.id);
      $('.memberList').append(div);
    });
  });
 socket.on('userDisconnected',function(name){
   $('p:contains('+unescape(name)+')').parents().eq(1).remove();
 })
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
  var div = '<div class="msg"><div><img class="potrait" src="'+src+'" /></div><div class="msgText"><p><a href="Contrum Inkunen" class="name">'+ unescape(name) + "</a>  > <span class='normalText'>" + msg + '</span></p></div></div>';
  return div;
}


function generateMemberDiv(name,id){
  src = 'https://images.evetech.net/characters/'+id+'/portrait';
  var div = '<div class="member"><div><img class="potrait" src="'+src+'" /></div><div class="memberText"><p>'+unescape(name)+'</p></div><hr></div>';
  return div;
}

function drop(event){
  //get last child
}
