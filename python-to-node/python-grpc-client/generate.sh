#!/usr/bin/env bash
set -euo pipefail

uv run python -m grpc_tools.protoc \
  -I ../../proto \
  --python_out=. \
  --grpc_python_out=. \
  ../../proto/hello/hello.proto
