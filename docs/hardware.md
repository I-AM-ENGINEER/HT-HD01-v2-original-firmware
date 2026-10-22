# Hardware

## Board

**Heltec HT-HD01-V2** — a Wi-Fi HaLow dongle/gateway in an aluminium case.
The PCB is built around three main parts reported by the owner and confirmed
by the running system:

```
                 +-----------------------------+
   USB-C 5V ---->|  HLK-7628N (MT7628N)        |
   RJ45   <----->|  - MIPS 24KEc, 128 MB RAM   |
   UART0  <----->|  - 32 MB W25Q256 SPI NOR    |
                 |  - 2.4 GHz WMAC             |
                 |  - Ethernet switch/PHY      |
                 |            | SDIO           |
                 |            v                |
                 |  FGH100M-H (MM6108 HaLow)   |
                 |            ^                |
                 |            | USB?           |
                 |        SR9900 (USB Eth)     |
                 +-----------------------------+
```

## Main components

| Component | Role | Notes |
|---|---|---|
| **HLK-7628N** | Main router module | Hi-Link module with MediaTek MT7628N, 2.4 GHz WMAC, Ethernet PHY/switch, UART, USB, GPIO. The fitted board has 128 MB RAM and a 32 MB W25Q256 SPI NOR. |
| **FGH100M-H** | Wi-Fi HaLow radio | Driven as a **Morse Micro MM6108** over SDIO: `mmc0:0001:2`, driver `morse` 1.15.3, firmware `morse/mm6108.bin`, BCF `bcf_HD01_v2.bin`. The exact FGH100M-H datasheet is not public (help wanted). |
| **SR9900** | USB 2.0 ↔ 10/100 Ethernet | CoreChips USB Ethernet controller. Its exact role in the stock firmware is still unconfirmed (USB-C data path / optional USB Ethernet). The captured boot has no SR9900 USB device enumerated; the active RJ45 is the MT7628 internal switch. |
| **W25Q256** | 32 MB SPI NOR | U-Boot, env, factory, kernel, squashfs rootfs, jffs2 overlay. |
| **MT7628 integrated WMAC** | 2.4 GHz 802.11b/g/n | `mt76_wmac 10300000.wmac`, driver `mt7603e`/`mt76`. |

## Interfaces

- **RJ45**: 10/100 Ethernet, MT7628 internal switch, VLAN `eth0.1`
  (ports 0 and 2, CPU port 6 tagged).
- **USB-C**: 5 V power input. The product page describes it as power-only, but
  the PCB also carries the SR9900 USB Ethernet controller; the data role is an
  open question.
- **UART0**: 115200 8N1, SoC pins **GPIO12 = UART_TXD0**, **GPIO13 =
  UART_RXD0**, GND. It enumerates as a USB serial port on the host through a 3.3 V
  USB-TTL adapter. This is the U-Boot console.
- **Antenna**: SMA female (HaLow). The 2.4 GHz antenna is internal/PCB.
- **Reset**: button/pin for factory reset (hold ~10 s). The live device tree
  does not expose a `gpio-keys` node; the vendor reset is handled outside the
  mainline input stack.
- **LED**: single status LED on GPIO44 (`fuchsia:status` in the Morse DTS).

## Memory and flash

- RAM: 128 MB (Linux sees ~120 MB).
- SPI NOR: **Winbond W25Q256**, 32 MB, 64 KB erase blocks.
- Flash partitions: see [`flash-layout.md`](flash-layout.md).

## Boot time

The stock boot is slow:

- U-Boot shows its menu and waits **10 seconds** (`bootdelay=10`).
- The kernel boots, then the HaLow stack loads `mm6108.bin` around **19–20 s**
  and finishes driver setup around **23 s** (dmesg timestamps).
- Userspace services (LuCI, dnsmasq, HaLow AP, mesh, etc.) add more time.

So the 10 s U-Boot window and the HaLow firmware load dominate. A minimal open
firmware can boot much faster by skipping HaLow and the vendor service set.

## Device-unique data

- MAC address is stored in the `factory` partition at offset `0x28` and is
  referenced by the Ethernet and WMAC nodes.
- HaLow calibration is the BCF file `bcf_HD01_v2.bin` plus the MM6108 firmware.
- The raw dumps contain device-specific keys/passwords. They are preserved for
  interoperability but must not be reused on another device; see
  [`legal-and-privacy.md`](legal-and-privacy.md).

## Photos / markings

Add board photos and chip markings here (or in `docs/photos/`). Useful shots:

- full PCB top/bottom;
- HLK-7628N shield and module pins;
- FGH100M-H module and its SDIO/GPIO connections;
- SR9900 area and USB-C wiring;
- UART test pads;
- flash chip package (for a CH341A clip).
