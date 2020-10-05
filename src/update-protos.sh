#!/bin/bash

protoc -I=./voxualize-protos/ voxualize.proto   --js_out=import_style=commonjs:./voxualize-protos/   --grpc-web_out=import_style=commonjs,mode=grpcwebtext:./voxualize-protos/