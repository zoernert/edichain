var forge = require('node-forge');
var fs = require('fs');
var rsa = forge.pki.rsa;
var Web3 = require('web3');
var web3 = new Web3();
var ipfsAPI = require('ipfs-api');
const Log  = require('ipfs-log');

edichain = function() {};

edichain.bootstrap=function(config) {
		var c = { version:'0.1' };
		if(!config.ipfsAPI)  c.ipfsAPI='/ip4/127.0.0.1/tcp/5001'; else c.ipfsAPI=config.ipfsAPI;		
		edichain.ipfs = ipfsAPI(c.ipfsAPI);
		edichain.ipfs.id(function(err,res) { if(err) throw "Check if ipfs daemon is running" ; c.ipfsID=res.ID; });
		edichain.txlog = new Log(edichain.ipfs, 'A', 'txlog', { maxHistory: 100000 });
		if(config.bootstrap_callback) c.bootstrap_callback=config.bootstrap_callback;
		if(config.rpcProvider) c.rpcProvider=config.rpcProvider; else c.rpcProvider='http://localhost:8545';		
		if(config.path) c.path=config.path; else c.path="./";		
		edichain.config=c;
		try {
		    this.loadKeys();
		} catch(e) {			
			this.createNewKeypair(); 
		}
		web3.setProvider(new web3.providers.HttpProvider(c.rpcProvider));
		c.registrarAbi=JSON.parse(fs.readFileSync('registrar.abi',{encoding:"utf-8"}));
		c.messageAbi=JSON.parse(fs.readFileSync('message.abi',{encoding:"utf-8"}));
		if(config.fromAddress) c.fromAddress=config.fromAddress; else c.fromAddress=web3.eth.accounts[0];
		if(config.pubRegistrarAddress) c.pubRegistrarAddress=config.pubRegistrarAddress; else c.pubRegistrarAddress="0x2Ce5C90606D691226dbda5A9B88DC217d17F3e72";
		if(config.pwd) { web3.personal.unlockAccount(c.fromAddress, config.pwd, 300); c.pwd=config.pwd;}
		this.config=c;
		edichain.config=c;
		c=this.config;
		
		c.bootstrap_fnct=this.init2;
		c.bootstrap1=setInterval(function() {
			if(c.ipfsID&&c.pem&&c.fromAddress) {
				clearInterval(c.bootstrap1);
				c.bootstrap1=null;
				c.bootstrap_fnct();
			} else {
			
			}
		
		},500);
}

edichain.bootstrap.prototype.config = {};
edichain.updateRoot = function() {
	edichain.ipfs.files.stat("/",function(err,res) {	
					if(err) { console.log(err); throw err;}
					
					edichain.ipfs.name.publish(res.Hash,function (err, res){ 					
							edichain.config.ipnsKeyPublished=true;						
					});
	});
}
edichain.updatePubKeyNS = function() {	
	edichain.ipfs.files.rm("/pub.key",function(err1,res1) {					
		edichain.ipfs.files.add(new Buffer(edichain.config.pem_data),function(err,res) {
			edichain.ipfs.files.cp(["/ipfs/"+res[0].path,"/pub.key"],function(err,res) {			
				edichain.ipfs.files.stat("/",function(err,res) {				
					edichain.ipfs.name.publish(res.Hash,function (err, res){ 
							edichain.config.ipnsKeyPublished=true;						
					});
				});
			});	
		});
	});
}

edichain.bootstrap.prototype.init2 = function() {
	console.log("Bootstrap: Phase1 finished");
	// Check if everything is set on IPFS - if not publish
	edichain.updateRoot();
	//edichain.updatePubKeyNS();
	
	edichain.config.registrarContract=web3.eth.contract(edichain.config.registrarAbi).at(edichain.config.pubRegistrarAddress);	
	if(edichain.config.registrarContract.regadr(edichain.config.fromAddress)[1]==edichain.config.ipfsID) {	
		edichain.config.registered=true;	
	} else {edichain.config.registered=false;}
	
	c=setInterval(function() {
		if(edichain.config.ipnsKeyPublished) {
			clearInterval(c);
			edichain.config.bootstrap_finished=true;
			console.log("Bootstrap: Phase2 finished");
			if(edichain.config.bootstrap_callback) edichain.config.bootstrap_callback();
		}
	},500);	
	// Check if we are registered - if not advice	
}

edichain.bootstrap.prototype.loadKeys=function() {
		edichain.config.pem_data=fs.readFileSync(edichain.config.path+'pub.pem',{encoding:"utf-8"});
		edichain.config.pem = forge.pki.publicKeyFromPem(edichain.config.pem_data);	
		this.config.pem=this.pem;
		
		edichain.config.pom_data=fs.readFileSync(edichain.config.path+'priv.pem',{encoding:"utf-8"});
		edichain.config.pom = forge.pki.privateKeyFromPem(edichain.config.pom_data);
	
		console.log("Loaded keys...");
	};
	
edichain.bootstrap.prototype.createNewKeypair=function() {
		var keypair = rsa.generateKeyPair({bits: 2048, e: 0x10001});
		edichain.config.pem=keypair.publicKey;
		edichain.config.pom=keypair.privateKey;
		edichain.config.pem_data = forge.pki.publicKeyToPem(keypair.publicKey);
		edichain.config.pom_data = forge.pki.privateKeyToPem(keypair.privateKey);
		console.log(edichain.config.pem_data);
		
		fs.writeFile(edichain.config.path+"pub.pem", forge.pki.publicKeyToPem(keypair.publicKey), function(err) {    
			console.log("Public Key saved (filesystem)");
		}); 

		fs.writeFile(edichain.config.path+"priv.pem", forge.pki.privateKeyToPem(keypair.privateKey), function(err) {    
			console.log("Private Key saved (filesystem)");
		}); 
};
edichain.sendData = function(to,data) {

	var sendDataWithPubKey=function(to_key) {
		var pubkey=forge.pki.publicKeyFromPem(to_key);
		var enc_data = pubkey.encrypt(data);
		edichain.ipfs.files.add(new Buffer(enc_data),function(err,res) {
			if(err) throw err;
			edichain.sendMsg(to,res[0].path);		
		});
	};
	
	edichain.getPubKey(to,sendDataWithPubKey);
		

};

edichain.sendMsg = function(to,hash) {
		edichain.config.registrarContract.sendMsg(to,hash,{from:edichain.config.fromAddress,gas: 1000000,value:edichain.config.registrarContract.fee_msg()},function(error, result){
			if(!error) {
				console.log("TX Hash sendMsg:"+result)
				edichain.txlog.add({'sendMsg':result,'to':to,'hash':hash});
				}
			else
				console.error(error);
		});	
};

edichain.decryptMessage = function(message) {        
		edichain.ipfs.cat(message.hash_msg,function(err,res) {
					var buf = ''
					  res
						.on('error', (err) => {
							//
						})
						.on('data', (data) => {
						  buf += data
						})
						.on('end', () => {							
						  message.data=edichain.config.pom.decrypt(buf);				  
						});
		});
};

edichain.message = function() {

	this.decrypt=function() {	
		edichain.decryptMessage(this);
	};
	
};

edichain.messages = [];

edichain.getInbox = function() {		
		var msg_addr="xxxxxxx";
		for(i=0;msg_addr.length>2;i++) {
			var msg_addr = edichain.config.registrarContract.msgs(edichain.config.fromAddress,i);	
			var msg = web3.eth.contract(edichain.config.messageAbi).at(msg_addr);					
			try {
				var m=new edichain.message();																		
				m.from=msg.from();
				m.to=msg.to();
				m.hash_msg=msg.hash_msg();
				m.hash_ack=msg.hash_ack();				
				m.timestamp_msg=msg.timestamp_msg();
				m.timestamp_ack=msg.timestamp_ack();
				m.decrypt();
				edichain.messages[edichain.messages.length]=m;
			} catch(e)  {console.log(e);}			
		}		
};

edichain.getPubKey = function(address,callback) {
		var reg=edichain.config.registrarContract.regadr(address);
		if(reg[1].length<5) throw "Address "+address+" not registered at "+edichain.config.pubRegistrarAddress;
		var hash=reg[1];
		var pubkey = "";
		edichain.ipfs.name.resolve("/ipns/"+hash+"/pub.key",function(err,res) {	
		if(err) throw "Unable to resolve pub key at : /ipns/"+hash+"/pub.key"; 
		edichain.ipfs.files.rm("/"+address+".key",function(err1,res1) {					
		edichain.ipfs.files.cp([res.Path,"/"+address+".key"],function(err,res) {
		    if(err) { console.log(err); throw "Key not found at /ipns/"+hash+"/pub.key"; }			
			edichain.ipfs.files.read("/"+address+".key",function(err,res) {		
					var buf = ''
					  res
						.on('error', (err) => {
							//
						})
						.on('data', (data) => {
						  buf += data
						})
						.on('end', () => {
							edichain.ipfs.files.stat("/",function(err,res) {				
								edichain.ipfs.name.publish(res.Hash,function (err, res) { 	
										if(err) console.log(err);
								});
							});
						  callback(buf);					  
						});
				});
			});
		});
		});
};

edichain.register = function() {
		edichain.config.registrarContract.updateRegistration.sendTransaction(""+edichain.config.ipfsID+"","",{from:edichain.config.fromAddress,gas: 2000000,value:edichain.config.registrarContract.fee_registration()},function(error, result){
			if(!error)
				{ 
					console.log("TX Hash Registration:"+result);
					edichain.txlog.add({'register':result});
					edichain.sendMsg(edichain.config.registrarContract.registrar(),""+edichain.config.ipfsID+"");
				}
			else
				console.error(error);
		});	
		console.log("Registering Contract");
};
	
module.exports=edichain;	