/*
  EDIserver 
  Provides a JSON RPC service to interact with edichain 
*/
require("./edichain.js");
var forge = require('node-forge');
var rpc = require('json-rpc2');

var server = rpc.Server.$create({
    'websocket': true, // is true by default
    'headers': { // allow custom headers is empty by default
        'Access-Control-Allow-Origin': '*'
    }
});


var rpcServer = function() {
	function receivedMessageCount(args, opt, callback) {
	  var error, result;  	   
	  result=edichain.getReceivedMessageCount();	  
	  callback(error, result);
	};
	
	function sentMessageCount(args, opt, callback) {
		var error, result; 
		result=edichain.getSentMessageCount();
		callback(error, result);
	}
	function chainAccount(args, opt, callback) {
	  var error, result;  	   
	  result=edichain.config.fromAddress;	  
	  callback(error, result);
	};
	
	function getBalance(args, opt, callback) {
	  var error, result;  	   
	  result=edichain.getBalance();	  
	  callback(error, result);
	};
	function getMessageByNumber(args, opt, callback) {
	  var error, result;  	   
	  callback(error,edichain.getMessageByNumber(args[0]));
	};	
	function getSentByNumber(args, opt, callback) {
	  var error, result;  	   
	  callback(error,edichain.getSentByNumber(args[0]));
	};		
	function decryptMessageByNumber(para, opt, callback) {
	  var error, result;  	   
	  result=edichain.decryptMessageByNumber(para[0]);
	  callback(error,result);  
	};	
	function decryptSentByNumber(para, opt, callback) {
	  var error, result;  	   
	  result=edichain.decryptSentByNumber(para[0]);
	  callback(error,result);  
	};	
	function ackMessageByAddr(para,opt,callback) {
		var error, result;  	
		try {
			edichain.ackMessageByAddr(para[0],para[1],function() {
				callback(error,result);			
			});
		} catch(e) {error=e;callback(error,result);}
	
	}
	
	function getAck(para,opt,callback) {
		var error, result;	
		result=edichain.getAck(para[0],para[1]);
		console.log(result);
		callback(error,result);	
	}
	
	function getTxLog(para,opt,callback) {
		var error, result;
		edichain.getTxLog(function(r) {		
			callback(error,r);	
		});
	}
 
	function sendEdi(para, opt, callback) {
	  var error, result;  	   
	 var recipient="unknown";		
		var data=para[0];
		if(para.length==1) {				
				// determine recipient from EDIFACT
				var segSplit=data.substr(4,1);
				var unb_start=data.indexOf("UNB"+segSplit);
				for(var j=0;j<3;j++) {
					unb_start=data.indexOf(segSplit,unb_start+1);
				}
				var recipient_end=data.indexOf(segSplit,unb_start+1);
				recipient=data.substr(unb_start+1,recipient_end-unb_start-1);	
			} else {
				// determine recipient from filename
				recipient=para[1];					
			}
		var msg = {
			filename:'adhoc',
			data:forge.util.encode64(data)		
		}
		edichain.sendData(recipient,JSON.stringify(msg),function(tx,hash) {				
					callback(error,result);  			
		})
	};	
	server.expose('edichain',{
		'sendEdi':sendEdi,
		'receivedMessageCount':receivedMessageCount,		
		'sentMessageCount':sentMessageCount,
		'decryptMessageByNumber':decryptMessageByNumber,
		'decryptSentByNumber':decryptSentByNumber,
		'getMessageByNumber':getMessageByNumber,
		'getSentByNumber':getSentByNumber,
		'chainAccount':chainAccount,
		'ackMessageByAddr':ackMessageByAddr,
		'getTxLog':getTxLog,
		'getAck':getAck,
		'getBalance':getBalance
	});	
		
	server.listen(8000, 'localhost');
	var c = edichain.getReceivedMessageCount();
	console.log("Preload some cache data..");
	for(var i=c-1;((i>=0)&&(i>c-3));i--) {
		edichain.getMessageByNumber(i);
	}
	console.log("RPC Server started on http://localhost:8000");
	console.log("Web UI might be available on http://localhost:8080/ipns/QmSPtbb8VUVs1k5spJfDhrUc1mzdsC5FKGZpx1FSfhjmze/index.html ");
	


}
var echain = new edichain.bootstrap({bootstrap_callback:rpcServer,pfsPeer:'/ip4/62.75.241.218/tcp/4001/ipfs/QmSPtbb8VUVs1k5spJfDhrUc1mzdsC5FKGZpx1FSfhjmze',path:"../../"});
