require("./bootstrap.js");

var keyShow=function(key) {
	console.log(key);
}
var cb = function() {
	
		edichain.register();
		console.log("Re-Reg for testing?");
		//++++
		//edichain.sendData('0x9707f3c9ca3c554a6e6d31b71a3c03d7017063f3','Hier stehen jetzt ganz viele Daten, die ich schon immer einmal los werden wollte und es mir bislang einfach nicht getraut habe. Eigentlich benötige ich jetzt ganz dringend einen Kaffee. Nur dazu muss ich aufstehen und kann die Zeit nutzen, in der die Blockchain arbeitet');
		// Overwrite ... as we test :)		
		setInterval(function() { edichain.updateInbox(); 		
		
		},3000);
			
}

var echain = new edichain.bootstrap({bootstrap_callback:cb,fromAddress:'0xfA21Fb716322eE4EBBeC6AeFB9208A428e0B56F4',pwd:'Maus12Rad'});

