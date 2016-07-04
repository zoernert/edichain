EDIchain
=========



## Installation
```
  npm install edichain --save
```
## Requirement

Requires ipfs daemon to be started 

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
		
		if(!edichain.config.registered) {
			edichain.register();			
		} else {
			// YOUR Code to interact 			
		}
	}

	var echain = new edichain.bootstrap({bootstrap_callback:cb});
	
``` 

## Contributing


## Release History

* 0.0.1 Initial release