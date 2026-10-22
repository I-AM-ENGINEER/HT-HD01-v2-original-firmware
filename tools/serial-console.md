# Serial console quick reference

- UART0, **115200 8N1**, 3.3 V TTL.
- GPIO12 = UART_TXD0 (board TX → adapter RX).
- GPIO13 = UART_RXD0 (board RX → adapter TX).
- GND → GND. Do not connect VCC.
- Port: the one assigned by your adapter (e.g. `COMx` or `/dev/ttyUSB0`).

## Open the console

Windows:

```powershell
plink -serial COMx -sercfg 115200,8,n,1
```

PuTTY: Connection type `Serial`, line `COMx` (your port), speed `115200`, 8 data bits,
1 stop bit, no parity, no flow control.

Linux:

```sh
picocom -b 115200 /dev/ttyUSB0
# or
screen /dev/ttyUSB0 115200
```

If Windows says `Error 5: Access is denied`, close the other program using
serial port.

## U-Boot menu

Power-cycle and press a key within **10 seconds**:

```
1: Load system code to SDRAM via TFTP.   <- safe, RAM only
2: Load system code then write to Flash via TFTP.
3: Boot system code via Flash (default).
4: Enter boot command line interface.
r: Reset firmware to first boot.          <- overlay only
```

## TFTP-to-RAM

Serve `uImage` from a TFTP server, then:

```
Input device IP: 192.0.2.10
Input server IP: 192.0.2.20
Input Linux Kernel filename: uImage
```

The board loads the image to `0x80A00000` and boots it. No flash write.

See [`../docs/uart-console.md`](../docs/uart-console.md) for details.
