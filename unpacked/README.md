# Analysis extras

These files are analysis artifacts, not part of the rootfs tree.

| Path | Contents |
|---|---|
| `device-tree/` | `live.dts` (decompiled) and `live.dtb` |
| `live-configs/` | sanitized live UCI configs from the running device |
| `package-list.txt` | `opkg list-installed` (413 packages) |
| `dmesg.txt` | sanitized boot log |
| `rootfs-tree.txt` | full file tree with permissions and symlink targets |

The **unpacked sanitized rootfs** is in [`../rootfs/`](../rootfs/). It contains
the vendor filesystem tree (`bin`, `etc`, `lib`, `usr`, `www`, ...), excluding
device-unique keys and passwords.

The raw squashfs is `../dumps/mtd5-rootfs.bin`; `unsquashfs` gives the complete
**unsanitized** tree, including the original secrets. Handle that as sensitive.

Sanitization details: [`../docs/sanitization.md`](../docs/sanitization.md).
