# image-optimize-proxy

K8s-hosted Go reverse proxy that transforms images on demand using an imgproxy sidecar and caches results in S3.

## Request Flow

```
CloudFront → NLB → proxy(:8080) → S3 cache hit  → return cached
                                 → S3 cache miss → upstream resolve
                                                 → imgproxy(:8081) transform
                                                 → store S3
                                                 → return
```

CloudFront sets `X-Img-Source-Type` and `X-Img-Source-Bucket` origin custom headers to tell the proxy where the source image lives. `imwidth`, `f` (format), and `q` (quality) query params control transformation.

See [`docs/architecture.md`](docs/architecture.md) for the full CloudFront ↔ proxy contract.

## Configuration

| Env var | Default | Description |
|---|---|---|
| `S3_BUCKET` | **required** | S3 bucket for cached transformed images |
| `S3_REGION` | `us-east-1` | AWS region of the S3 bucket |
| `IMGPROXY_URL` | `http://localhost:8081` | imgproxy sidecar address |
| `UPSTREAM_GATEWAY` | `istio-ingressgateway.istio-system.svc.cluster.local` | Upstream origin gateway |
| `LISTEN_ADDR` | `:8080` | Proxy listen address |
| `MAX_WIDTH` | `1920` | Maximum allowed image width in pixels |

## Development

```bash
make test          # run unit tests with race detector
make build         # build binary to ./bin/server
```

Requirements: Go 1.25+

## Deployment

Deployed via the included Helm chart. Runs alongside an imgproxy sidecar container.

```bash
helm install image-optimize-proxy ./charts/image-optimize-proxy \
  --set config.s3Bucket=viverse-image-optimize-cache-stage \
  --set config.s3Region=us-west-2
```

Key Helm values: `config.s3Bucket`, `config.s3Region`, `image.repository`, `image.tag`. See [`charts/image-optimize-proxy/values.yaml`](charts/image-optimize-proxy/values.yaml) for the full reference.

The chart creates a dedicated internal NLB via `service.beta.kubernetes.io/aws-load-balancer-type: external` + `scheme: internal` annotations. IRSA is required for S3 access — configure the service account annotation separately.
