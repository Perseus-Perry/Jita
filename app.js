const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const https = require('https')
const app = express();
var esso = require('eve-sso-simple');


app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));

clientID = '887619d6fc0640ef8b503a7356e67d7a'
secretKey = 'DwaEsXggfd6qaGdumzKc25KeMMjkLeM3cCP0hboH'
b64 = 'ODg3NjE5ZDZmYzA2NDBlZjhiNTAzYTczNTZlNjdkN2E6RHdhRXNYZ2dmZDZxYUdkdW16S2MyNUtlTU1qa0xlTTNjQ1AwaGJvSA=='


app.get('/',function(req,res){
  esso.login(
        {
            client_id: clientID,
            client_secret: secretKey,
            redirect_uri: 'http://localhost/callback',
            scope: ''
        }, res);
})

app.get('/callback',function(req,res){
  esso.getTokens({
          client_id: clientID,
          client_secret: secretKey,
          }, req, res,
          (accessToken, charToken) => {
              res.render('index.js',{charToken.CharacterName,charToken.CharacterID})
          }
      );


})

app.listen(process.env.PORT || 80, function () {
    console.log("Server started");
});
