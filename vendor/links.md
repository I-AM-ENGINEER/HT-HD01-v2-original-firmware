# Исходники вендора и ссылки

## Morse Micro OpenWrt

- Репозиторий: <https://github.com/MorseMicro/openwrt>
- HEAD на момент работы: `e3689ca3f0d18ddf5b413d055afa56ab02f48cd0`
- Листинг дерева: `morse-tree.json` (12192 записей, без truncation).

Найденные файлы:

- `target/linux/ramips/dts/mt7628an_morse_ekh03.dtsi` — общий DTS EKH03
  (SPI flash, partitions, UART0/1/2, Ethernet switch, SDIO MM6108, LED, reset key).
- `target/linux/ramips/dts/mt7628an_morse_ekh03v4.dts` — плата EKH03 v4
  (`compatible = "morse,ekh03v4"`).
- `target/linux/ramips/dts/mt7628an_morse_ekh03_rgbled.dtsi`.
- `target/linux/ramips/dts/mt7628an_morse_ekh04v6.dts`.
- `boards/ekh-mt76x8/morseguide-link_diffconfig`.

Локальные копии:

- `morse-mt7628an_morse_ekh03.dtsi`
- `morse-mt7628an_morse_ekh03v4.dts`

**Важно:** наше устройство — `morse,ekh03v3` (HT-HD01-V2). В HEAD нет отдельного
v3 DTS; ближайший — общий `ekh03.dtsi` + v4. Для точного порта стоит поискать
старые ветки/теги Morse OpenWrt с `ekh03v3` или взять живой DTS
(`../01_device_info/live.dts`).

## U-Boot

- `swiftgeek/ralink-uboot` @ `b52248ff54c2d186082c4f58e57e31c99a50781d`
  <https://github.com/swiftgeek/ralink-uboot> — локально `uboot-ralink-sdk/`.
  Меню и загрузочная логика: `lib_mips/board.c`.
- `luke4oxnet/hlk7628n-uboot` @ `7d50004eaf3e8058ddf4240521d06d3ce37cf371`
  <https://github.com/luke4oxnet/hlk7628n-uboot> — локально `uboot-hlk7628n/`.
  Интересен WPS-триггером авто-TFTP, но в HT-HD01 таких строк нет.

## Heltec

- Продукт: <https://heltec.org/project/ht-hd01/>
- Quick Start: <https://wiki.heltec.org/docs/devices/wifi-halow/ht-hd01/quick_started>
- Документация: <https://docs.heltec.org/en/wifi_halow/ht-hd01/index.html>
- Даташит: <https://resource.heltec.cn/download/HT-HD01/HT-HD01_Rev.1.0.0.pdf>
- Ресурсы: <https://resource.heltec.cn/download/HT-HD01/>

Heltec не документирует UART и TFTP-recovery; в wiki описан только factory reset
кнопкой (10 секунд).

## Как искать в дереве

```bash
python3 - <<'PY'
import json
d=json.load(open('morse-tree.json'))
for e in d['tree']:
    if 'ekh03' in e['path'].lower():
        print(e['path'])
PY
```
