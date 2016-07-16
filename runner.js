/**
	Simple file based EDI style message exchange using EDIchain
	
	Will use the following folder structure:
	
	out\    = Place EDI Messages as text files in here (required Recipient in UNB segment)
	sent\   = Messages sent and documented in blockchain (filename will be Transaction ID_IPFS-Hash
	in\edi  = Received EDI Messages (text files)
	in\meta = Meta files corresponding to EDI Messages.
	
*/

require("./bootstrap.js");

var forge = require('node-forge');
var fs = require("fs");

var sendSempahore=false;

sendFile = function(fname,recipient) {
	if(!sendSempahore) {
		sendSempahore=true;
		var data = fs.readFileSync("out/"+fname).toString();
		var msg = {
				filename:fname,
				data:forge.util.encode64(data)
		
		};
		edichain.sendData(recipient,JSON.stringify(msg),function(tx,hash) {				
					if(fs.existsSync("out/"+fname)) {
						fs.renameSync("out/"+fname,"sent/"+tx+"_"+hash+".edi");		
					}
					sendSempahore=false;
		});
	}
}

checkOutbox = function() {
	if(!fs.existsSync("out")) fs.mkdirSync("out");
	if(!fs.existsSync("sent")) fs.mkdirSync("sent");
	var files = fs.readdirSync("out");
	if(files.length==0) return;
	for(var i=0;((i<10)&&(i<files.length));i++) {
		if((files[i].indexOf(".")>2)&&(!sendSempahore)) {
			var data = fs.readFileSync("out/"+files[i]).toString();
		// try to determine "to" from data
		
			var recipient="unknown";
			if(files[i].indexOf(".edi")>0) {
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
				recipient=files[i].substring(0,files[i].indexOf("."));					
			}
			if(!sendSempahore) {
			sendFile(files[i],recipient);
			console.log("Outbox:",recipient);
			}		
		}
	}
}

edichain.storeMessage=function(message) {
	// Need to overwrite in case something goes wrong with message decryption.
	
	if(!message.data) {} else
	if(message.data.length>0) {
		var m = {};
		try {
			m = JSON.parse(message.data);	
			console.log(m);			
		} catch(e) {}
		if(m.data) {
			fs.writeFileSync("in/edi/"+message.addr+"_"+m.data.filename,forge.util.decode64(m.data));
		} else 
		{
			fs.writeFileSync("in/edi/"+message.addr+".edi",message.data);	
		}
	}
	  var m=message;
	 // m.data="";	  
	  fs.writeFileSync("in/meta/"+message.addr+".json",JSON.stringify(m));				
	//}	
} 

edichain.storeHash = function(hash,data) {
	if(!fs.existsSync("hash")) fs.mkdirSync("hash");
	fs.writeFileSync("hash/"+hash+".json",data);
}

var old_inbox_length=0;
checkInbox = function() {
 if(!fs.existsSync("in")) fs.mkdirSync("in");
 if(!fs.existsSync("in/meta")) fs.mkdirSync("in/meta");
 if(!fs.existsSync("in/edi")) fs.mkdirSync("in/edi");
 while(edichain.config.lastMsgCnt<edichain.updateInbox()) {
	console.log("Recieving more messages...",edichain.config.lastMsgCnt);
	
 }
}
var interval_semaphore=false;

var interval = function() {
	if(interval_semaphore) return;
	interval_semaphore=true;
		try { checkOutbox(); } catch(e) {console.log(e);}
		try { checkInbox(); } catch(e) {console.log(e);}
	interval_semaphore=false;
}
  
var cb = function() {
		//edichain.decryptMessageHash('QmUSgwepqBUKJFt2KHmLVFrPo5Ba4HDRK9Le7wRh7MY1Ne',new edichain.message(),this);
		edichain.config.lastMsgCnt=3;
		checkOutbox(); 
		try { checkInbox(); } catch(e) {console.log(e);}
		setInterval(function() {interval();},20000);
}

var echain = new edichain.bootstrap({bootstrap_callback:cb,ipfsPeer:'/ip4/52.28.178.76/tcp/4001'});

