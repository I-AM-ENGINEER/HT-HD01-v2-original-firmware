# Unpacked stock firmware (sanitized)

This directory contains a **sanitized** extraction of the stock squashfs
rootfs. It is for reading and analysis; it is **not a bootable image** and is
not byte-identical to the device (secrets were removed).

| Path | Contents |
|---|---|
| `rootfs.tar.gz` | sanitized full rootfs, symlinks preserved |
| `configs/` | static factory UCI configs from `/etc/config` |
| `live-configs/` | sanitized live configs read from the running device |
| `init.d/` | init scripts from the factory rootfs |
| `device-tree/` | `live.dts` (decompiled) and `live.dtb` |
| `package-list.txt` | `opkg list-installed` (413 packages) |
| `rootfs-tree.txt` | full file tree with permissions and symlink targets |

## Extract

```bash
tar -xzf rootfs.tar.gz -C rootfs
```

The raw squashfs is `../dumps/mtd5-rootfs.bin`; extract it with:

```bash
unsquashfs -d rootfs ../dumps/mtd5-rootfs.bin
```

That gives the **unsanitized** tree, including the original keys/passwords.
Handle it as sensitive.

## What was removed

`etc/shadow`, `etc/dropbear/`, `etc/dppd/`, `etc/radius/`, `etc/ssl/private/`,
`root/.ssh/`, `etc/config/rpcd`, stale `.bak` configs and VPN key material.
MAC/hostname/default passphrase and UCI secrets were redacted. Full details:
[`../docs/sanitization.md`](../docs/sanitization.md).

## Useful entry points

- `configs/` — vendor UCI defaults (network, wireless, system, firewall, …).
- `live-configs/` — the state of the running device (sanitized).
- `init.d/` — vendor and OpenWrt services.
- `device-tree/live.dts` — the exact hardware description of this board.
- `rootfs-tree.txt` — quick search for files without extracting the tarball.
