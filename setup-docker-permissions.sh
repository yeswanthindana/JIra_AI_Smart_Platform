#!/bin/bash

set -e

echo "======================================================"
echo " Docker Complete Install + Repair + Permissions Setup "
echo "======================================================"

# ------------------------------------------------------
# OS Validation
# ------------------------------------------------------

if [ ! -f /etc/os-release ]; then
    echo "Cannot detect operating system."
    exit 1
fi

source /etc/os-release

echo "Detected OS: $PRETTY_NAME"

# ------------------------------------------------------
# Check Existing Docker Installation
# ------------------------------------------------------

DOCKER_EXISTS=false
DOCKERD_EXISTS=false

if command -v docker >/dev/null 2>&1; then
    DOCKER_EXISTS=true
fi

if command -v dockerd >/dev/null 2>&1; then
    DOCKERD_EXISTS=true
fi

echo ""
echo "Docker CLI Present    : $DOCKER_EXISTS"
echo "Docker Engine Present : $DOCKERD_EXISTS"

# ------------------------------------------------------
# Install/Reinstall Docker if incomplete
# ------------------------------------------------------

if [ "$DOCKER_EXISTS" = false ] || [ "$DOCKERD_EXISTS" = false ]; then

    echo ""
    echo "Docker installation incomplete."
    echo "Installing Docker Engine and related components..."

    sudo apt update

    sudo apt install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release

    # Create keyrings directory
    sudo mkdir -p /etc/apt/keyrings

    # Remove old/corrupted docker key if exists
    sudo rm -f /etc/apt/keyrings/docker.gpg

    # Add Docker official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
        sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    # Add Docker repository
    echo \
      "deb [arch=$(dpkg --print-architecture) \
      signed-by=/etc/apt/keyrings/docker.gpg] \
      https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    sudo apt update

    # Install complete Docker stack
    sudo apt install -y \
        docker-ce \
        docker-ce-cli \
        containerd.io \
        docker-buildx-plugin \
        docker-compose-plugin

    echo ""
    echo "Docker installation completed."

else
    echo ""
    echo "Docker CLI and Engine already installed."
fi

# ------------------------------------------------------
# Verify Docker Engine
# ------------------------------------------------------

if ! command -v dockerd >/dev/null 2>&1; then
    echo ""
    echo "ERROR: dockerd still missing after installation."
    exit 1
fi

echo ""
echo "Docker Engine verified successfully."

# ------------------------------------------------------
# Create Docker Group if Missing
# ------------------------------------------------------

if getent group docker >/dev/null 2>&1; then
    echo ""
    echo "Docker group already exists."
else
    echo ""
    echo "Creating docker group..."
    sudo groupadd docker
    echo "Docker group created."
fi

# ------------------------------------------------------
# Add User to Docker Group
# ------------------------------------------------------

echo ""
echo "Adding user '$USER' to docker group..."

sudo usermod -aG docker $USER

echo "User added successfully."

# ------------------------------------------------------
# Enable Docker Service
# ------------------------------------------------------

echo ""
echo "Enabling Docker service..."

sudo systemctl enable docker

echo ""
echo "Starting Docker service..."

sudo systemctl start docker

# ------------------------------------------------------
# Verify Docker Service
# ------------------------------------------------------

echo ""
echo "Checking Docker service status..."

if systemctl is-active --quiet docker; then
    echo "Docker service is RUNNING."
else
    echo "Docker service failed to start."
    sudo systemctl status docker --no-pager
    exit 1
fi

# ------------------------------------------------------
# Verify Docker Compose
# ------------------------------------------------------

echo ""
echo "Checking Docker Compose..."

docker compose version

# ------------------------------------------------------
# Refresh Group Permissions
# ------------------------------------------------------

echo ""
echo "Refreshing docker group permissions..."

if groups "$USER" | grep -q docker; then
    echo "User already belongs to docker group."
else
    echo "Docker group not active yet in current session."
fi

# ------------------------------------------------------
# Apply newgrp Automatically
# ------------------------------------------------------

echo ""
echo "Attempting to activate docker group..."

newgrp docker <<EONG

echo ""
echo "Inside refreshed docker group session."

echo ""
echo "Testing Docker access..."

if docker ps >/dev/null 2>&1; then

    echo ""
    echo "Docker access verified successfully."

    echo ""
    echo "======================================================"
    echo " Docker Setup Completed Successfully"
    echo "======================================================"

    echo ""
    echo "You can now run:"
    echo ""
    echo "    docker compose up -d"
    echo ""

else

    echo ""
    echo "Docker permission still not active."

    echo ""
    echo "Please logout/login OR reboot once."

    echo ""
    echo "Then verify using:"
    echo ""
    echo "    docker ps"
    echo ""

fi

EONG