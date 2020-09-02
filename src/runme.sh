#!/bin/bash

sudo docker build -t voxualize/envoy -f ./envoy.Dockerfile .
sudo docker run -d -p 8080:8080 -p 9901:9901 --network=host voxualize/envoy
