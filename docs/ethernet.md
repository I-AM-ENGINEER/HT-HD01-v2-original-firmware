# Ethernet and switch port map

The HLK-7628N module on this board exposes Ethernet but **not USB**. To provide
a USB data interface, the board uses an **SR9900 USB-to-Ethernet bridge**: its
Ethernet side is connected to one MT7628 switch port, and its USB side is the
USB-C connector.

## Port map

| MT7628 switch port | Connected to | Stock boot state |
|---|---|---|
| **0** | physical **RJ45** | link **up**, 100baseT full-duplex, carries LAN/SSH traffic |
| **2** | **SR9900** Ethernet side | enabled in VLAN 1; link **down** when USB-C has no USB host |
| 6 | CPU port (`eth0`, tagged) | link up 1000baseT, VLAN 1 trunk |

VLAN 1 contains `0 2 6t`, so the RJ45 and the USB-C/SR9900 Ethernet are
**bridged into the same LAN** (`eth0.1`). Plugging USB-C into a PC gives that
PC an Ethernet connection to the same LAN as the RJ45.

## Evidence

`swconfig dev switch0 show` on the running device:

```
Port 0: disable 0, untag 1, pvid 1
        recv_good 11561, tr_good 646
        link: up speed:100baseT full-duplex
Port 2: disable 0, untag 1, pvid 1
        recv_good 0, tr_good 0
        link: down
Port 6: link: up speed:1000baseT full-duplex
VLAN 1: ports: 0 2 6t
```

The device was reachable over SSH during the capture, and the SSH traffic is on
`eth0.1`. The only external port with traffic is **port 0**, so port 0 is the
physical RJ45. The only other enabled external port is **port 2**, which is the
SR9900 path.

Kernel log:

```
rt3050-esw 10110000.esw: port 0 link up
rt3050-esw 10110000.esw: port 0 link down
rt3050-esw 10110000.esw: port 0 link up
```

`/etc/board.json` also lists ports 0 and 2 as `lan` and port 6 as the tagged
CPU port.

## Why port 2 is down

The SR9900 is a USB-to-Ethernet bridge. Its Ethernet PHY is on switch port 2,
but the link may only come up when the USB side is enumerated by a host. With
USB-C connected only to a power supply (no USB host), port 2 stays down. This
matches the captured state.

**Confirmation test:** connect USB-C to a PC (USB host), then run:

```sh
swconfig dev switch0 show
```

Port 2 should change to `link: up`, and the PC should see a USB Ethernet
interface.

## Open items

- Exact SR9900 part variant and datasheet.
- USB-C CC/data wiring and whether the port supports data in all power modes.
- Confirm the host-side USB Ethernet enumeration and speed (10/100).
