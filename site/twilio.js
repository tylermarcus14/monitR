const accountSid = 'AC19899eb442103f91e2ce771fcdc67f22'; 
const authToken = '1fd73a9e66cdbe51b5708fb0079882fe'; 
const client = require('twilio')(accountSid, authToken); 
 
function Twilio () {
client.messages 
      .create({ 
         body: 'Test SMS Alert', 
         from: '+14072501797',       
         to: '+15614141909' 
       }) 
      .then(message => console.log(message.sid)) 
      .done();
    }
module.exports = Twilio