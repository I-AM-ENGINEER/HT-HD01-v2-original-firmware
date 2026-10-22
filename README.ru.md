# HT-HD01-V2 — оригинальная прошивка и документация для open-source

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Проект по реверс-инжинирингу, сохранению прошивки и открытой документации
устройства **Heltec HT-HD01-V2** (платформа Morse Micro EKH03 v3, Wi-Fi HaLow).

Производитель не публикует исходники, схему и нормальную инструкцию по
восстановлению. Здесь собраны полные дампы flash, распакованный образ,
разбор загрузчика и всё, что удалось выяснить о железе.

> Статус: исследование/сохранение. Проект не связан с Heltec, Hi-Link,
> Morse Micro и CoreChips. Используйте на свой риск.

## Кратко о железе

| Параметр | Значение |
|---|---|
| Модель | Heltec HT-HD01-V2 (`morse,ekh03v3`) |
| Основной модуль | **HLK-7628N** (Hi-Link, MT7628N) |
| SoC | MT7628AN, MIPS 24KEc, little-endian |
| RAM / flash | 128 МБ / 32 МБ W25Q256 |
| HaLow | **FGH100M-H**, Morse Micro **MM6108** по SDIO |
| USB Ethernet | **SR9900**, USB-C ↔ switch port 2 (у HLK-7628N нет USB) |
| 2.4 ГГц | встроенный MT7628 (`mt76`/`mt7603e`) |
| Ethernet | 1× RJ45, switch port 0 |
| Консоль | UART0, 115200 8N1 (порт USB-TTL зависит от ПК) |
| Загрузчик | Ralink/MediaTek U-Boot 1.1.3 |
| Прошивка | OpenWrt 23.05.5, сборка вендора `r0+24271-bc42a5ccf5` |

## Структура

```
dumps/       полные дампы mtd0–mtd6, full-flash-32mb.bin, SHA256SUMS.txt
rootfs/      распакованный санитизированный rootfs
unpacked/    дополнительные материалы: live-конфиги, DTS, dmesg
bootloader/  разбор U-Boot и строки меню
vendor/      DTS EKH03 из Morse Micro OpenWrt и ссылки
docs/        железо, загрузка, recovery, портирование, legal
tools/       скрипты бэкапа/распаковки/санитизации
```

## Что важно знать

- Полный бэкап: 32 МБ flash, 7 разделов, конфиги, overlay, HaLow-firmware,
  device-tree. SHA-256 сверены.
- U-Boot умеет TFTP-загрузку в RAM без записи flash, но пункт меню
  выбирается только с UART в первые 10 секунд. При таймауте он грузит flash
  и даже не инициализирует Ethernet.
- `r: Reset firmware to first boot` стирает только overlay, ядро не
  восстанавливает. Dual-image/rollback нет.
- Сырые дампы содержат ключи и пароли устройства — не выкладывайте их в
  прод и не используйте на других платах. Санитизированный `rootfs/` не
  является загрузочным образом.
- Портирование rnsbox/minimal open firmware реально: MT7628N, 128 МБ RAM,
  mainline/OpenWrt ramips, но нужен UART + TFTP и учёт 32 МБ flash.

Подробности — в `docs/` (на английском) и в `README.md`.
