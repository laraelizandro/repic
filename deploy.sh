#!/bin/bash
# ═══════════════════════════════════════════════
# REPIC - Deploy automático a Netlify
# Inmobili Internacional
# ═══════════════════════════════════════════════

echo ""
echo "🏠 REPIC - Inmobili Internacional"
echo "══════════════════════════════════"
echo "Instalando y desplegando tu app..."
echo ""

# Verificar si npm existe, si no instalar Node via nvm
if ! command -v npm &> /dev/null; then
    echo "📦 Instalando Node.js..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install 20
fi

echo "📦 Instalando dependencias..."
npm install --silent

echo "🔨 Construyendo la app..."
npm run build

echo "📡 Instalando herramienta de deploy..."
npm install -g netlify-cli --silent

echo ""
echo "🚀 Desplegando a Netlify..."
NETLIFY_AUTH_TOKEN=nfp_PZAyVhRVYBzWeRtqncKH2HvUS5TBsMQs1061 netlify deploy --prod --dir=dist --functions=netlify/functions --site=lambent-trifle-81bca3

echo ""
echo "✅ ¡LISTO! Tu app está en:"
echo "👉 https://lambent-trifle-81bca3.netlify.app"
echo ""
echo "Abre esa URL en Chrome en tu celular"
echo "y dale 'Agregar a pantalla de inicio'"
echo ""
