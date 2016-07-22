#!/bin/sh
apt-get update
apt-get install -y curl 
cd /tmp/
curl -o ipfs.tgz https://dist.ipfs.io/go-ipfs/v0.4.2/go-ipfs_v0.4.2_linux-amd64.tar.gz
tar -zxvf ./ipfs.tgz
cd /tmp/go-ipfs/
./install.sh
#/usr/local/bin/ipfs init 