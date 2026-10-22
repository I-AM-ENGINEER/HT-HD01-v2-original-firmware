#!/bin/sh
#/etc/init.d/network stop

ssid=$(uci get system.@system[0].hostname)

ula_prefix=$(uci get network.globals.ula_prefix)
cp /etc/config/network.bak /etc/config/network
cp /etc/config/wireless.bak /etc/config/wireless
sync

uci set dhcp.lan.ignore='0'
uci commit dhcp

uci set luci.main.homepage='admin/morse/landing'
uci commit luci

uci set network.globals.ula_prefix=$ula_prefix
uci commit network
#uci set network.lan.proto='static'
#uci set network.lan.ipaddr='10.42.0.1'
#uci set network.lan.netmask='255.255.255.0'
#uci delete network.@device[0].ports
#uci delete network.@device[1].ports
#uci commit network
#uci add_list network.@device[0].ports='eth0.1'
#uci commit network


uci set wireless.default_radio0.disabled='0'
uci set wireless.default_radio0.network='lan'
uci set wireless.default_radio0.mode='ap'
uci set wireless.default_radio0.ssid=$ssid
uci set wireless.default_radio0.encryption='psk2'
uci set wireless.default_radio0.key='heltec.org'
uci set wireless.default_radio1.max_inactivity='30'
uci set wireless.default_radio1.ssid=$ssid
uci set system.@system[0].config='1'
uci commit system

bcf=bcf_mf08551.bin
res=$(cat /tmp/sysinfo/board_name)

case "$res" in
	Heltec,HT-HD01-V2)
		bcf=bcf_HD01_v2.bin
	;;
	Heltec,HT-HD01-V2.1)
	        bcf=bcf_HC01_V2_H.bin
	;;
	Heltec,HT-H7608-V2)
		bcf=bcf_H7608_V2.bin
	;;
	Heltec,HT-H7608-V1|\
	Heltec,HT-HD01-V1|\
	morse,ekh01-03 |\
	morse,ekh03v3)
		bcf=bcf_mf08551.bin
	;;
esac

uci set wireless.radio1.bcf=$bcf

uci commit wireless
sync
#/etc/init.d/network stop
#/morse/scripts/chipreset.sh
sleep 1
/etc/init.d/dnsmasq restart
/etc/init.d/network restart
#/etc/init.d/network reload

