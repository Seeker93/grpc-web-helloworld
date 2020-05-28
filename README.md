
## IMPORTANT NOTE
Before running any of the commands below, make sure you cd into the src folder.
```
 $ cd src
```

## Generate Protobuf Messages and Client Service Stub

To generate the protobuf messages and client service stub class from your
`.proto` definitions, we need the `protoc` binary and the
`protoc-gen-grpc-web` plugin.

You can download the `protoc-gen-grpc-web` protoc plugin from our
[release](https://github.com/grpc/grpc-web/releases) page:

If you don't already have `protoc` installed, you will have to download it
first from [here](https://github.com/protocolbuffers/protobuf/releases).

Make sure they are both executable and are discoverable from your PATH.

When you have both `protoc` and `protoc-gen-grpc-web` installed, you can now
run this command:

```sh
$ protoc -I=./protos/ helloworld.proto \
  --js_out=import_style=commonjs:. \
  --grpc-web_out=import_style=commonjs,mode=grpcwebtext:.
```

After the command runs successfully, you should now see two new files generated
in the current directory:

 - `helloworld_pb.js`: this contains the `HelloRequest` and `HelloReply`
   classes
 - `helloworld_grpc_web_pb.js`: this contains the `GreeterClient` class
 
## Run the Example!
 
 1. Run the Envoy proxy. The `envoy.yaml` file configures Envoy to listen to
 browser requests at port `:8080`, and forward them to port `:9090` (see
 above).

 ```sh
 $ sudo docker build -t helloworld/envoy -f ./envoy.Dockerfile .
 $ sudo docker run -d -p 8080:8080 -p 9901:9901 --network=host helloworld/envoy
 ```

NOTE: As per [this issue](https://github.com/grpc/grpc-web/issues/436):
if you are running Docker on Mac/Windows, remove the `--network=host` option:

 ```sh
 $ docker run -d -p 8080:8080 -p 9901:9901 helloworld/envoy
 ```

2. Next, we need to build and run the React front-end
```sh
$ npm install
$ npx start
```

 1.Next, open a new tab and build the C++ gRPC Service using CMAKE (Go here for prerequisites https://grpc.io/docs/languages/cpp/quickstart/).

 ```sh
 $ mkdir -p cmake/build
 $ pushd cmake/build
 $ cmake -DCMAKE_PREFIX_PATH=$MY_INSTALL_DIR ../..
 $ make -j
 $ ./greeter_service
 ```


When these are all ready, you can open a browser tab and navigate to

```
localhost:3000
```

Click the button and you should receive a message from the backend