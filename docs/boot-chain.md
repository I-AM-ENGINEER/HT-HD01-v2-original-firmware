# Boot chain

## U-Boot

- **Ralink/MediaTek U-Boot 1.1.3** (`Jan 10 2024`), built for MT7628.
- Console: UART0, **115200 8N1**.
- `bootdelay=10` (compiled default, env may override).
- Default IPs: device `10.10.10.123`, server `10.10.10.3`.
- Default kernel filename: `uImage`; load address for TFTP-to-RAM: `0x80A00000`.
- The menu is shown on every boot:

```
1: Load system code to SDRAM via TFTP.        <- boot in RAM, no flash write
2: Load system code then write to Flash via TFTP.
3: Boot system code via Flash (default).
4: Enter boot command line interface.
6: Load system code then write to Flash via USB Storage.
7/8: Boot loader load/write
r: Reset firmware to first boot.               <- erases overlay only
```

## Timeout behaviour (important)

The Ralink SDK source (`swiftgeek/ralink-uboot`, `lib_mips/board.c`) matches the
strings in the vendor binary:

- `unsigned char BootType='3'` is the default.
- The menu waits for a key; if none is pressed, `BootType` stays `'3'`.
- The `BootType == '3'` branch calls `do_bootm()` directly on the flash kernel
  address. **`eth_initialize()` is not called in this branch.**
- Ethernet is initialized only in the non-flash branch, i.e. after a menu
  selection.

Therefore **network boot is impossible without UART** on the stock bootloader:
no auto-TFTP, no netconsole, no HTTP recovery, no DHCP boot.

## Flash → kernel → rootfs

1. U-Boot loads the uImage at `0x50000` (mtd3 start) to `0x80000000`.
2. The kernel's `mtdsplit_uimage` parser creates `kernel`/`rootfs`.
3. The squashfs rootfs is mounted read-only.
4. The jffs2 `rootfs_data` partition is mounted as `/overlay`; `/etc` and
   `/usr` are overlaid with it.
5. Userspace starts OpenWrt (`/etc/init.d/...`).

## Recovery properties

- There is **no dual-image/rollback** in this U-Boot; the strings for
  `Image1Stable`/`dual` are absent and the flash has one firmware slot.
- `r: Reset firmware to first boot` looks up `rootfs_data` and erases it. It
  does not restore the kernel or rootfs.
- `rebootcnt` is present in the env but is not referenced by the U-Boot binary
  and has no userspace consumer in the extracted rootfs; no automatic recovery
  can be relied on.

## Safe test boot

Use the UART console and menu option 1 with a TFTP server:

```text
device IP:  192.168.88.250   (example)
server IP:  192.168.88.10
filename:   uImage
```

The file is loaded to `0x80A00000`; `bootm` relocates it to the address in the
uImage header (`0x80000000`) and starts it. No flash writes. A failed boot is
recovered by power-cycling the board.

See [`uart-console.md`](uart-console.md) and [`recovery.md`](recovery.md).
