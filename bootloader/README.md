# Bootloader

| File | Contents |
|---|---|
| `uboot-analysis.md` | menu, boot flow, timeouts, recovery properties |
| `uboot-menu-strings.txt` | strings with offsets from `mtd0-u-boot.bin` |

## Summary

- Ralink/MediaTek **U-Boot 1.1.3**, 115200 8N1 on UART0.
- `bootdelay=10`; default action is menu option **3** (boot flash).
- On timeout `BootType='3'` and **Ethernet is not initialized**.
- TFTP-to-RAM (option 1) is safe and does not write flash, but requires a UART
  keypress.
- TFTP-to-flash (option 2) writes the firmware partition.
- `r: Reset firmware to first boot` erases only `rootfs_data`/overlay.
- No dual-image, no rollback, no netconsole/HTTP recovery.

The vendor binary's strings match the Ralink SDK source
(`swiftgeek/ralink-uboot`, `lib_mips/board.c`). See
[`../docs/boot-chain.md`](../docs/boot-chain.md) and
[`../docs/recovery.md`](../docs/recovery.md).

## Recover the strings

```bash
strings -t x ../dumps/mtd0-u-boot.bin | grep -iE \
  'TFTP|Flash|Reset|IP|kernel|bootdelay|serverip|ipaddr'
```
