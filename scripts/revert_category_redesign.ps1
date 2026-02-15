# Revert Category Redesign
Write-Host "🔄 [Revert] Inciando reversão das mudanças de categoria..." -ForegroundColor Cyan

$basePath = "c:\Users\HENRI\Desktop\dona-capivara-app-main\dona-capivara-app"

# Restaurar backups
Copy-Item "$basePath\components\views\HomeView.bak.tsx" "$basePath\components\views\HomeView.tsx" -Force
Copy-Item "$basePath\services\api.bak.ts" "$basePath\services\api.ts" -Force
Copy-Item "$basePath\services\supabase.bak.ts" "$basePath\services\supabase.ts" -Force

# Remover novo componente
if (Test-Path "$basePath\components\home\CategoryGrid.tsx") {
    Remove-Item "$basePath\components\home\CategoryGrid.tsx" -Force
}

Write-Host "✅ [Revert] Reversão concluída com sucesso! Os arquivos originais foram restaurados." -ForegroundColor Green
