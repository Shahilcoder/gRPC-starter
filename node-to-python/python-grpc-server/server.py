from concurrent import futures
import grpc
from hello import hello_pb2
from hello import hello_pb2_grpc


class Greeter(hello_pb2_grpc.GreeterServicer):
    def SayHello(self, request, context):
        print(f"[Python] Received request from: {request.name}")
        return hello_pb2.HelloReply(message=f"Hello, {request.name}!")


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    hello_pb2_grpc.add_GreeterServicer_to_server(Greeter(), server)
    address = "0.0.0.0:50051"
    server.add_insecure_port(address)
    server.start()
    print(f"[Python] gRPC server running at {address}")
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
