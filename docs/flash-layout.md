# Flash layout

The board has a single **32 MB Winbond W25Q256** SPI NOR. The stock DTS uses
fixed partitions and the OpenWrt `denx,uimage` splitter for kernel/rootfs.

| MTD | Offset | Size | Erase block | Name | Content |
|---|---:|---:|---:|---|---|
| mtd0 | `0x00000000` | `0x00030000` (192 KiB) | 64 KiB | `u-boot` | Ralink/MediaTek U-Boot 1.1.3 |
| mtd1 | `0x00030000` | `0x00010000` (64 KiB) | 64 KiB | `u-boot-env` | env/data; useful env at +`0x8000` |
| mtd2 | `0x00040000` | `0x00010000` (64 KiB) | 64 KiB | `factory` | MAC at `0x28`, calibration |
| mtd3 | `0x00050000` | `0x01FB0000` (31.7 MiB) | 64 KiB | `firmware` | `denx,uimage` = kernel + rootfs |
| mtd4 | mtd3 +`0x0` | `0x0027CC61` (2.49 MiB) | — | `kernel` | uImage, load/entry `0x80000000` |
| mtd5 | mtd3 +`0x27CC61` | `0x01D3339F` (29.2 MiB) | — | `rootfs` | squashfs, read-only |
| mtd6 | mtd3 +`0x1CF0000` | `0x002C0000` (2.75 MiB) | 64 KiB | `rootfs_data` | jffs2 overlay |

Notes:

- mtd4/mtd5/mtd6 are **nested inside mtd3**; dumping mtd3 preserves the whole
  firmware. mtd4–mtd6 are exposed by the kernel's `mtdsplit` for convenience.
- The kernel partition does not start/end on erase-block boundaries; the kernel
  forces those sub-partitions read-only.
- The squashfs `rootfs` is split again to expose the writable `rootfs_data`
  overlay (2.75 MiB).
- The U-Boot environment is **not** at the start of mtd1: the payload starts at
  mtd1 +`0x8000`, 8 KiB, magic `dd ae 51 b5`, currently only `rebootcnt=0`.
  `fw_printenv` needs a config with the right sector size; the vendor does not
  ship one, so the raw dump is the authoritative copy.

## Dumping

On a running system:

```sh
for spec in "0 u-boot" "1 u-boot-env" "2 factory" "3 firmware" \
            "4 kernel" "5 rootfs" "6 rootfs_data"; do
    set -- $spec
    dd if=/dev/mtd$1 bs=65536 of=/tmp/mtd$1-$2.bin
done
sha256sum /dev/mtd0 /dev/mtd1 /dev/mtd2 /dev/mtd3 /dev/mtd4 /dev/mtd5 /dev/mtd6
```

Full image for an external programmer:

```sh
cat mtd0-u-boot.bin mtd1-u-boot-env.bin mtd2-factory.bin mtd3-firmware.bin \
    > full-flash-32mb.bin
```

The result must be exactly 33554432 bytes. See `dumps/SHA256SUMS.txt`.

## Kernel image

The stock kernel is a U-Boot uImage:

- magic `0x27051956`
- data size `0x27CC21`
- load/entry `0x80000000`
- OS: Linux, arch: MIPS, type: kernel, compression: LZMA
- name: `MIPS OpenWrt Linux-5.15.167`

## Why the split matters for porting

The stock kernel has:

```
CONFIG_MTD_SPLIT=y
CONFIG_MTD_SPLIT_UIMAGE_FW=y
CONFIG_MTD_SPLIT_SQUASHFS_ROOT=y
```

Mainline Linux does not. A Buildroot/mainline port must either:

1. carry equivalent `mtdsplit` patches, or
2. define fixed, erase-block-aligned `kernel`/`rootfs`/`rootfs_data`
   partitions in the DTS and flash them accordingly, or
3. boot an **initramfs** image for the first tests (recommended).
