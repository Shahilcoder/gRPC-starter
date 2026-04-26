# gRPC Starter

A minimal cross-language gRPC playground demonstrating a `Greeter.SayHello` RPC in **both directions** between Python and Node.js, sharing a single `.proto` contract.

Use it as a study reference for: how `.proto` → generated stubs → server/client wiring works, and how the same contract is consumed by two different languages.

---

## Repo layout

```
.
├── proto/
│   └── hello/hello.proto          # single source of truth (shared contract)
│
├── node-to-python/                # Node client → Python server
│   ├── node-grpc-client/          # client.js + package.json
│   └── python-grpc-server/        # server.py + generated stubs
│
└── python-to-node/                # Python client → Node server
    ├── python-grpc-client/        # client.py + generated stubs
    └── node-grpc-server/          # server.js + package.json
```

Both directions hit the **same address** `localhost:50051` over **insecure** channels (no TLS — local dev only).

---

## The contract (`proto/hello/hello.proto`)

```proto
service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
}
message HelloRequest { string name = 1; }
message HelloReply   { string message = 1; }
```

A single unary RPC. Python uses `PascalCase` (`SayHello`), Node's proto-loader exposes it as `camelCase` (`sayHello`) on the client stub — both call the same wire method.

---

## How stubs are generated

### Python (ahead-of-time)
Python checks generated `_pb2.py` and `_pb2_grpc.py` files into the repo under `hello/`. Regenerate with the local script:

```bash
cd node-to-python/python-grpc-server   # or python-to-node/python-grpc-client
./generate.sh
```

Internally:
```bash
uv run python -m grpc_tools.protoc \
  -I ../../proto \
  --python_out=. --grpc_python_out=. \
  ../../proto/hello/hello.proto
```

### Node (at runtime)
Node uses `@grpc/proto-loader` to load `hello.proto` dynamically — **no codegen step**. The `keepCase: true` option preserves field naming from the `.proto`.

---

## Running each direction

Both demos use port **50051**. Start the server first, then run the client in another terminal.

### 1. Node → Python

```bash
# terminal A — Python server
cd node-to-python/python-grpc-server
uv sync
uv run python main.py
# → [Python] gRPC server running at 0.0.0.0:50051

# terminal B — Node client
cd node-to-python/node-grpc-client
pnpm install
pnpm start
# → [Node] Server replied: Hello, Node gRPC Client!
```

### 2. Python → Node

```bash
# terminal A — Node server
cd python-to-node/node-grpc-server
pnpm install
node server.js
# → [Node] gRPC server running at 0.0.0.0:50051

# terminal B — Python client
cd python-to-node/python-grpc-client
uv sync
uv run python main.py
# → [Python] Server replied: Hello, Python gRPC Client!
```

---

## Key code patterns

### Python server (`server.py`)
```python
class Greeter(hello_pb2_grpc.GreeterServicer):
    def SayHello(self, request, context):
        return hello_pb2.HelloReply(message=f"Hello, {request.name}!")

server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
hello_pb2_grpc.add_GreeterServicer_to_server(Greeter(), server)
server.add_insecure_port("0.0.0.0:50051")
server.start(); server.wait_for_termination()
```

### Python client (`client.py`)
```python
with grpc.insecure_channel("localhost:50051") as channel:
    stub = hello_pb2_grpc.GreeterStub(channel)
    response = stub.SayHello(hello_pb2.HelloRequest(name="Python gRPC Client"))
```

### Node server (`server.js`)
```js
const server = new grpc.Server();
server.addService(hello.Greeter.service, { sayHello });
server.bindAsync("0.0.0.0:50051", grpc.ServerCredentials.createInsecure(), cb);
```

### Node client (`client.js`)
```js
const stub = new hello.Greeter("localhost:50051", grpc.credentials.createInsecure());
stub.sayHello({ name: "Node gRPC Client" }, (err, response) => { ... });
```

---

## Toolchain

| Lang   | Runtime  | Pkg manager | gRPC libs |
|--------|----------|-------------|-----------|
| Python | ≥ 3.13   | `uv`        | `grpcio`, `grpcio-tools` |
| Node   | any LTS  | `pnpm`      | `@grpc/grpc-js`, `@grpc/proto-loader` |

`.gitignore` excludes `node_modules`, `.venv`, `__pycache__`, `dist`.

---

## Mental model — what to take away

1. **One `.proto` is the contract.** Both languages compile/load it independently; the wire format is identical.
2. **Server side** = implement the service interface + bind a port.
3. **Client side** = create a channel + instantiate a stub + call the method like a local function.
4. **Naming differs by language idiom** (`SayHello` vs `sayHello`, `PascalCase` messages vs JS objects), but the on-wire RPC is the same.
5. **Insecure credentials** are fine for `localhost`; swap to TLS for anything else.
