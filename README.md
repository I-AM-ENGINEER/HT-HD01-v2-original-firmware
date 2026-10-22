# HT-HD01-V2 — original firmware & open hardware notes

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Reverse-engineering, firmware-preservation and open-hardware documentation for
the **Heltec HT-HD01-V2** Wi-Fi HaLow device (Morse Micro EKH03 v3 platform).

The vendor does not publish source code, schematics or a flashing/recovery
manual. This repository preserves the stock firmware, documents the hardware
and boot chain, and collects everything needed to build an open firmware for
the board.

> **Status:** research / preservation. Not affiliated with Heltec, Hi-Link,
> Morse Micro or CoreChips. Use at your own risk.

## Device at a glance

| Item | Value |
|---|---|
| Model | Heltec HT-HD01-V2 (DT compatible `morse,ekh03v3`) |
| Main module | **HLK-7628N** (Hi-Link, MediaTek MT7628N) |
| SoC | MediaTek MT7628AN, MIPS 24KEc, little-endian (`mipsel_24kc`) |
| RAM | 128 MB DDR2 |
| Flash | 32 MB SPI NOR, Winbond **W25Q256** |
| HaLow | **FGH100M-H** module, Morse Micro **MM6108** over SDIO |
| USB Ethernet | **SR9900** USB 2.0 10/100 bridge, switch port 2 ↔ USB-C (HLK-7628N does not expose USB) |
| 2.4 GHz | integrated MT7628 WMAC (`mt76` / `mt7603e` driver) |
| Ethernet | 1× RJ45 10/100, MT7628 switch port 0 |
| USB | USB-C (power; data role to be confirmed) |
| Console | UART0, 115200 8N1 (USB-TTL; host port varies) |
| Bootloader | Ralink/MediaTek **U-Boot 1.1.3** |
| Firmware | OpenWrt **23.05.5**, vendor build `r0+24271-bc42a5ccf5` |
| Default OS | Linux **5.15.167**, squashfs + jffs2 overlay |

## Repository layout

```
.
├── dumps/                 full flash dumps + full 32 MB image + SHA256SUMS
├── rootfs/                unpacked sanitized rootfs tree
├── unpacked/              analysis extras: live configs, DTS, package list, dmesg
├── bootloader/            U-Boot analysis and menu strings
├── vendor/                vendor DTS files and source links
├── docs/                  hardware, boot, recovery, porting, legal notes
└── tools/                 backup / extract / sanitize helpers
```

## Quick start

```bash
# 1. Verify the preserved images
cd dumps && sha256sum -c SHA256SUMS.txt

# 2. Extract the stock rootfs (Linux/WSL)
unsquashfs -d rootfs ../dumps/mtd5-rootfs.bin

# 3. Read the sanitized extraction without unpacking
ls rootfs/
```

For the UART/TFTP test procedure see [`docs/uart-console.md`](docs/uart-console.md)
and [`docs/recovery.md`](docs/recovery.md).

## What is documented

- Complete **32 MB flash layout** and the U-Boot/kernel/rootfs boot chain.
- **U-Boot menu**, TFTP-to-RAM boot (no flash writes), and why it needs UART.
- How to **back up and restore** every MTD partition, including a full image
  for an external SPI programmer.
- Stock **OpenWrt system**, network/HaLow configuration, services and packages.
- **Reverse-engineering methodology** and sanitized configuration files.
- **Porting notes** for a minimal open firmware (Buildroot/OpenWrt, MT7628N,
  squashfs + overlay, HaLow as a later step).
- **Legal and privacy** notes for publishing vendor firmware.

## Open questions / help wanted

- Datasheet or pinout of **FGH100M-H** (HaLow module).
- SR9900 exact variant/datasheet and USB-C CC/data wiring.
- Board photos, PCB traces, chip markings.
- Exact `ekh03v3` DTS (Morse Micro HEAD only has the shared EKH03 DTSI + v4).
- Whether the U-Boot menu/debug UART is exposed on a test pad or header.

## Safety

The raw dumps are **byte-for-byte vendor firmware** and contain device-unique
material: dropbear host keys, DPP keys, password hashes and factory MAC data.
Do not deploy the dumps on another device and do not expose a device running
the stock image to an untrusted network. The `rootfs/` tree is sanitized and
is **not bootable**; read [`docs/sanitization.md`](docs/sanitization.md).

Flashing without UART recovery can brick the board: the stock U-Boot has no
dual-image/rollback, and its `r: Reset firmware to first boot` only erases the
overlay. Read [`docs/recovery.md`](docs/recovery.md) first.

## Contributing

Photos, datasheets, DTS work, driver notes and test reports are welcome. Open
an issue with what you have; please **do not** include personal data, MAC
addresses, private keys or passwords.

## License

The original documentation and tools in this repository are released under the
**MIT License** (see `LICENSE`; vendor firmware notice in `LICENSE-FIRMWARE.md`). The preserved firmware images and vendor
blobs remain the property of their respective owners and are provided for
interoperability, research and preservation; see
[`docs/legal-and-privacy.md`](docs/legal-and-privacy.md).

---

Русская краткая версия: [`README.ru.md`](README.ru.md).
