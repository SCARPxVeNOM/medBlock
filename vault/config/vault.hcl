# Vault Production Configuration

# Storage backend - use Consul or other HA backend in production
storage "file" {
  path = "/vault/data"
}

# Listener for API
listener "tcp" {
  address = "0.0.0.0:8200"
  tls_disable = 1  # Enable TLS in production!
  # tls_cert_file = "/vault/config/cert.pem"
  # tls_key_file  = "/vault/config/key.pem"
}

# API address
api_addr = "http://0.0.0.0:8200"

# UI
ui = true

# Enable audit logging
# audit "file" {
#   file_path = "/vault/logs/audit.log"
# }

# Telemetry for monitoring
telemetry {
  prometheus_retention_time = "30s"
  disable_hostname = false
}

# Disable mlock in container
disable_mlock = true

# Log level
log_level = "info"

