var forge = require('node-forge');
var fs = require('fs');
var rsa = forge.pki.rsa;
var Web3 = require('web3');
var web3 = new Web3();
var ipfsAPI = require('ipfs-api');
var crypto = require('crypto');
var winston = require('winston');

edichain = function() {};

edichain.bootstrap=function(config) {
		var c = { version:'0.0.5' };
		if(!config.ipfsAPI)  c.ipfsAPI='/ip4/127.0.0.1/tcp/5001'; else c.ipfsAPI=config.ipfsAPI;		
		edichain.ipfs = ipfsAPI(c.ipfsAPI);
		edichain.ipfs.id(function(err,res) { if(err) throw "Check if ipfs daemon is running" ; c.ipfsID=res.ID; });	
		edichain.txlog = new (winston.Logger)({
					transports: [
					  new (winston.transports.Console)(),
					  new (winston.transports.File)({ filename: 'tx.log' })
					]
				  });

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
		if(fs.existsSync('registrar.abi')&&fs.existsSync('message.abi')) {
			c.registrarAbi=JSON.parse(fs.readFileSync('registrar.abi',{encoding:"utf-8"}));
			c.messageAbi=JSON.parse(fs.readFileSync('message.abi',{encoding:"utf-8"}));
		} else {
			edichain.retrieveABI();
		}
		if(config.fromAddress) c.fromAddress=config.fromAddress; else { 
				if(web3.eth.accounts.length==0) {
						web3.personal.newAccount(c.ipfsID);
				} 
				c.fromAddress=web3.eth.accounts[0]; 		
		}
		if(config.pubRegistrarAddress) c.pubRegistrarAddress=config.pubRegistrarAddress; else c.pubRegistrarAddress="0x4CC3C679E69CD21710E908aa3777DEbe6Cc776Ed";
		if(config.pwd) { web3.personal.unlockAccount(c.fromAddress, config.pwd, 86400); c.pwd=config.pwd;} else {
			try {
			web3.personal.unlockAccount(c.fromAddress,c.ipfsID,86400);
			} catch(e) {}
		}
		this.config=c;
		this.config.fromAddress=this.config.fromAddress.toLowerCase();
		c.inboxBlock=0;
		edichain.config=c;
		c=this.config;
		
		c.bootstrap_fnct=this.init2;
		c.bootstrap1=setInterval(function() {
			if(c.ipfsID&&c.pem&&c.fromAddress&&edichain.config.messageAbi&&edichain.config.registrarAbi) {
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
	} else {
		edichain.config.registered=false;
		edichain.register();
	}
	
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
		const hmac = crypto.createHmac('sha256', to.toLowerCase());
		hmac.update(edichain.config.pubRegistrarAddress.toLowerCase());		
		var hmac_digest=hmac.digest('base64');

		var cipher = crypto.createCipher('aes192', hmac_digest);

		var encrypted = cipher.update(data, 'utf8', 'base64');
		encrypted += cipher.final('base64');

		var enc_hmac_digest = crypto.publicEncrypt(to_key, new Buffer(hmac_digest));
		var enc_hmac_from = crypto.privateEncrypt(edichain.config.pom_data, new Buffer(hmac_digest));
		
		var enc_data = JSON.stringify({
			hmac_digest:enc_hmac_digest.toString('base64'),
			hmac_from:enc_hmac_from.toString('base64'),
			data:encrypted
			});
		console.log(enc_data);
		edichain.ipfs.files.add(new Buffer(enc_data),function(err,res) {
			if(err) throw err;			
			edichain.sendMsg(to.toLowerCase(),res[0].path);		
		});
	};
	
	edichain.getPubKey(to,sendDataWithPubKey);
		

};

edichain.sendMsg = function(to,hash) {
		edichain.config.registrarContract.sendMsg(to,hash,{from:edichain.config.fromAddress,gas: 1000000,value:edichain.config.registrarContract.fee_msg()},function(error, result){
			if(!error) {
				console.log("TX Hash sendMsg:"+result)
				edichain.txlog.info('sendMsg',{'result':result,'to':to,'hash':hash});
				}
			else
				console.error(error);
		});	
};
edichain.decryptMessageHash = function(hash,message,cb) {
        var ret=false;
		edichain.ipfs.cat(hash,function(err,res) {
					var buf = ''
					  res
						.on('error', (err) => {
							//
						})
						.on('data', (data) => {
						  buf += data
						})
						.on('end', () => {	
							var m = {};
							try {
							m = JSON.parse(buf);
							} catch(e) {console.log("JSON Error in incomming msg");}
							//console.log(m);
							if((m.data)&&(m.hmac_digest)) {
								
								   var enc_hmac_digest = new Buffer(m.hmac_digest,'base64');
								   var dec_hmac_digest = crypto.privateDecrypt(edichain.config.pom_data,enc_hmac_digest);
								   
									// Test if HMAC is correct (are we recipient?)
									const hmac = crypto.createHmac('sha256', edichain.config.fromAddress.toLowerCase());
									hmac.update(edichain.config.pubRegistrarAddress.toLowerCase());
									var hmac_digest=hmac.digest('base64');
		
									if(hmac_digest!=dec_hmac_digest.toString()) {
										throw "Message routing error - message hash conflict";
									} 
		
									var  decipher = crypto.createDecipher('aes192', dec_hmac_digest.toString());
									
									var decrypted = decipher.update(new Buffer(m.data,'base64'), 'hex', 'utf8');
									decrypted += decipher.final('utf8');
									if(message) {
										message.data=decrypted;
										message.hmac_digest=m.hmac_digest;
										message.hmac_from=m.hmac_from;
										if(cb) {
											cb(message);
										}
									}
									
							}														
						});
		});		
}


edichain.verifySender = function(message,cb) {		
		var verifyWithKey = function(pubKey) {
			var enc_hmac_digest = new Buffer(message.hmac_from,'base64');
			var dec_hmac_digest = crypto.publicDecrypt(pubKey,enc_hmac_digest).toString();
								   
			// Test if HMAC is correct (are we recipient?)
			const hmac = crypto.createHmac('sha256', edichain.config.fromAddress.toLowerCase());
			hmac.update(edichain.config.pubRegistrarAddress.toLowerCase());
			var hmac_digest=hmac.digest('base64');
			if(hmac_digest==dec_hmac_digest) { 
					message.verifiedSender=true;
			} else { 					
					message.verifiedSender=false;	
			}		
			if(cb) cb(message);
		}
		edichain.getPubKey(message.from,verifyWithKey);
};

edichain.decryptMessage = function(message) {        
	// Decorator to verify & retrieve 
	edichain.decryptMessageHash(message.hash_msg,message,function(m) {edichain.verifySender(m,function(m) {			
			if(m.hash_ack.length<2) {
				edichain.ackMessage(m,JSON.stringify(m.hash_msg));
			}
	}); });	
};


edichain.ackMessage = function(message,payload_string) {				
		
		const hmac = crypto.createHmac('sha256', message.from.toLowerCase());
		hmac.update(edichain.config.pubRegistrarAddress.toLowerCase());		
		var hmac_digest=hmac.digest('base64');

		var cipher = crypto.createCipher('aes192', hmac_digest);

		var encrypted = cipher.update(payload_string, 'utf8', 'base64');
		encrypted += cipher.final('base64');

		var enc_hmac_digest = crypto.privateEncrypt(edichain.config.pom_data, new Buffer(hmac_digest));		
		
		var enc_data = JSON.stringify({
			hmac_digest:enc_hmac_digest.toString('base64'),			
			data:encrypted
			});
		
		
		edichain.ipfs.files.add(new Buffer(enc_data),function(err,res) {
			if(err) throw err;			
			edichain.sendAckMessage(message.addr,res[0].path);		
		});
}

edichain.sendAckMessage = function(addr,hash) {
			var msg = web3.eth.contract(edichain.config.messageAbi).at(addr);
			msg.ack.sendTransaction(hash,"",{from:edichain.config.fromAddress,gas: 2000000},function(error, result){
			if(!error)
				{ 
					console.log("TX Hash ACK:"+result);
					edichain.txlog.info('ackMsg',{'result':result,'addr':addr,'hash':hash});
				}
			else
				console.error(error);
		});	
};

edichain.message = function() {
	this.ack = function() {
		edichain.ackMessage(this);
	}
	this.decrypt=function() {	
		edichain.decryptMessage(this);
	};
	
};

edichain.messages = [];

edichain.updateInbox = function() {
		if(edichain.config.inboxBlock>=web3.eth.blockNumber) return;
		edichain.config.inboxBlock=web3.eth.blockNumber;		
		var msg_addr="";
		for(i=0;msg_addr.length!=2;i++) {
			var msg_addr = edichain.config.registrarContract.msgs(edichain.config.fromAddress,i);	
			if(msg_addr.length!=2) {
			var msg = web3.eth.contract(edichain.config.messageAbi).at(msg_addr);					
			try {
				var m=new edichain.message();
				m.addr=msg_addr;
				m.from=msg.from();
				m.to=msg.to();
				m.hash_msg=msg.hash_msg();
				m.timestamp_msg=msg.timestamp_msg();
				m.hash_ack=msg.hash_ack();				
				m.timestamp_ack=msg.timestamp_ack();
				m.decrypt();
				edichain.messages[i]=m;
			} catch(e)  {console.log(e);}			
			}
		}		
};

edichain.retrieveABI = function() {

	edichain.ipfs.cat("QmTawf3PqWxejNj8bECDAeja8FdCK25Kj3VfwKMKfNNvfE",function(err,res) {	
		if(err) { console.log(err); throw "Unable to retrieve message.abi via IPFS (maybe try to copy file to root folder)"; }
		var buf = ''
					  res
						.on('error', (err) => {
							//
						})
						.on('data', (data) => {
						  buf += data
						})
						.on('end', () => {
							fs.writeFileSync("message.abi", buf);
							edichain.config.messageAbi=JSON.parse(buf);
						});
	});
	
	edichain.ipfs.cat("QmfYDth3f5MqypZ45JUKjVN48g4xi5DHttfTh6wCfstwXJ",function(err,res) {		
		if(err) { console.log(err); throw "Unable to retrieve registrar.abi via IPFS (maybe try to copy file to root folder)"; }
		var buf = ''
					  res
						.on('error', (err) => {
							//
						})
						.on('data', (data) => {
						  buf += data
						})
						.on('end', () => {
							fs.writeFileSync("registrar.abi", buf);
							edichain.config.registrarAbi=JSON.parse(buf);
						});
	});
}

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
					edichain.txlog.info('register',{'result':result,'ipsid':edichain.config.ipfsID});
					edichain.sendMsg(edichain.config.registrarContract.registrar(),""+edichain.config.ipfsID+"");
				}
			else
				console.error(error);
		});	
		console.log("Registering Contract");
};
	
module.exports=edichain;	