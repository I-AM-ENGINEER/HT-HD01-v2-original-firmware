# Porting an open firmware

The goal: a minimal, reproducible open firmware for the HT-HD01-V2, initially
without HaLow, while keeping the stock bootloader and recovery path.

## Constraints

- **32 MB flash**: kernel ~2.5 MB, rootfs budget ~25 MB. Use **squashfs +
  overlay** (jffs2/UBI) rather than a full ext4 partition.
- **128 MB RAM**: comfortable for a minimal Python/Reticulum stack.
- **MIPS 24KEc, little-endian** (`mipsel_24kc`), soft-float.
- **HaLow driver is out-of-tree** (`morse`/`dot11ah` + MM6108 firmware/BCF).
  Mainline Linux does not have it; keep HaLow as a later phase on the vendor
  kernel/OpenWrt, or port the driver separately.
- **Kexec is disabled** in the stock kernel (`# CONFIG_KEXEC is not set`), so
  new kernels must be tested via U-Boot TFTP-to-RAM, not from the running OS.
- **No dual-image/rollback**; always keep a UART + TFTP recovery path.

## Two viable paths

### A. OpenWrt-based (lowest risk)

Keep the vendor kernel/U-Boot/HaLow and add only the open userspace:

- build `rnsbox-portal` (C++ CGI) for `mipsel_24kc`;
- add Python 3 + RNS (+ LXMF/NomadNet);
- add init scripts and configs;
- optionally rebuild a minimal OpenWrt image with the vendor target.

Pros: HaLow works immediately, hardware support is preserved. Cons: not a pure
Buildroot image; tied to the vendor kernel.

### B. Buildroot/mainline (clean open firmware)

- Toolchain: Buildroot `mipsel`, MIPS32r2, soft-float, musl or glibc.
- Kernel: mainline Linux has MT7628AN support. Use the live DTS plus the Morse
  EKH03 DTSI as the base; keep UART0, SPI NOR, Ethernet switch, GPIO/LED;
  disable HaLow/2.4 GHz for the first image.
- Boot: an initramfs uImage for the first TFTP tests.
- Rootfs: squashfs + overlay. If you keep the stock U-Boot and firmware
  layout, either carry the OpenWrt `mtdsplit` patches or define fixed,
  erase-block-aligned partitions.
- rnsbox integration: add `configs/boards/ht_hd01.config`,
  `board/heltec/ht-hd01/` (linux fragment, DTS, post-build, rootfs overlay,
  genimage), a `build.sh` board branch, and regenerate the defconfig with
  `scripts/gen-defconfigs.sh`.

## Recommended sequence

1. **UART + TFTP-to-RAM**: build a minimal BusyBox/initramfs uImage for MIPS
   24KEc with a DTS based on `unpacked/device-tree/live.dts`. Verify UART,
   SPI flash, Ethernet and the MAC from `factory`.
2. **Minimal userspace**: Python + RNS + portal; test from RAM or a chroot on
   the vendor system.
3. **Persistent image**: squashfs + overlay, flashed only after the RAM tests
   are stable.
4. **HaLow (optional/later)**: reuse the vendor kernel/OpenWrt stack or port
   the Morse driver.

## DTS starting point

The live tree is `unpacked/device-tree/live.dts`. Vendor references:

- `vendor/morse-dts/morse-mt7628an_morse_ekh03.dtsi`
- `vendor/morse-dts/morse-mt7628an_morse_ekh03v4.dts`

The live board is `morse,ekh03v3`; the v4 DTS is the closest published source.
Key nodes:

- `palmbus@10000000/spi@b00` — W25Q256 and partitions;
- `uartlite@c00` — UART0 console;
- `ethernet@10100000` / `esw@10110000` — MT7628 MAC/switch;
- `mmc@10130000` — SDIO MM6108 (disable for the minimal image);
- `ehci@101c0000` / `ohci@101c1000` — USB host (SR9900 role TBD);
- `wmac@10300000` — integrated 2.4 GHz (optional);
- `leds`, `gpio` — status LED and board GPIOs.

## Useful config facts

From the stock kernel (`/proc/config.gz`):

```
CONFIG_MTD_SPLIT=y
CONFIG_MTD_SPLIT_UIMAGE_FW=y
CONFIG_MTD_SPLIT_SQUASHFS_ROOT=y
# CONFIG_MTD_UBI is not set
# CONFIG_KEXEC is not set
```

The stock rootfs is squashfs; the overlay is jffs2 on a 2.75 MB partition.

## Open questions

- SR9900 driver/role in an open firmware.
- FGH100M-H/MM6108 driver port to mainline (later).
- Exact v3 DTS and any board-specific GPIO (reset, LED, antenna select).
- Flash budget after adding Python/RNS/portal; measure the squashfs size.
- Whether to keep the vendor U-Boot or replace it (keep it initially; it
  provides TFTP recovery).

## rnsbox note

The author's [`rnsbox`](https://github.com/I-AM-ENGINEER/rnsbox) Buildroot
external tree is a natural consumer of this port: the HT-HD01-V2 can become a
new board with a 32 MB squashfs image, no HaLow in the first revision, and
UART/TFTP as the test path.
