package config

import "testing"

func TestDefaultConfig(t *testing.T) {
	t.Setenv("LISTEN_ADDR", "")
	t.Setenv("IMGPROXY_URL", "")
	t.Setenv("S3_BUCKET", "source-images")
	t.Setenv("S3_REGION", "")
	t.Setenv("UPSTREAM_GATEWAY", "")
	t.Setenv("MAX_WIDTH", "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	if cfg.ListenAddr != ":8080" {
		t.Fatalf("ListenAddr = %q, want %q", cfg.ListenAddr, ":8080")
	}
	if cfg.ImgproxyURL != "http://localhost:8081" {
		t.Fatalf("ImgproxyURL = %q, want %q", cfg.ImgproxyURL, "http://localhost:8081")
	}
	if cfg.S3Bucket != "source-images" {
		t.Fatalf("S3Bucket = %q, want %q", cfg.S3Bucket, "source-images")
	}
	if cfg.S3Region != "us-east-1" {
		t.Fatalf("S3Region = %q, want %q", cfg.S3Region, "us-east-1")
	}
	if cfg.UpstreamGateway != "istio-ingressgateway.istio-system.svc.cluster.local" {
		t.Fatalf("UpstreamGateway = %q, want default gateway", cfg.UpstreamGateway)
	}
	if cfg.MaxWidth != 1920 {
		t.Fatalf("MaxWidth = %d, want %d", cfg.MaxWidth, 1920)
	}
}

func TestRequiredS3Bucket(t *testing.T) {
	t.Setenv("S3_BUCKET", "")

	if _, err := Load(); err == nil {
		t.Fatal("Load() error = nil, want error")
	}
}

func TestCustomConfig(t *testing.T) {
	t.Setenv("LISTEN_ADDR", ":9090")
	t.Setenv("IMGPROXY_URL", "http://imgproxy:8080")
	t.Setenv("S3_BUCKET", "custom-bucket")
	t.Setenv("S3_REGION", "ap-northeast-1")
	t.Setenv("UPSTREAM_GATEWAY", "gateway.internal")
	t.Setenv("MAX_WIDTH", "2048")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	if cfg.ListenAddr != ":9090" {
		t.Fatalf("ListenAddr = %q, want %q", cfg.ListenAddr, ":9090")
	}
	if cfg.ImgproxyURL != "http://imgproxy:8080" {
		t.Fatalf("ImgproxyURL = %q, want %q", cfg.ImgproxyURL, "http://imgproxy:8080")
	}
	if cfg.S3Bucket != "custom-bucket" {
		t.Fatalf("S3Bucket = %q, want %q", cfg.S3Bucket, "custom-bucket")
	}
	if cfg.S3Region != "ap-northeast-1" {
		t.Fatalf("S3Region = %q, want %q", cfg.S3Region, "ap-northeast-1")
	}
	if cfg.UpstreamGateway != "gateway.internal" {
		t.Fatalf("UpstreamGateway = %q, want %q", cfg.UpstreamGateway, "gateway.internal")
	}
	if cfg.MaxWidth != 2048 {
		t.Fatalf("MaxWidth = %d, want %d", cfg.MaxWidth, 2048)
	}
}
