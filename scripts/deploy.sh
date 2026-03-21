#!/bin/bash
# ============================================================
# deploy.sh — Deploy rmora-website a producción
# Ejecutar desde la raíz del proyecto: bash scripts/deploy.sh
# ============================================================

set -e  # Detener si hay error

SERVER="romora@89.116.51.101"
REMOTE_DIR="/home/romora/rmora-website"

echo ""
echo "══════════════════════════════════════════════════"
echo "  rmora-website — Deploy a producción"
echo "══════════════════════════════════════════════════"

# ─── 1. Build ─────────────────────────────────────────────
echo ""
echo "▶ Paso 1/4: Build del proyecto..."
npm run build
echo "  ✓ Build completado"

# ─── 2. Sync código al servidor ───────────────────────────
echo ""
echo "▶ Paso 2/4: Transfiriendo archivos al servidor..."
rsync -avz --delete \
  --exclude='node_modules' \
  --exclude='.env' \
  --exclude='.env.production' \
  --exclude='client/node_modules' \
  --exclude='server/node_modules' \
  --exclude='.git' \
  --exclude='Imagenes' \
  --exclude='Requerimientos' \
  --exclude='Textos' \
  --exclude='scripts/deploy.sh' \
  . "$SERVER:$REMOTE_DIR/"

# Copiar .env.production como .env en servidor
scp .env.production "$SERVER:$REMOTE_DIR/.env"
echo "  ✓ Archivos transferidos"

# ─── 3. Instalar dependencias en servidor ─────────────────
echo ""
echo "▶ Paso 3/4: Instalando dependencias en servidor..."
ssh "$SERVER" bash << 'ENDSSH'
  set -e
  cd /home/romora/rmora-website
  npm install --workspaces --include-workspace-root
  echo "  ✓ Dependencias instaladas"
ENDSSH

# ─── 4. Reiniciar con PM2 ─────────────────────────────────
echo ""
echo "▶ Paso 4/4: Reiniciando servidor con PM2..."
ssh "$SERVER" bash << 'ENDSSH'
  set -e
  cd /home/romora/rmora-website
  pm2 restart rmora-website 2>/dev/null || \
    pm2 start "node server/dist/index.js" \
      --name rmora-website \
      --cwd /home/romora/rmora-website \
      --env production
  pm2 save
  echo "  ✓ PM2 reiniciado"
ENDSSH

echo ""
echo "══════════════════════════════════════════════════"
echo "  ✅ Deploy completado"
echo "══════════════════════════════════════════════════"
echo ""
