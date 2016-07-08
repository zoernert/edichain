require("./bootstrap.js");


var cb = function() {
	

		setInterval(function() { edichain.updateInbox(); 		
		
		},3000);
			
}

var echain = new edichain.bootstrap({bootstrap_callback:cb});

