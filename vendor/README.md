# Vendor sources and references

| Path | Contents |
|---|---|
| `links.md` | URLs and commit pins used during the investigation |
| `morse-dts/morse-mt7628an_morse_ekh03.dtsi` | Morse Micro EKH03 shared DTSI |
| `morse-dts/morse-mt7628an_morse_ekh03v4.dts` | Morse Micro EKH03 v4 board DTS |

The device is `morse,ekh03v3`. Morse Micro's current HEAD has the shared
`ekh03.dtsi` and a v4 board file, but no explicit v3 DTS. Use the live tree in
`../unpacked/device-tree/live.dts` for the exact v3 wiring.

U-Boot source references used for the menu/boot analysis:

- `swiftgeek/ralink-uboot` @ `b52248ff54c2d186082c4f58e57e31c99a50781d`
- `luke4oxnet/hlk7628n-uboot` @ `7d50004eaf3e8058ddf4240521d06d3ce37cf371`
  (has a WPS-triggered TFTP update; not present in the HT-HD01 binary)

See `links.md` for the exact URLs.
