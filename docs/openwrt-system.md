# Stock OpenWrt system

## Version

```
DISTRIB_ID='OpenWrt'
DISTRIB_RELEASE='23.05.5'
DISTRIB_REVISION='r0+24271-bc42a5ccf5'
DISTRIB_TARGET='ramips/mt76x8'
DISTRIB_ARCH='mipsel_24kc'
DISTRIB_DESCRIPTION='OpenWrt 23.05.5 2.8.5-20260420'
DISTRIB_TAINTS='busybox'
```

Kernel 5.15.167, built 2025-06-23. The vendor adds a "morse" package feed and
a set of LuCI applications on top of the stock 23.05.5 feeds.

## Packages

413 packages. Highlights:

- `kmod-morse` (driver 1.15.3), `morse-fw-6108`, `morse-board-config`,
  `morsecli`, `morsectrl`, `smart_manager`, `morse_mesh11sd`.
- `mt76`/`mt7603e` for the integrated 2.4 GHz WMAC.
- `wpad-openssl`, `hostapd_s1g`, `wpa_supplicant_s1g`.
- LuCI + vendor apps: `luci-app-morseconfig`, `luci-app-morseupgrade`,
  `luci-app-rangetest`, `luci-app-ekhwizards`, `luci-app-camera`.
- `batman-adv`, `mesh11sd`, `prplmesh`, `relayd`, `openvpn`, `mediamtx`,
  `collectd`, `ttyd`, `avahi`.
- Reticulum is **not** installed; this is the stock vendor image.

The full list is `unpacked/package-list.txt`.

## Network (stock, sanitized)

- LAN: `eth0.1`, static `10.42.0.1/24`, dnsmasq DHCP/DNS.
- WAN: DHCP (unconfigured by default).
- HaLow: bridge `br-ahwlan`, static `192.168.100.1/24`.
- Switch: VLAN 1 = ports 0, 2, CPU 6t. Port 0 = physical RJ45;
  port 2 = SR9900 USB Ethernet (USB-C). See [`ethernet.md`](ethernet.md).
- 2.4 GHz `radio0`: AP mode, **disabled** by default.
- HaLow `radio1`: type `morse`, band `s1g`, channel 3, country US,
  BCF `bcf_HD01_v2.bin`; AP with SAE, SSID/key redacted in the public tree.

Live, sanitized UCI files are in `unpacked/live-configs/`. Static factory
defaults are in `rootfs/etc/config/`.

## Services

`/etc/init.d/` includes the usual OpenWrt set plus vendor services:

- `morsechipreset`, `morse-boot-prints`, `antenna-select`, `gpio_switch`
- `checkkey`, `checkstat`, `smart_manager`, `pcm-manager`
- `mesh11sd`, `prplmesh`, `relayd`, `trelay`, `virtual-wire`
- `mediamtx`, `aws_kvs`, `dppd`, `dpp-key-recovery`
- `uhttpd`/LuCI, `dropbear`, `dnsmasq`, `firewall4`, `ttyd`, `umdns`

## Access

- SSH: `root@<device-ip>`; the vendor uses a default password (redacted here).
  Change it before exposing the device.
- LuCI: `http://<device-ip>/` (or `http://10.42.0.1/` on the device's LAN).
- UART: see [`uart-console.md`](uart-console.md).

## Overlay

- `rootfs_data` is 2.75 MB; the default install uses only a few hundred KB.
- `/tmp` is a tmpfs (about half of RAM; ~60 MB on this board). This is useful
  for no-flash userspace tests over SSH.

## Vendor customizations

- HaLow BCF selection and country/region handling.
- `morse-mode` / AP-STA switching, mesh, and a "smart manager".
- Camera/ONVIF/MediaMTX stack.
- Vendor LuCI theme and upgrade app.
- `persistent_vars_storage.sh` reads/writes U-Boot env/factory data for
  passwords and Dropbear keys.

The rootfs also contains a `morse` CLI (`/sbin/morse_cli`) and `morsectrl`;
both are vendor binaries, not open source.
