if(window.location === "https://jita.chat/?auth=true"){
  if( getCookie('name') === 'undefined'){
      window.location.href="https://jita.chat/auth";
  }
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}
