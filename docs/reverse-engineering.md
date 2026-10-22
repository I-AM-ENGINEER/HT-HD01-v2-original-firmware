# Reverse-engineering notes

## Access

- UART0: 115200 8N1, USB-TTL serial console. U-Boot menu and Linux console.
- SSH: `root@<device>`; the vendor default password is redacted here.
- LuCI: `http://<device>/` (default LAN `10.42.0.1`).

## What was collected

All operations on the device were **read-only** except for normal service
operation. The flash was dumped with `dd`; hashes were compared with the
device-side `sha256sum`.

```sh
uname -a
cat /etc/openwrt_release
cat /proc/cpuinfo /proc/meminfo /proc/cmdline /proc/mtd /proc/partitions
cat /proc/device-tree/model /proc/device-tree/compatible
ubus call system board
ubus call system info
dmesg
lsmod
opkg list-installed
ip -o addr; ip route
cat /etc/board.json /etc/config/network /etc/config/wireless
```

Dumps:

```sh
for spec in "0 u-boot" "1 u-boot-env" "2 factory" "3 firmware" \
            "4 kernel" "5 rootfs" "6 rootfs_data"; do
    set -- $spec
    dd if=/dev/mtd$1 bs=65536 of=/tmp/mtd$1-$2.bin
done
sha256sum /dev/mtd0 ... /dev/mtd6
```

Config backup:

```sh
sysupgrade -b /tmp/sysupgrade-backup.tar.gz
tar -C / -czf - etc
tar -C / -czf - overlay
tar -C / -czf - lib/firmware
```

## Analysis of the binaries

- `unsquashfs` on `mtd5-rootfs.bin` → rootfs tree.
- `dtc -I dtb -O dts live.dtb` → live device tree (from `/sys/firmware/fdt`).
- `strings -t x mtd0-u-boot.bin` → U-Boot menu, defaults, recovery strings.
- `strings mtd1-u-boot-env.bin` → env contents (`rebootcnt=0`).
- `xxd -l 64 mtd4-kernel.bin` → uImage header (load 0x80000000, LZMA).
- Compare U-Boot strings with the Ralink SDK source
  (`swiftgeek/ralink-uboot`, `lib_mips/board.c`).
- Compare the board DTS with Morse Micro's OpenWrt
  (`target/linux/ramips/dts/mt7628an_morse_ekh03.dtsi`).

See [`../bootloader/uboot-analysis.md`](../bootloader/uboot-analysis.md) and
[`../bootloader/uboot-menu-strings.txt`](../bootloader/uboot-menu-strings.txt).

## Key findings

- Board: Heltec HT-HD01-V2, `morse,ekh03v3`, HLK-7628N module.
- 128 MB RAM, 32 MB W25Q256, MM6108 HaLow over SDIO, SR9900 USB Ethernet.
- U-Boot 1.1.3 with a 10 s menu; timeout boots flash **without initializing
  Ethernet**.
- Kernel 5.15.167, squashfs + jffs2 overlay, mtdsplit uImage.
- No dual-image/rollback; `r` resets only the overlay.
- OpenWrt 23.05.5 vendor build; 413 packages; HaLow/Morse stack integrated.
- HaLow firmware `mm6108.bin`, BCF `bcf_HD01_v2.bin`, driver 1.15.3.
- Boot is slow: 10 s menu + ~20–23 s kernel/HaLow init.

## Reproducing the extraction

```bash
# rootfs
unsquashfs -d rootfs dumps/mtd5-rootfs.bin

# device tree
dtc -I dtb -O dts -o live.dts unpacked/device-tree/live.dtb

# U-Boot menu
strings -t x dumps/mtd0-u-boot.bin | grep -iE 'TFTP|Flash|Reset|IP|kernel'

# kernel header
xxd -l 64 dumps/mtd4-kernel.bin
```

The sanitized rootfs tree was produced by
[`../tools/sanitize-rootfs.sh`](../tools/sanitize-rootfs.sh); see
[`sanitization.md`](sanitization.md).

## Open questions

- FGH100M-H datasheet/pinout.
- SR9900 role: USB-C data, USB Ethernet gadget, or alternative BOM.
- Exact `ekh03v3` DTS (Morse HEAD has shared `ekh03.dtsi` + v4).
- UART test pad/header location inside the case.
- Whether the SR9900 is driven by a vendor kernel module absent from the
  captured boot.
