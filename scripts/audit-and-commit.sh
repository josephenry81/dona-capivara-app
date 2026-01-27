#!/usr/bin/env bash
set -euo pipefail

# 1) Chama Antigravity para auditoria automática (ajuste comando conforme seu CLI)
# antigravity command "Audite o repositório Dona Capivara: encontre erros, aplique correções automáticas quando seguro."

# 2) Lint + format (garante correções locais)
npm run lint:fix || true
npm run format || true

# 3) Stage mudanças feitas por linters/formatters
git add -A

# 4) Typecheck e testes
npm run typecheck
npm test -- --ci

# 5) Se tudo ok, exit 0 (Husky permite o commit). Se falhar, o script já aborta por set -e.
