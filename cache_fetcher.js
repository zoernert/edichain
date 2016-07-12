var Web3 = require('web3');
var web3 = new Web3();
var ipfsAPI = require('ipfs-api');


var retrieveHashes=function() {
		ipfs = ipfsAPI('/ip4/127.0.0.1/tcp/5001');
		web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));
		registrarAbi=JSON.parse(fs.readFileSync('registrar.abi',{encoding:"utf-8"}));
		messageAbi=JSON.parse(fs.readFileSync('message.abi',{encoding:"utf-8"}));		
		var registrarContract=web3.eth.contract(registrarAbi).at("0x4CC3C679E69CD21710E908aa3777DEbe6Cc776Ed");
		
}