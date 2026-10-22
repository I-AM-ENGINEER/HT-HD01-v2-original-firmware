# Разбор загрузки U-Boot

## Что за загрузчик

- Строки: `U-Boot 1.1.3 (Jan 10 2024 - 19:03:13)`, `Ralink UBoot Version`.
- Это MediaTek/Ralink SDK U-Boot; меню совпадает с исходниками
  `swiftgeek/ralink-uboot` (коммит `b52248ff54c2d186082c4f58e57e31c99a50781d`,
  каталог `uboot-ralink-sdk/`).
- Для сравнения сохранён форк `luke4oxnet/hlk7628n-uboot`
  (`7d50004eaf3e8058ddf4240521d06d3ce37cf371`, `uboot-hlk7628n/`): в нём есть
  WPS-кнопка для авто-TFTP, но в бинарнике HT-HD01 строк WPS/Button нет.

## Меню (строки из `mtd0-u-boot.bin`)

```
Please choose the operation:
  ... Load system code then write to Flash via Serial.
  ... Load system code to SDRAM via TFTP.          <- boot в RAM, flash не пишется
  ... Load system code then write to Flash via TFTP.
  ... Boot system code via Flash (default).         <- поведение по таймауту
  ... Entr boot command line interface.
  ... Load system code then write to Flash via USB Storage.
  ... Load Boot Loader code then write to Flash via TFTP.
r: Reset firmware to first boot.
```

Точные строки со смещениями — `uboot-menu-strings.txt`.

## Почему без UART сеть не работает

Ключевые места `uboot-ralink-sdk/lib_mips/board.c`:

- **1314**: `unsigned char BootType='3', confirm=0;` — по умолчанию flash.
- **1957–1963**: `bootdelay` берётся из env, иначе `CONFIG_BOOTDELAY`;
  в бинарнике default `bootdelay=10`.
- **1965–1980**: цикл ожидания клавиши `tstc()/getc()`. Если клавиши нет,
  `BootType` остаётся `'3'`.
- **1982–1987**: ветка `BootType == '3'` сразу вызывает `do_bootm()` на
  `CFG_KERN_ADDR`. **`eth_initialize()` здесь не вызывается.**
- **1995–2000**: `eth_initialize()` вызывается только в `else`, т.е. когда
  пользователь выбрал сетевой пункт.
- **2000–2006**: пункт 1 (`SEL_LOAD_LINUX_SDRAM`) вызывает `tftp_config()` и
  `do_tftpb()` с `autostart=yes`. Загрузка идёт в **0x80A00000**, файл `uImage`.
- **2010+**: пункт 2 (`SEL_LOAD_LINUX_WRITE_FLASH`) грузит в 0x80100000 и
  **пишет во flash** по `CFG_KERN_ADDR`.

Вывод: **штатный U-Boot не делает авто-TFTP**. Выбрать сеть можно только
клавишей в UART-консоли в первые 10 секунд. Netconsole, HTTP-recovery и
автоматического fallback в бинарнике нет.

## `r: Reset firmware to first boot`

По строкам бинарника:

```
Firmware will be restore to first boot, all your data will lose.
Find rootfs_data address: 0x%x, erase len = 0x%x.
Currently I2CDAT/GPIO5 is low, set it to high to reset firmware.
```

Это сброс `rootfs_data` (overlay) и конфига. Ядро/rootfs и U-Boot не
восстанавливаются. Как средство отката после неудачной прошивки **не годится**.

## `rebootcnt`

В env (mtd1 +0x8000) лежит `rebootcnt=0`. В самом бинарнике U-Boot строки
`rebootcnt` нет; в userspace прошивки она тоже не встречается. Доказательств
автоматического recovery по этому счётчику нет. Считать это страховкой нельзя.

## Dual-image / rollback

Строк `Image1Stable`, `dual`, `backup` в бинарнике нет. Разметка содержит один
firmware-раздел; вторая копия ядра/rootfs в 32 МБ не помещается. Отката нет.

## UART и TFTP (когда появится адаптер)

- UART0: **115200 8N1**, пины SoC **GPIO12 = TXD0**, **GPIO13 = RXD0**.
- Подключение 3,3 В: `RX адаптера -> GPIO12`, `TX адаптера -> GPIO13`,
  `GND -> GND`. Питание платы отдельное, VCC не подавать.
- При включении нажать клавишу, выбрать пункт «Load system code to SDRAM via
  TFTP», ввести IP платы, IP TFTP-сервера и имя `uImage`.
- Default-адреса: плата `10.10.10.123`, сервер `10.10.10.3`; можно ввести свои.
- uImage: MIPS 24KEc, load/entry 0x80000000, лучше с initramfs. Пункт 1
  загружает файл в 0x80A00000, `bootm` сам переносит по заголовку.

Подробная процедура — `../06_recovery/README.md`.

## Оговорка

Точный вендорский бинарник не дизассемблировался. Вывод основан на строках
меню/кода в `mtd0-u-boot.bin`, совпадении с Ralink SDK и отсутствии строк
авто-recovery. Для 100% проверки нужен один тестовый boot с UART.
