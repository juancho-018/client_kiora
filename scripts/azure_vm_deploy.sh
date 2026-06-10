#!/bin/bash
# =============================================================================
# Kiora Client - Azure VM Deployment Script
# =============================================================================
# Copia el frontend a la Máquina Virtual y lo levanta con Docker.

set -e

RG_NAME="rg-kiora-vm"
VM_NAME="vm-kiora-backend"
ADMIN_USER="kioraadmin"

echo "Buscando la IP de tu Máquina Virtual en Azure..."
PUBLIC_IP=$(az vm show -d -g "$RG_NAME" -n "$VM_NAME" --query publicIps -o tsv)

if [ -z "$PUBLIC_IP" ]; then
    echo "No se encontró la IP. Asegúrate de correr azure_vm_provision.sh primero en el backend."
    exit 1
fi

echo "IP encontrada: $PUBLIC_IP"
echo ""

# 1. Copiar los archivos a la VM
echo "[1/3] Copiando el proyecto frontend a la Máquina Virtual..."
echo "   (Esto puede tomar unos segundos...)"

# Usamos rsync para copiar todo excepto carpetas pesadas
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' \
  -e "ssh -o StrictHostKeyChecking=no" \
  ./ "$ADMIN_USER@$PUBLIC_IP:~/client_kiora/" > /dev/null

echo "Archivos copiados."

# 2. Construir y levantar
echo "[2/3] Levantando el frontend con Docker Compose..."
ssh -o StrictHostKeyChecking=no "$ADMIN_USER@$PUBLIC_IP" << EOF
  set -e
  cd ~/client_kiora
  
  # Crear archivo .env para el contenedor con la IP dinámica
  echo "PUBLIC_API_URL=http://$PUBLIC_IP:3000/api" > .env
  echo "PUBLIC_KIOSK_URL=http://$PUBLIC_IP:9095" >> .env
  
  sudo docker rm -f kiora_client_app || true
  sudo docker compose down
  sudo docker compose up -d --build
EOF

echo ""
echo "====================================================="
echo "¡DESPLIEGUE DEL KIOSCO COMPLETADO EN LA MÁQUINA VIRTUAL!"
echo "====================================================="
echo ""
echo "Tu Kiosco (Frontend) público:"
echo "   http://$PUBLIC_IP:9095"
echo ""
