Note
=========
This Dockerfile allows to kickstart a docker having all dependencies setup. On RUN it will provide a JSON-RPC on port 8000 and a sample WebUI on port 8088.


```
docker run -p 8000:8000 -p 8088:8088 -p 4001:4001 stromhaltig/edi-chain