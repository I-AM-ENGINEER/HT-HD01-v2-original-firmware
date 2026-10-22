# Live configs (sanitized)

These files were read from the running device's `/etc/config` (the writable
overlay) and then sanitized:

- MAC addresses redacted;
- hostname redacted;
- vendor default Wi-Fi passphrase redacted;
- UCI key/password/secret values replaced with `CHANGEME`.

They describe the device's live state at the time of capture, not the factory
defaults. The factory defaults are in `../configs/`.

| File | Notes |
|---|---|
| `network` | LAN/WAN/HaLow bridge |
| `wireless` | 2.4 GHz and Morse HaLow radios |
| `system` | hostname, timezone, NTP |
| `dhcp` | dnsmasq/DHCP |
| `firewall` | firewall4 rules |
| `dropbear` | SSH daemon options |

Do not use these as a drop-in restore without changing the redacted values.
