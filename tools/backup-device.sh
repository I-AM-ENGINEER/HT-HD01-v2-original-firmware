#!/bin/sh
# Dump the HT-HD01-V2 flash over SSH and verify the hashes.
#
# Usage: backup-device.sh <user@host> <output-dir>
# Requires ssh access (key-based, or sshpass configured outside this script).
set -eu

HOST="${1:?usage: $0 user@host output-dir}"
OUT="${2:?usage: $0 user@host output-dir}"
mkdir -p "$OUT"

for spec in \
	"0 u-boot" \
	"1 u-boot-env" \
	"2 factory" \
	"3 firmware" \
	"4 kernel" \
	"5 rootfs" \
	"6 rootfs_data"
do
	set -- $spec
	i="$1"
	name="$2"
	echo ">> mtd$i ($name)"
	ssh "$HOST" "dd if=/dev/mtd$i bs=65536 2>/dev/null" \
		> "$OUT/mtd$i-$name.bin"
done

echo ">> hashes"
ssh "$HOST" "sha256sum /dev/mtd0 /dev/mtd1 /dev/mtd2 /dev/mtd3 /dev/mtd4 /dev/mtd5 /dev/mtd6" \
	> "$OUT/remote.sha256"
(cd "$OUT" && sha256sum mtd*.bin > SHA256SUMS.txt)

echo ">> config backup (contains secrets; keep private)"
ssh "$HOST" "sysupgrade -b /tmp/sysupgrade-backup.tar.gz >/dev/null 2>&1; \
	cat /tmp/sysupgrade-backup.tar.gz; rm -f /tmp/sysupgrade-backup.tar.gz" \
	> "$OUT/sysupgrade-backup.tar.gz"

echo ">> verify the local dumps against remote.sha256"
echo "   cd $OUT && sha256sum -c SHA256SUMS.txt"
