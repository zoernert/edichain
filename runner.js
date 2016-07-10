/**
	Simple file based EDI style message exchange using EDIchain
	
	Will use the following folder structure:
	
	out\    = Place EDI Messages as text files in here (required Recipient in UNB segment)
	sent\   = Messages sent and documented in blockchain (filename will be Transaction ID_IPFS-Hash
	in\edi  = Received EDI Messages (text files)
	in\meta = Meta files corresponding to EDI Messages.
	
*/

require("./bootstrap.js");
var fs = require("fs");


checkOutbox = function() {
	if(!fs.existsSync("out")) fs.mkdirSync("out");
	if(!fs.existsSync("sent")) fs.mkdirSync("sent");
	var files = fs.readdirSync("out");
	if(files.length==0) return;
	for(var i=0;i<1;i++) {
		var data = fs.readFileSync("out/"+files[i]).toString();
		// try to determine "to" from data
		var segSplit=data.substr(4,1);
		var unb_start=data.indexOf("UNB"+segSplit);
		for(var j=0;j<3;j++) {
			unb_start=data.indexOf(segSplit,unb_start+1);
		}
		var recipient_end=data.indexOf(segSplit,unb_start+1);
		var recipient=data.substr(unb_start+1,recipient_end-unb_start-1);	
		// Nice if we would move to tmp first...
		edichain.sendData(recipient,data,function(tx,hash) {
				var files = fs.readdirSync("out");
				fs.renameSync("out/"+files[0],"sent/"+tx+"_"+hash+".edi");		
		});
	}
}

edichain.storeMessage=function(message) {
	// Need to overwrite in case something goes wrong with message decryption.
	
	if(!message.data) {} else
	if(message.data.length>0) {
		fs.writeFileSync("in/edi/"+message.addr+".edi",message.data);	
	}
	  var m=message;
	 // m.data="";	  
	  fs.writeFileSync("in/meta/"+message.addr+".json",JSON.stringify(m));				
	//}	
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
		checkOutbox();	
		try { checkInbox(); } catch(e) {console.log(e);}
	interval_semaphore=false;
}
  
var cb = function() {
		try { checkInbox(); } catch(e) {console.log(e);}
		setInterval(interval,20000);
}

var echain = new edichain.bootstrap({bootstrap_callback:cb});

