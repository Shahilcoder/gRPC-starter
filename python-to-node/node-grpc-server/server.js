const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const PROTO_PATH = path.join(__dirname, "../../proto/hello/hello.proto");

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const grpcObject = grpc.loadPackageDefinition(packageDef);
const { hello } = grpcObject;

function sayHello(call, callback) {
  const name = call.request.name;
  console.log(`[Node] Received request from: ${name}`);
  callback(null, { message: `Hello, ${name}!` });
}

function main() {
  const server = new grpc.Server();
  server.addService(hello.Greeter.service, { sayHello: sayHello });

  const address = "0.0.0.0:50051";
  server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) throw err;
    console.log(`[Node] gRPC server running at ${address}`);
  });
}

main();
