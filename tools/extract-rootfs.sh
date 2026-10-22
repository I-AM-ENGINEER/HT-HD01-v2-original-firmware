#!/bin/sh
# Extract the squashfs rootfs from a flash dump.
#
# Usage: extract-rootfs.sh <mtd5-rootfs.bin> [output-dir]
set -eu

IMG="${1:?usage: $0 mtd5-rootfs.bin [output-dir]}"
OUT="${2:-rootfs}"

unsquashfs -d "$OUT" "$IMG"

echo "extracted to $OUT"
echo "note: the unsanitized tree contains private keys and password hashes"
