# 🧹 SCRIPT DE LIMPEZA AUTOMÁTICA - DONA CAPIVARA APP
# Executa as otimizações de PRIORIDADE ALTA identificadas na análise

Write-Host "🔍 INICIANDO LIMPEZA DO PROJETO..." -ForegroundColor Cyan
Write-Host ""

# Contador de arquivos removidos
$removedCount = 0
$totalSizeSaved = 0

# Função para remover arquivo com segurança
function Remove-SafeFile {
    param($path, $description)
    
    if (Test-Path $path) {
        $size = (Get-Item $path).Length
        Remove-Item $path -Force
        Write-Host "✅ REMOVIDO: $description" -ForegroundColor Green
        Write-Host "   Tamanho: $($size) bytes" -ForegroundColor Gray
        $script:removedCount++
        $script:totalSizeSaved += $size
    } else {
        Write-Host "⚠️  NÃO ENCONTRADO: $description" -ForegroundColor Yellow
    }
}

Write-Host "📋 FASE 1: Removendo CSS Modules não utilizados..." -ForegroundColor Yellow
Write-Host ""

Remove-SafeFile "app\page.module.css" "app/page.module.css (não utilizado)"
Remove-SafeFile "components\ProductCard.module.css" "components/ProductCard.module.css (não utilizado)"

Write-Host ""
Write-Host "📋 FASE 2: Removendo Manifests duplicados..." -ForegroundColor Yellow
Write-Host ""

Remove-SafeFile "public\icons\manifest.json" "public/icons/manifest.json (duplicado)"

Write-Host ""
Write-Host "📋 FASE 3: Removendo documentação de produção..." -ForegroundColor Yellow
Write-Host ""

Remove-SafeFile "components\common\BANNER_CAROUSEL_GUIDE.md" "BANNER_CAROUSEL_GUIDE.md"
Remove-SafeFile "components\common\INTEGRACAO_COMPLETA.md" "INTEGRACAO_COMPLETA.md"

Write-Host ""
Write-Host "📋 FASE 4: Criando backup da pasta docs..." -ForegroundColor Yellow
Write-Host ""

if (Test-Path "docs") {
    $backupPath = "..\dona-capivara-documentation"
    
    if (-not (Test-Path $backupPath)) {
        New-Item -ItemType Directory -Path $backupPath | Out-Null
        Write-Host "✅ CRIADO: Pasta de backup em $backupPath" -ForegroundColor Green
    }
    
    Copy-Item -Path "docs\*" -Destination $backupPath -Recurse -Force
    Write-Host "✅ BACKUP: Documentação copiada para $backupPath" -ForegroundColor Green
    
    # Remover pasta docs original
    $docsSize = (Get-ChildItem "docs" -Recurse | Measure-Object -Property Length -Sum).Sum
    Remove-Item "docs" -Recurse -Force
    Write-Host "✅ REMOVIDO: Pasta docs/ do projeto" -ForegroundColor Green
    $script:totalSizeSaved += $docsSize
    $script:removedCount += 7
} else {
    Write-Host "⚠️  Pasta docs/ não encontrada" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "✨ LIMPEZA CONCLUÍDA!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 ESTATÍSTICAS:" -ForegroundColor Cyan
Write-Host "   Arquivos removidos: $removedCount" -ForegroundColor White
Write-Host "   Espaço economizado: $([math]::Round($totalSizeSaved / 1KB, 2)) KB" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "   1. Revisar mudanças com 'git status'" -ForegroundColor White
Write-Host "   2. Testar aplicação com 'npm run dev'" -ForegroundColor White
Write-Host "   3. Executar build com 'npm run build'" -ForegroundColor White
Write-Host "   4. Se tudo OK, commit as mudanças" -ForegroundColor White
Write-Host ""
