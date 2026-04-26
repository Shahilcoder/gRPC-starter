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

function main() {
  const address = "localhost:50051";
  const clientStub = new hello.Greeter(address, grpc.credentials.createInsecure());

  clientStub.sayHello({ name: "Node gRPC Client" }, (err, response) => {
    if (err) {
      console.error("[Node] RPC failed:", err.message);
      process.exit(1);
    }
    console.log(`[Node] Server replied: ${response.message}`);
  });
}

main();
