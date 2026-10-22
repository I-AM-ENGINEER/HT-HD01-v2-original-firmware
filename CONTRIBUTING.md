# Contributing

Thanks for helping document and open this hardware.

## What is useful

- Board photos (top/bottom, chip markings, UART pads, SR9900 area).
- FGH100M-H datasheet or pinout.
- SR9900 wiring/role in the stock firmware.
- Exact `ekh03v3` DTS or vendor OpenWrt source.
- DTS/kernel work for a mainline or OpenWrt port.
- Test reports (UART/TFTP boot, flash, Ethernet, HaLow).

## Rules

- **No personal data, MAC addresses, private keys or passwords** in issues,
  commits or pull requests.
- Do not modify the raw dumps in `dumps/`; they are preserved originals.
  If you add a new dump, add its SHA-256 and document the device/version.
- If you add an extracted rootfs, run `tools/sanitize-rootfs.sh` first.
- Keep documentation factual; mark unknowns clearly.
- Open an issue before large restructuring or adding big binary files.

## License

By contributing you agree that your original documentation/tools are released
under the MIT License. Vendor firmware remains vendor property.
