#!/bin/bash
echo "Enabling Cloudflare Firewall Rules..."

# Fetch Cloudflare IPv4 ranges
ips=$(curl -s https://www.cloudflare.com/ips-v4)

if [ -z "$ips" ]; then
  echo "Error: Failed to fetch Cloudflare IP ranges. Aborting to prevent lockout."
  exit 1
fi

# Reset incoming ports 80, 443, 3030 to prevent general access
ufw delete allow 80/tcp || true
ufw delete allow 443/tcp || true
ufw delete allow 3030/tcp || true

# Allow Cloudflare IP ranges on ports 80, 443, 3030
for ip in $ips; do
  ufw allow from "$ip" to any port 80 proto tcp
  ufw allow from "$ip" to any port 443 proto tcp
  ufw allow from "$ip" to any port 3030 proto tcp
done

# Ensure your current local controller IP 164.215.14.183 has full access to port 3030 and 22
ufw allow from 164.215.14.183 to any port 3030 proto tcp
ufw allow from 164.215.14.183 to any port 22 proto tcp

# Reload firewall
ufw reload
echo "Cloudflare Firewall Rules successfully applied!"
