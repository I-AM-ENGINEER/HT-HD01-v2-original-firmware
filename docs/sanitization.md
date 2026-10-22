# Sanitization of the published extraction

The raw flash dumps in `dumps/` are **unmodified** and retain their original
SHA-256 hashes. That means they still contain device-unique secrets. The
`unpacked/` tree is a sanitized, non-bootable extraction intended for reading
and analysis.

## Removed

| Path | Why |
|---|---|
| `etc/shadow` | root password hash |
| `etc/dropbear/` | SSH host keys, `authorized_keys` |
| `etc/dppd/` | DPP private keys and auth secrets |
| `etc/radius/` | RADIUS users/clients/keys |
| `etc/ssl/private/` | private TLS material (if present) |
| `root/.ssh/` | user SSH keys (if present) |
| `etc/config/rpcd` | root password hash for ubus/RPC |
| `etc/config/wireless.bak`, `etc/config/network.bak` | stale configs with the default key |
| VPN `*.key`, `*.pem`, `*.crt` under `etc/openvpn/` | private keys/certs (if present) |

## Redacted

- MAC address → `00:11:22:33:44:55`.
- Hostname → `HT-HD01-XXXX`.
- Vendor default Wi-Fi passphrase → `CHANGEME`.
- UCI `option key|password|secret '...'` values → `CHANGEME`.

## What is still inside

- The sanitized `rootfs/` tree is not byte-identical to the device and is not
  bootable.
- Binaries may still contain the vendor default password string or other
  non-unique constants. That is not a device-unique secret.
- The raw dumps still contain everything. Treat them as sensitive.

## Reproduce

```bash
# from the repository root, on Linux/WSL
tools/sanitize-rootfs.sh /path/to/extracted/rootfs .
```

The script preserves symlinks and writes `rootfs/`,
`unpacked/rootfs-tree.txt`.
