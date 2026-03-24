#!/bin/bash
# ============================================================
# deploy.sh — Deploy rmora-website a producción
# Ejecutar desde la raíz del proyecto: bash scripts/deploy.sh
# ============================================================

set -e  # Detener si hay error

SERVER="romora@89.116.51.101"
REMOTE_DIR="/home/romora/htdocs/rmora.org"
SSH_KEY="/home/romora/claves_VPS/id_ed25519_VPS"
SSH_PORT="47031"
SSH_OPTS="-p $SSH_PORT -i $SSH_KEY -o StrictHostKeyChecking=accept-new"

# Agregar clave al agente (pide passphrase una sola vez)
eval "$(ssh-agent -s)" > /dev/null
ssh-add "$SSH_KEY"

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
rsync -avz --delete -e "ssh $SSH_OPTS" \
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
scp $SSH_OPTS .env.production "$SERVER:$REMOTE_DIR/.env"
echo "  ✓ Archivos transferidos"

# ─── 3. Instalar dependencias en servidor ─────────────────
echo ""
echo "▶ Paso 3/4: Instalando dependencias en servidor..."
ssh $SSH_OPTS "$SERVER" bash << 'ENDSSH'
  set -e
  cd /home/romora/htdocs/rmora.org
  npm install --workspaces --include-workspace-root --omit=dev
  echo "  ✓ Dependencias instaladas"
ENDSSH

# ─── 4. Reiniciar con PM2 ─────────────────────────────────
echo ""
echo "▶ Paso 4/4: Reiniciando servidor con PM2..."
ssh $SSH_OPTS "$SERVER" bash << 'ENDSSH'
  set -e
  cd /home/romora/htdocs/rmora.org
  pm2 restart rmora-website 2>/dev/null || \
    pm2 start server/dist/index.js \
      --name rmora-website \
      --cwd /home/romora/htdocs/rmora.org
  pm2 save
  echo "  ✓ PM2 reiniciado"
ENDSSH

echo ""
echo "══════════════════════════════════════════════════"
echo "  ✅ Deploy completado"
echo "══════════════════════════════════════════════════"
echo ""
