package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

const (
	defaultListenAddr      = ":9999"
	defaultImgproxyURL     = "http://localhost:8081"
	defaultS3Region        = "us-west-2"
	defaultUpstreamGateway = "istio-ingressgateway.istio-system.svc.cluster.local"
	defaultMaxWidth        = 1920
)

// Config holds the service configuration loaded from environment variables.
type Config struct {
	ListenAddr      string
	ImgproxyURL     string
	S3Bucket        string
	S3Region        string
	UpstreamGateway string
	MaxWidth        int
}

// Load reads service configuration from environment variables.
func Load() (*Config, error) {
	maxWidth, err := loadMaxWidth()
	if err != nil {
		return nil, err
	}

	cfg := &Config{
		ListenAddr:      envOrDefault("LISTEN_ADDR", defaultListenAddr),
		ImgproxyURL:     envOrDefault("IMGPROXY_URL", defaultImgproxyURL),
		S3Bucket:        strings.TrimSpace(os.Getenv("S3_BUCKET")),
		S3Region:        envOrDefault("S3_REGION", defaultS3Region),
		UpstreamGateway: envOrDefault("UPSTREAM_GATEWAY", defaultUpstreamGateway),
		MaxWidth:        maxWidth,
	}

	if cfg.S3Bucket == "" {
		return nil, fmt.Errorf("S3_BUCKET is required")
	}

	return cfg, nil
}

func envOrDefault(name, fallback string) string {
	value := strings.TrimSpace(os.Getenv(name))
	if value == "" {
		return fallback
	}
	return value
}

func loadMaxWidth() (int, error) {
	value := strings.TrimSpace(os.Getenv("MAX_WIDTH"))
	if value == "" {
		return defaultMaxWidth, nil
	}

	maxWidth, err := strconv.Atoi(value)
	if err != nil {
		return 0, fmt.Errorf("MAX_WIDTH must be an integer: %w", err)
	}
	if maxWidth <= 0 {
		return 0, fmt.Errorf("MAX_WIDTH must be greater than zero")
	}

	return maxWidth, nil
}
