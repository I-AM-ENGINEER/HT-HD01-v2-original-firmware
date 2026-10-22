# Legal, privacy and safety

## Purpose

This repository documents a device whose vendor does not publish source code,
schematics or a recovery procedure. The firmware images are preserved for
**interoperability, security research, repair and preservation**. The project
is not endorsed by or affiliated with Heltec, Hi-Link, Morse Micro, CoreChips
or any other rights holder.

## Firmware copyright

- The stock firmware, U-Boot, kernel, rootfs, vendor binaries, HaLow firmware
  and BCF files remain the property of their respective owners.
- No license is granted for those files. They are provided **as-is** for
  research and interoperability.
- The original documentation and tools in this repository are MIT-licensed
  (`LICENSE`).
- If you are a rights holder and believe content should be removed, open an
  issue and it will be reviewed.

## Device-unique secrets in the raw dumps

The raw images in `dumps/` are byte-for-byte copies of a specific device. They
contain, among other things:

- Dropbear SSH host keys and possibly `authorized_keys`;
- DPP keys/secrets (`/etc/dppd/`);
- the root password hash (`/etc/shadow`);
- the vendor default Wi-Fi passphrase;
- the factory MAC address and RF calibration data.

**Do not**:

- deploy these images on another device;
- expose a device running this image to an untrusted network;
- reuse the keys or passwords.

If you restore the stock image, change the passwords and regenerate the SSH
host keys.

The `unpacked/` tree is sanitized (see `sanitization.md`) and is not a
bootable image. It is provided for reading and analysis only.

## Privacy

The public docs and sanitized configs redact:

- the MAC address (placeholder `00:11:22:33:44:55`);
- the hostname (placeholder `HT-HD01-XXXX`);
- the vendor default passphrase (`CHANGEME`);
- UCI key/password/secret values (`CHANGEME`).

Do not add personal data, customer identifiers, private keys or passwords to
issues or pull requests.

## RF / regulatory

HaLow operation is regulated (frequency, power, duty cycle, country code). The
stock firmware uses a BCF and country setting appropriate for the vendor's
configuration. If you build your own firmware, you are responsible for
complying with local radio regulations.

## No warranty

The information and images are provided without warranty of any kind. Flashing
the wrong image, writing the wrong partition or losing the bootloader can
brick the device. Keep the full backup and a UART/SPI recovery path.
