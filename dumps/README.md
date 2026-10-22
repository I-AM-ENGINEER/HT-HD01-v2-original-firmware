# Flash dumps

Byte-for-byte copies of the stock 32 MB SPI NOR, taken read-only from a running
device with `dd` and verified against the device's `sha256sum`.

| File | Size | MTD | Offset | Description |
|---|---:|---|---:|---|
| `mtd0-u-boot.bin` | 192 KiB | mtd0 | `0x00000000` | Ralink/MediaTek U-Boot 1.1.3 |
| `mtd1-u-boot-env.bin` | 64 KiB | mtd1 | `0x00030000` | env; payload at +`0x8000` |
| `mtd2-factory.bin` | 64 KiB | mtd2 | `0x00040000` | factory MAC/calibration |
| `mtd3-firmware.bin` | 31.7 MiB | mtd3 | `0x00050000` | full kernel+rootfs |
| `mtd4-kernel.bin` | 2.49 MiB | mtd4 | nested | uImage kernel |
| `mtd5-rootfs.bin` | 29.2 MiB | mtd5 | nested | squashfs rootfs |
| `mtd6-rootfs_data.bin` | 2.75 MiB | mtd6 | nested | jffs2 overlay |
| `full-flash-32mb.bin` | 32 MiB | — | — | mtd0+mtd1+mtd2+mtd3 (33554432 bytes) |

mtd4–mtd6 are nested inside mtd3; writing mtd3 restores kernel+rootfs together.

## Verify

```bash
sha256sum -c SHA256SUMS.txt
stat -c '%s' full-flash-32mb.bin   # 33554432
```

## Warning

These are **unmodified** vendor images from a specific device. They contain
device-unique secrets (SSH host keys, DPP keys, password hashes, factory MAC).
Do not deploy them on another device. See
[`../docs/legal-and-privacy.md`](../docs/legal-and-privacy.md).

## Restore

See [`../docs/recovery.md`](../docs/recovery.md). Short version:

- live OpenWrt: `mtd write mtd3-firmware.bin firmware`
- U-Boot: TFTP menu option 2 with `mtd3-firmware.bin`
- external programmer: `full-flash-32mb.bin`
