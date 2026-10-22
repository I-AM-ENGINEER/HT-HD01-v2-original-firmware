# Chips and datasheets

## HLK-7628N (Hi-Link)

- Vendor page: <https://www.hlktech.com/en/Product/Details/23>
- LCSC: <https://www.lcsc.com/product-detail/C209920.html>
- Module based on **MediaTek MT7628N**: MIPS 24KEc, 2.4 GHz 802.11b/g/n,
  1× 10/100 Ethernet PHY/switch, UART, USB 2.0 host, GPIO, SPI.
- The fitted device reports **MT7628AN ver:1 eco:2**, 128 MB RAM and a
  32 MB W25Q256 SPI NOR. The `HLK-7628N` name is the module, not the SoC.
- OpenWrt target: `ramips/mt76x8`; mainline Linux has MT7628AN support.

## FGH100M-H (HaLow)

- Function: Wi-Fi HaLow (802.11ah) radio module.
- The stock firmware identifies the radio as a **Morse Micro MM6108** over
  SDIO:
  - `morse_sdio mmc0:0001:2`
  - firmware `morse/mm6108.bin` (444304 bytes, CRC32 `0x1c6a0f92`)
  - BCF `morse/bcf_HD01_v2.bin` (1197 bytes, CRC32 `0xa6b42f92`)
  - driver `morse` version `0-rel_1_15_3_2025_Apr_16`
- The exact FGH100M-H datasheet/pinout is not publicly available as far as we
  can tell. If you have it, please open an issue/PR.

## SR9900 (CoreChips)

- Function: USB 2.0 to 10/100 Ethernet controller.
- Present on the PCB according to the owner. The stock boot log does **not**
  show an SR9900 USB device; the active Ethernet interface is the MT7628
  internal MAC/switch (`mtk_soc_eth` → `eth0`).
- Possible roles to confirm:
  - USB-C data path for configuration/Ethernet-over-USB;
  - an optional second Ethernet port;
  - an unpopulated/alternative BOM option.
- Kernel modules present in the stock image include `usbnet`, `cdc_ether`,
  `rndis_host`, `usb_storage`, `ehci_hcd`, `ohci_hcd`. No dedicated `sr9900`
  module was observed.
- Please add board photos and trace the USB-C/SR9900 wiring if you can.

## W25Q256 (Winbond)

- 32 MB SPI NOR, 64 KB erase blocks, JEDEC ID detected by the kernel as
  `w25q256 (32768 Kbytes)`.
- Contains U-Boot, env, factory data, kernel, squashfs rootfs, jffs2 overlay.

## MT7628 integrated 2.4 GHz

- `mt76_wmac 10300000.wmac`, ASIC revision `76280001`.
- The driver emits `mt7603e` firmware messages; there is no separate MT7603E
  chip — the MT7628 WMAC uses the mt76/mt7603e driver path.
- TX power calibration is read from the `factory` partition (`mediatek,mtd-eeprom`).

## References

- Morse Micro OpenWrt: <https://github.com/MorseMicro/openwrt>
- HLK-7628N manual: <https://www.manualslib.com/manual/1605171/Hi-Link-Hlk-7628n.html>
- OpenWrt ramips/mt76x8 target documentation:
  <https://openwrt.org/docs/techref/targets/ramips>
