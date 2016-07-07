require("./bootstrap.js");

var keyShow=function(key) {
	console.log(key);
}
var cb = function() {
	//console.log(edichain.config);
	
		console.log("Re-Reg for testing?");
		//edichain.sendData('0x9707f3c9ca3c554a6e6d31b71a3c03d7017063f4','Hier stehen jetzt ganz viele Daten, die ich schon immer einmal los werden wollte und es mir bislang einfach nicht getraut habe. Eigentlich benötige ich jetzt ganz dringend einen Kaffee. Nur dazu muss ich aufstehen und kann die Zeit nutzen, in der die Blockchain arbeitet');
		// Overwrite ... as we test :)		
		setInterval(function() { edichain.updateInbox(); },3000);
		//setInterval(function() { console.log(edichain.messages); },3000);
		//edichain.decryptHash("QmVNq2RHdcG4duuFAg7HS2aCSSWpFgjsejhtEspmjEKYp9");
	
}

var echain = new edichain.bootstrap({bootstrap_callback:cb});

