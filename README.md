EDIchain
=========

Provides a basic integration for ipfs (storage/distribution) and ethereum blockchain (validation/authorization) based EDI message exchange. All messages are transactions represented within the blockchain. Message data is always encrypted an is not part of the blockchain transaction. Instead a hash of the encrypted content is published into the blockchain. Message data/content is distributed via ipfs. 

- Encrypted P2P Data exchange that require transaction proof (consens of transactions)
- High-End scalability due to P2P architecture for content distribution
- Easy integration into existing backend systems (like EDIFact)
- Try to do a kind of Plug and Play ... (Auto-Register, Auto-Config...)


## Installation
```
  npm install edichain --save
```
## Requirement

Requires ipfs daemon to be started.  

```
ipfs daemon
```
 
Requires geth to be started and synced blockchain.

```
geth --rpc --unlock "0x12345678..." --rpcapi "eth,net,web3,personal" --rpcaddr "localhost"  --rpcport "8545" console  
```
 
## Usage

Basic
```javascript
	var cb = function() {				
		// YOUR Code to interact 			
		
	}

	var config = {
		bootstrap_callback:cb	
	}
	
	var echain = new edichain.bootstrap(config);	
			
``` 
### Configuration Options
<table>
	<tr><td>bootrap_callback</td><td>Required</td><td>Your Callback function to be called as soon as startup is completed</td></tr>
	<tr><td>fromAddress</td><td>Optional</td><td>Ethereum address to be opened (Default: Account 0)</td></tr>
	<tr><td>pwd</td><td>Required (if locked)</td><td>Password to unlock account</td></tr>
	<tr><td>ipfsAPI</td><td>Optional</td><td>IPFS API (Default: /ip4/127.0.0.1/tcp/5001 )</td></tr>
	<tr><td>rpcProvider</td><td>Optional</td><td>GETH RPC Interface (Default: http://localhost:8545 )</td></tr>	
</table>

### Known Limitations 
- Runtime should not exceed 1 day as geth account unlock is limited to 86400 seconds
- Account create is not implemented. You might use MIST to create your Ethereum account

## Examples

### Sending Data to (registered) Ethereum Account 

```javascript
	edichain.sendData("0x9707F3C9ca3C554A6E6d31B71A3C03d7017063F4","Some Data you like to send to me :)");
``` 
	
What happens in the background:

1.  Check if recipient "0x97..." is registered
2.  Fetch public key of recipient via ipfs using hash provided by registrar contract in blockchain
3.  Encrypt Data and store it as ipfs object
4.  Send message with hash to stored object to recipient (using registrar)

### Checking and updating inbox

```javascript
	edichain.updateInbox(); // Checks Blockchain for updates
	
	// edichain.messages[] holds all messages received (inc. data)
	
	// Sample on how to use messages array
	
	setInterval(function() {
	var old_inbox_length=0;
		if(edichain.messages.length!=old_inbox_length) {
				var isEncrypted=true;
				for(var i=edichain.messages.length-1;i>old_inbox_length-1;i--) {
						if(!edichain.messages[i].data) isEncrypted=false; else {
								console.log(edichain.messages[i]);
						}
				}
				if(isEncrypted) old_inbox_length=edichain.messages.length;
		}
	},1000);
``` 

How messages get processed:

1.  Check with registrar for new messages
2.  Retrieve address of message contract
3.  Retrieve hash with data using IPFS
4.  Decrypt message and validate sender
5.  Update Messages array

### Transaction Log

In EDI it is all about securing transactions. In this aspect all operations this script does are visible within the blockchain. 

```javascript
edichain.txlog.stream({ start: -1 }).on('log', function(log) {
    console.log(log);
});
```

Internally this script is using winston as logger and creates a tx.log file containing all transactions for auditing.

## Contributing
https://blog.stromhaltig.de/ 

## Release History
* 0.0.9 Encapsulated IPFS cloud WORM in order to allow providers as alternative
* 0.0.5 Updated Logger, several fixes in message handling
* 0.0.1 Initial release
