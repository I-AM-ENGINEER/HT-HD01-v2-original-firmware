# Tools

| Tool | Purpose |
|---|---|
| `backup-device.sh` | dump all MTD partitions over SSH and verify hashes |
| `extract-rootfs.sh` | `unsquashfs` the stock rootfs |
| `sanitize-rootfs.sh` | build the publishable, sanitized extraction |
| `serial-console.md` | UART/TFTP quick reference |

All scripts are POSIX shell. On Windows, run them in WSL or Git Bash.

## backup-device.sh

```bash
./backup-device.sh root@<device-ip> ./backup
```

Requires SSH access (key or `sshpass`). It writes `mtd0..mtd6`, a
`SHA256SUMS.txt`, and a `sysupgrade-backup.tar.gz` (the latter contains
secrets; keep it private).

## extract-rootfs.sh

```bash
./extract-rootfs.sh ../dumps/mtd5-rootfs.bin ./rootfs
```

## sanitize-rootfs.sh

```bash
./sanitize-rootfs.sh /path/to/unsanitized/rootfs /path/to/repo
```

Run on Linux/WSL to preserve symlinks. Writes `rootfs/` and
`unpacked/rootfs-tree.txt`.

## Serial

See [`serial-console.md`](serial-console.md).
