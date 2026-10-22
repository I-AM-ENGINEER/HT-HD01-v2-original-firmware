# Serial console quick reference

- UART0, **115200 8N1**, 3.3 V TTL.
- GPIO12 = UART_TXD0 (board TX → adapter RX).
- GPIO13 = UART_RXD0 (board RX → adapter TX).
- GND → GND. Do not connect VCC.
- Test PC port: **COM49**.

## Open the console

Windows:

```powershell
plink -serial COM49 -sercfg 115200,8,n,1
```

PuTTY: Connection type `Serial`, line `COM49`, speed `115200`, 8 data bits,
1 stop bit, no parity, no flow control.

Linux:

```sh
picocom -b 115200 /dev/ttyUSB0
# or
screen /dev/ttyUSB0 115200
```

If Windows says `Error 5: Access is denied`, close the other program using
COM49.

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
Input device IP: 192.168.88.250
Input server IP: 192.168.88.10
Input Linux Kernel filename: uImage
```

The board loads the image to `0x80A00000` and boots it. No flash write.

See [`../docs/uart-console.md`](../docs/uart-console.md) for details.
