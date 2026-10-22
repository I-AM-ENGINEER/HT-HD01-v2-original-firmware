#!/bin/bash
# Build a publishable (sanitized) extraction of a stock rootfs.
#
# Usage: sanitize-rootfs.sh <source-rootfs-dir> <repo-dir>
# Run from Linux/WSL (preserves symlinks).
set -euo pipefail

SRC="${1:?source rootfs dir}"
REPO="${2:?repo dir}"
TMP="$(mktemp -d /tmp/ht-hd01-rootfs.XXXXXX)"
trap 'rm -rf "$TMP"' EXIT

cp -a "$SRC/." "$TMP/"
cd "$TMP"

# Device-unique secrets / private keys.
rm -rf etc/dropbear etc/dppd etc/radius etc/ssl/private root/.ssh
rm -f etc/shadow etc/config/rpcd etc/config/wireless.bak etc/config/network.bak
find etc/openvpn -type f \( -name '*.key' -o -name '*.pem' -o -name '*.crt' \) \
	-delete 2>/dev/null || true

# Redact device identifiers: hostnames of the form HT-HD01-XXXX and MACs.
grep -rlI -E 'HT-HD01-[0-9A-Fa-f]{4}|([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}' etc 2>/dev/null |
while read -r f; do
	sed -i -E \
		-e 's/HT-HD01-[0-9A-Fa-f]{4}/HT-HD01-XXXX/g' \
		-e 's/([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}/00:11:22:33:44:55/g' \
		"$f"
done

# Redact UCI secret values (keeps the option names and file structure).
grep -rlI -E "option (key|password|secret|default_wifi_key)[[:space:]]+'" etc/config 2>/dev/null |
while read -r f; do
	sed -i -E \
		"s/(option (key|password|secret|default_wifi_key)[[:space:]]+')[^']*'/\1CHANGEME'/" \
		"$f"
done

rm -rf "$REPO/rootfs"
mkdir -p "$REPO/rootfs"
cp -a "$TMP/." "$REPO/rootfs/"
find . -printf '%M %u %g %s %p -> %l\n' > "$REPO/unpacked/rootfs-tree.txt"

# Sanitize the live UCI configs fetched separately from the running device.
if [ -d "$REPO/unpacked/live-configs" ]; then
	for f in "$REPO/unpacked/live-configs"/*; do
		[ -f "$f" ] || continue
		sed -i -E \
			-e 's/HT-HD01-[0-9A-Fa-f]{4}/HT-HD01-XXXX/g' \
			-e 's/([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}/00:11:22:33:44:55/g' \
			-e "s/(option (key|password|secret|default_wifi_key)[[:space:]]+')[^']*'/\1CHANGEME'/g" \
			"$f"
	done
fi

echo "sanitized rootfs written to $REPO/rootfs"
