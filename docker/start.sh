#!/bin/sh

export env SET IPFS_PATH=/edichain/ipfs
if [ -d "/edichain/ipfs" ]
	then echo "ipfs initialized"
	else	
	/usr/local/bin/ipfs init 	
fi

apt-get install -y software-properties-common curl
curl -sL https://deb.nodesource.com/setup_6.x | bash -	
add-apt-repository -y ppa:ethereum/ethereum
add-apt-repository -y ppa:ethereum/ethereum-dev
apt-get update
apt-get install -y nodejs 
apt-get install -y ethereum	
apt-get install -y git

if [ -d "/edichain/backend" ]
	then echo "EDIChain initialized"
	else
	mkdir /edichain/backend
	cd /edichain/backend
	npm install edichain
fi
cd /edichain/backend
npm update edichain

nohup geth --rpc  --rpcapi "eth,net,web3,personal" --rpcaddr "localhost"  --rpcport "8545" --datadir /edichain/blockchain &
nohup /usr/local/bin/ipfs daemon --init  &

if [ -d "/edichain/frontend" ]
	then echo "EDIChain Frontend initialized"
	else
	mkdir /edichain/frontend
	cd /edichain/frontend	
	npm install http-server -g
fi
cd /edichain/backend/node_modules/edichain
nohup http-server ./web -p 8088 &
sleep 2
cd /edichain/backend/node_modules/edichain
npm start
#/bin/bash
#