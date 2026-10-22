# Hardware

## Board

**Heltec HT-HD01-V2** — a Wi-Fi HaLow dongle/gateway in an aluminium case.
The PCB is built around an **HLK-7628N** module, an **FGH100M-H** HaLow module
and an **SR9900** USB-Ethernet bridge.

```
                    +-------------------------------+
   USB-C 5V  ------>|  HLK-7628N (MT7628N)          |
   USB-C data <---->|  - MIPS 24KEc, 128 MB RAM     |
        (SR9900)    |  - 32 MB W25Q256 SPI NOR      |
   RJ45     <----->|  - 2.4 GHz WMAC               |
                    |  - Ethernet switch            |
                    |     port 0 --> RJ45           |
                    |     port 2 --> SR9900 --> USB |
                    |            | SDIO             |
                    |            v                  |
                    |  FGH100M-H (MM6108 HaLow)     |
                    +-------------------------------+
```

The HLK-7628N module provides Ethernet, UART and GPIO but **does not expose
USB** on this board. The SR9900 is therefore used as the USB-Ethernet bridge:
one MT7628 switch port goes to the SR9900's Ethernet side, and the SR9900's USB
side is the USB-C connector.

## Main components

| Component | Role | Notes |
|---|---|---|
| **HLK-7628N** | Main router module | Hi-Link module with MediaTek MT7628N, 2.4 GHz WMAC, Ethernet PHY/switch, UART, GPIO. The fitted board has 128 MB RAM and a 32 MB W25Q256 SPI NOR. USB is not exposed by this module/design. |
| **FGH100M-H** | Wi-Fi HaLow radio | Driven as a **Morse Micro MM6108** over SDIO: `mmc0:0001:2`, driver `morse` 1.15.3, firmware `morse/mm6108.bin`, BCF `bcf_HD01_v2.bin`. The exact FGH100M-H datasheet is not public (help wanted). |
| **SR9900** | USB 2.0 ↔ 10/100 Ethernet bridge | Ethernet side on MT7628 switch **port 2**; USB side on the **USB-C** connector. Provides the USB Ethernet interface because the HLK-7628N does not expose USB. See [`ethernet.md`](ethernet.md). |
| **W25Q256** | 32 MB SPI NOR | U-Boot, env, factory, kernel, squashfs rootfs, jffs2 overlay. |
| **MT7628 integrated WMAC** | 2.4 GHz 802.11b/g/n | `mt76_wmac 10300000.wmac`, driver `mt7603e`/`mt76`. |

## Ethernet port map

| MT7628 switch port | Connected to | Notes |
|---|---|---|
| **0** | physical **RJ45** | link up 100baseT, carries LAN traffic |
| **2** | **SR9900** Ethernet side | link down when USB-C has no USB host |
| 6 | CPU (`eth0`, tagged) | VLAN 1 trunk |

VLAN 1 = `0 2 6t`; both external ports are bridged into `eth0.1`. Details and
captured evidence: [`ethernet.md`](ethernet.md).

## Interfaces

- **RJ45**: 10/100 Ethernet on MT7628 switch port 0, VLAN `eth0.1`.
- **USB-C**: 5 V power input plus the SR9900 USB-Ethernet data path
  (switch port 2). The host sees the SR9900 as a USB Ethernet device; the board
  itself does not load an SR9900 driver because it is on the Ethernet side.
- **UART0**: 115200 8N1, SoC pins **GPIO12 = UART_TXD0**, **GPIO13 =
  UART_RXD0**, GND. It enumerates as a USB serial port on the host through a
  3.3 V USB-TTL adapter. This is the U-Boot console.
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
