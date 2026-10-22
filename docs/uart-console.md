# UART console and TFTP boot

## Wiring

- UART0, **115200 8N1**, 3.3 V TTL.
- SoC pins:
  - **GPIO12** = `UART_TXD0` → adapter **RX**
  - **GPIO13** = `UART_RXD0` → adapter **TX**
  - **GND** → adapter GND
- Do **not** connect the adapter's VCC; power the board from its own USB-C
  supply.
- The adapter enumerates as a USB serial port on the host.

## Terminal

Windows (PuTTY/plink; replace `COMx` with your port):

```powershell
plink -serial COMx -sercfg 115200,8,n,1
```

Linux:

```sh
picocom -b 115200 /dev/ttyUSB0
# or: screen /dev/ttyUSB0 115200
# or: minicom -D /dev/ttyUSB0 -b 115200
```

If the port is already open in another terminal, Windows returns
`Error 5: Access is denied`; close the other program first.

## Enter the U-Boot menu

1. Power-cycle the board.
2. Within **10 seconds**, press any key in the UART terminal.
3. The menu appears. Choose **1** for TFTP-to-SDRAM (no flash write).

## TFTP server

Put the test `uImage` in a directory and serve it over UDP/69:

- Windows: Tftpd64/Tftpd32, select the LAN interface, set the root directory.
- Linux:
  ```sh
  sudo in.tftpd -l -s /srv/tftp
  # or:
  dnsmasq --no-daemon --enable-tftp --tftp-root=/srv/tftp --bind-interfaces
  ```
- Allow UDP 69 and the ephemeral data port in the firewall.

At the U-Boot prompts enter your LAN addresses, e.g.:

```
Input device IP (10.10.10.123): 192.0.2.10
Input server IP (10.10.10.3):   192.0.2.20
Input Linux Kernel filename (uImage): uImage
```

The image must be built for **MIPS 24KEc**, little-endian, load/entry
`0x80000000`, ideally with an initramfs so no rootfs is needed.

## Capture a boot log

Use the serial terminal's logging (PuTTY: Session → Logging → All session
output) or, on Linux:

```sh
picocom -b 115200 /dev/ttyUSB0 | tee boot.log
```

The stock boot spends **10 s** in the U-Boot menu and loads the HaLow firmware
around **19–23 s** after kernel start.

## Safety

TFTP-to-SDRAM does not modify flash. If the image hangs, remove power and the
stock firmware will boot again. Do not use menu option 2 (write flash) until
you have a verified image and a recovery path.
