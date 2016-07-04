require("./bootstrap.js");

var keyShow=function(key) {
	console.log(key);
}
var cb = function() {
	//console.log(edichain.config);
	if(!edichain.config.registered) {
		edichain.register();			
	} else {
		console.log("Re-Reg for testing?");
		
		// Overwrite ... as we test :)		
		edichain.getInbox();
		setInterval(function() { console.log(edichain.messages); },3000);
	}
}

var echain = new edichain.bootstrap({bootstrap_callback:cb});

