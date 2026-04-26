import grpc
from hello import hello_pb2
from hello import hello_pb2_grpc

def run():
    with grpc.insecure_channel('localhost:50051') as channel:
        stub = hello_pb2_grpc.GreeterStub(channel)
        response = stub.SayHello(hello_pb2.HelloRequest(name='Python gRPC Client'))
        print(f"[Python] Server replied: {response.message}")

if __name__ == "__main__":
    run()
