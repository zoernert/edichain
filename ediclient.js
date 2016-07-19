var rpc = require('node-json-rpc');

var options = {  
  port: 8000,  
  host: '127.0.0.1',  
  path: '/',  
  strict: false
};
 
var client = new rpc.Client(options);

client.call(
  {"jsonrpc": "2.0", "method": "receivedMessageCount", "params": [], "id": 0},
  function (err, res) {
    // Did it all work ? 
    if (err) { console.log(err); }
    else { console.log(res); }
  }
);

client.call(
  {"jsonrpc": "2.0", "method": "getMessageByNumber", "params": [10], "id": 0},
  function (err, res) {
    // Did it all work ? 
    if (err) { console.log(err); }
    else { console.log(res); }
  }
);

client.call(
  {"jsonrpc": "2.0", "method": "decryptMessageByNumber", "params": [10], "id": 0},
  function (err, res) {
    // Did it all work ? 
    if (err) { console.log(err); }
    else { console.log(res); }
  }
);

