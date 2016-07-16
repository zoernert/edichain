/*
 This inits an ethereum node in case no account is available
*/
var ipfsAPI = require('ipfs-api');
var Web3 = require('web3');
var web3 = new Web3();
var fs = require('fs');

var ipfs = ipfsAPI('/ip4/127.0.0.1/tcp/5001');
ipfs.id(function(err,res) { if(err) throw "Check if ipfs daemon is running" ; 
	var ipfsID=res.ID;
	web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545')); 
	if(web3.eth.accounts.length==0) {
						web3.personal.newAccount(ipfsID);
						var config = {
							pwd:ipfsID
						};
						fs.writeFileSync("config", JSON.stringify(config));
    } 
});	