# Build the k6 binary with the extension
FROM golang:1.20 as builder

RUN go install go.k6.io/xk6/cmd/xk6@latest

# Add support for output of test metrics to InfluxDB v2
RUN GCO_ENABLED=0 xk6 build \
    --with github.com/grafana/xk6-exec  \
    --output /k6

# Use a lightweight image with a shell
FROM alpine:latest
# Install necessary runtime dependencies, including a shell
RUN apk add --no-cache bash traceroute

# Copy the k6 binary
COPY --from=builder /k6 /usr/bin/k6

# Set k6 as the default entrypoint
ENTRYPOINT ["/usr/bin/k6"]
