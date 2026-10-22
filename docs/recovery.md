# Recovery

## TL;DR

| Situation | Method |
|---|---|
| OpenWrt still boots | SSH + `mtd write` the needed partition |
| OpenWrt dead, UART available | U-Boot TFTP: RAM test, then flash write |
| OpenWrt dead, no UART | External SPI programmer (CH341A + W25Q256 clip) |
| Only need userspace tests | SSH + `/tmp` (tmpfs), no flash writes |

There is **no dual-image/rollback**. `r: Reset firmware to first boot` only
erases `rootfs_data` (the overlay); it does not restore the kernel/rootfs.

## Verify the backups first

```bash
cd dumps
sha256sum -c SHA256SUMS.txt
```

`full-flash-32mb.bin` must be exactly **33554432** bytes.

## Restore from a running OpenWrt

Copy the needed file to the device (`scp`/`sftp`), then:

```sh
# firmware (kernel + rootfs) — most common
mtd write mtd3-firmware.bin firmware
sync
reboot

# U-Boot env (only if you know why)
mtd write mtd1-u-boot-env.bin u-boot-env

# factory / U-Boot — do NOT do this without UART/programmer recovery
# mtd write mtd2-factory.bin factory
# mtd write mtd0-u-boot.bin u-boot
```

The kernel/rootfs are inside mtd3; writing mtd3 restores both. mtd4–mtd6 are
sub-partitions and should not be written over the parent.

## U-Boot TFTP

### Test without writing flash

1. Connect UART0 (115200 8N1), power-cycle, press a key within 10 s.
2. Choose **1: Load system code to SDRAM via TFTP**.
3. Enter device IP, server IP and `uImage`.
4. The image runs from RAM. If it fails, power-cycle and the stock firmware
   boots.

### Restore firmware by TFTP (writes flash)

1. Serve `mtd3-firmware.bin` (or a known-good vendor image) over TFTP.
2. In the U-Boot menu choose **2: Load system code then write to Flash via
   TFTP**.
3. Confirm the erase prompt (`Y`).
4. The file is written at the firmware offset (`0x50000`).

This overwrites the firmware slot. Make sure the image is valid and the UART
works before starting.

## External SPI programmer

- Flash: **Winbond W25Q256**, 32 MB.
- Programmer: CH341A (3.3 V) with a SOP8/WSON clip matching the package.
- Write `full-flash-32mb.bin` (mtd0–mtd3) or the individual partitions at their
  offsets.
- In-circuit programming can be unreliable because the SoC may drive the SPI
  bus; hold the SoC in reset or lift the flash if needed.
- Verify with `sha256sum` against `dumps/SHA256SUMS.txt`.

## Config restore

`sysupgrade -r sysupgrade-backup.tar.gz` restores the vendor config on a live
system. That archive contains private keys and password hashes; it is **not**
published in this repository. Use the sanitized configs in `unpacked/` as
reference, not as a drop-in restore.

## No-UART userspace test

If you only need to test a new userspace (Reticulum, portal, etc.):

```sh
# from the host
scp -r ./rootfs-test root@<device>:/tmp/
ssh root@<device>
chroot /tmp/rootfs-test /bin/sh
```

`/tmp` is tmpfs (~60 MB); a reboot removes it. The flash and the stock kernel
are untouched. This does not test a new kernel/DTS.
