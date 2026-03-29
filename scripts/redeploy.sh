#!/usr/bin/env bash
# Совместимость со старыми инструкциями: тот же сценарий, что deploy-production.sh
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/deploy-production.sh"
