const accountSid = 'AC19899eb442103f91e2ce771fcdc67f22'; 
const authToken = '1fd73a9e66cdbe51b5708fb0079882fe'; 
const client = require('twilio')(accountSid, authToken); 
 
function Twilio (webhook_url) {
client.messages 
      .create({ 
         body: 'monitR Alert Test', 
         from: '+14072501797',       
         to: '+15614141909'
       }) 
      .then(webhook_url =>  console.log(webhook_url)) 
      .done();
    }
module.exports = Twilio
