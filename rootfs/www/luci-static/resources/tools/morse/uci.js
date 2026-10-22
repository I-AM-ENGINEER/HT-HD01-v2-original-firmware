'use strict';'require baseclass';'require uci';'require network';function getZoneForNetwork(network){const zoneSection=uci.sections('firewall','zone').find(z=>L.toArray(z.network).includes(network));return zoneSection?.['name'];}
function getRandomMAC(){let macdef=getDefaultSSID();if(macdef)
{let mac1=macdef.slice(-4,-2);let mac2=macdef.slice(-2);return'F2:'+Array.from({length:3},()=>Math.floor(Math.random()*256).toString(16).padStart(2,'0')).join(':')+":"+mac1+":"+mac2;}
else
{return'F2:'+Array.from({length:5},()=>Math.floor(Math.random()*256).toString(16).padStart(2,'0')).join(':');}}
function getFakeMorseMAC(networkDevices){for(const d of networkDevices){if(d.getWifiNetwork()&&d.getWifiNetwork().ubus('dev','iwinfo','hwmodes')?.includes('ah')){if(d.getMAC()){return'F2:'+d.getMAC().slice(-14);}}}
return null;}
function getDefaultSSID(){return uci.get_first('system','system','hostname');}
function getDefaultWifiKey(){const CHARS='abcdefghijklmnopqrstuvwxyz023456789';return uci.get_first('system','system','default_wifi_key')??Array.from({length:8},()=>CHARS.charAt(Math.floor(Math.random()*CHARS.length)));}
function getOrCreateForwarding(srcZone,destZone,name=undefined){let existingForwarding=uci.sections('firewall','forwarding').find(f=>f.src===srcZone&&f.dest===destZone&&f.enabled!=='0');if(existingForwarding){return existingForwarding['.name'];}
const zoneSection=uci.sections('firewall','zone').find(z=>z['name']===destZone);uci.set('firewall',zoneSection['.name'],'mtu_fix','1');uci.set('firewall',zoneSection['.name'],'masq','1');for(const s of uci.sections('firewall','forwarding').filter(f=>f.src===srcZone)){uci.set('firewall',s['.name'],'enabled','0');}
let existingDisabledForwarding=uci.sections('firewall','forwarding').find(f=>f.src===srcZone&&f.dest===destZone);if(existingDisabledForwarding){uci.set('firewall',existingDisabledForwarding['.name'],'enabled','1');return existingDisabledForwarding['.name'];}
const forwardingId=uci.add('firewall','forwarding',name);uci.set('firewall',forwardingId,'src',srcZone);uci.set('firewall',forwardingId,'dest',destZone);return forwardingId;}
function getOrCreateZone(networkSectionId){const zone=getZoneForNetwork(networkSectionId);if(zone){return zone;}
let proposedName=networkSectionId,i=0;while(uci.sections('firewall').some(s=>[s['.name'],s.name].includes(proposedName))){proposedName=`${networkSectionId}${++i}`;}
uci.add('firewall','zone',proposedName);uci.set('firewall',proposedName,'name',proposedName);uci.set('firewall',proposedName,'network',[networkSectionId]);uci.set('firewall',proposedName,'input','ACCEPT');uci.set('firewall',proposedName,'output','ACCEPT');uci.set('firewall',proposedName,'forward','ACCEPT');return proposedName;}
function createDhcp(dnsmasqName,networkSectionId){let proposedName=`${networkSectionId}`,i=0;while(uci.sections('dhcp').some(s=>s['.name']===proposedName)){proposedName=`${networkSectionId}${++i}`;}
uci.add('dhcp','dhcp',proposedName);uci.set('dhcp',proposedName,'start','100');uci.set('dhcp',proposedName,'limit','150');uci.set('dhcp',proposedName,'leasetime','12h');uci.set('dhcp',proposedName,'interface',networkSectionId);if(!uci.get('dhcp',dnsmasqName)['.anonymous']){uci.set('dhcp',proposedName,'instance',dnsmasqName);}
return proposedName;}
function getOrCreateDhcp(dnsmasqName,networkSectionId){const onSections=uci.sections('dhcp','dhcp').filter(dhcp=>dhcp.interface===networkSectionId&&dhcp.ignore!=='1'&&(!dhcp.instance||dhcp.instance===dnsmasqName));const offSection=uci.sections('dhcp','dhcp').find(dhcp=>dhcp.interface===networkSectionId&&dhcp.ignore==='1'&&(!dhcp.instance||dhcp.instance===dnsmasqName));if(onSections.length>0){return onSections[0]['.name'];}else if(offSection){uci.unset('dhcp',offSection['.name'],'ignore');return offSection['.name'];}else{return createDhcp(dnsmasqName,networkSectionId);}}
function setupDnsmasq(dnsmasqName,networkSectionId){uci.set('dhcp',dnsmasqName,'domainneeded','1');uci.set('dhcp',dnsmasqName,'localise_queries','1');uci.set('dhcp',dnsmasqName,'rebind_localhost','1');uci.set('dhcp',dnsmasqName,'local',`/${networkSectionId}/`);uci.set('dhcp',dnsmasqName,'domain',networkSectionId);uci.set('dhcp',dnsmasqName,'expandhosts','1');uci.set('dhcp',dnsmasqName,'cachesize','1000');uci.set('dhcp',dnsmasqName,'authoritative','1');uci.set('dhcp',dnsmasqName,'readethers','1');uci.set('dhcp',dnsmasqName,'localservice','1');uci.set('dhcp',dnsmasqName,'ednspacket_max','1232');}
function getOrCreateDnsmasq(networkSectionId){const dnsSections=uci.sections('dhcp','dnsmasq');const genericDnsSections=dnsSections.filter(dnsmasq=>!dnsmasq.interface&&!L.toArray(dnsmasq.notinterface).includes(networkSectionId));const interfaceDnsSections=dnsSections.filter(dnsmasq=>L.toArray(dnsmasq.interface).includes(networkSectionId));if(genericDnsSections.length+interfaceDnsSections.length>1){console.error('More than one applicable dnsmasq for interface - probably broken config.');}
if(genericDnsSections.length>0){return genericDnsSections[0]['.name'];}else if(interfaceDnsSections.length>0){return interfaceDnsSections[0]['.name'];}else if(dnsSections.length===0){const name=uci.add('dhcp','dnsmasq');setupDnsmasq(name,networkSectionId);return name;}else if(dnsSections.length===1){const dnsSection=dnsSections[0];if(dnsSection.interface){uci.unset('dhcp',dnsSection['.name'],'interface');}
if(L.toArray(dnsSection.notinterface).includes(networkSectionId)){uci.set('dhcp',dnsSection['.name'],'notinterface',dnsSection.notinterface.filter(iface=>iface===networkSectionId));}
return dnsSection['.name'];}else{let proposedName=`${networkSectionId}_dns`,i=0;while(uci.sections('dhcp').some(s=>s['.name']===proposedName)){proposedName=`${networkSectionId}_dns${++i}`;}
uci.add('dhcp','dnsmasq',proposedName);setupDnsmasq(proposedName,networkSectionId);uci.set('dhcp',proposedName,'interface',[networkSectionId]);uci.set('dhcp',proposedName,'localuse','0');uci.set('dhcp',proposedName,'notinterface',['loopback']);return proposedName;}}
function hasMultipleDevices(networkSectionId){let count=getNetworkDevices(networkSectionId).length;for(const wifiIface of getNetworkWifiIfaces(networkSectionId)){count+=(wifiIface.mode==='ap'&&wifiIface.wds==='1')||wifiIface.mode==='mesh'?2:1;}
return count>1;}
function forceBridge(networkSectionId,bridgeName,bridgeMAC=null){const currentDevice=uci.get('network',networkSectionId,'device');let bridge=uci.sections('network','device').find(s=>s.type=='bridge'&&s.name==bridgeName);if(!bridge){bridge=uci.add('network','device');uci.set('network',bridge,'name',bridgeName);uci.set('network',bridge,'type','bridge');if(bridgeMAC)
uci.set('network',bridge,'macaddr',bridgeMAC);}else{for(const network of uci.sections('network','interface')){if(network.device===bridgeName&&network['.name']!==networkSectionId){uci.unset('network',network['.name'],'device');}}
if(bridgeMAC){uci.set('network',bridge['.name'],'macaddr',bridgeMAC);}}
if(currentDevice!=bridgeName){const existingBridge=uci.sections('network','device').find(s=>s.type=='bridge'&&s.name==currentDevice);if(existingBridge){uci.unset('network',networkSectionId,'device');if(existingBridge.ports&&existingBridge.ports.length>0){uci.set('network',bridge,'ports',existingBridge.ports);}
uci.unset('network',existingBridge,'ports');}
uci.set('network',networkSectionId,'device',bridgeName);}}
function createOrRemoveBridgeAsNeeded(networkSectionId){const currentDevice=uci.get('network',networkSectionId,'device');const hasBridge=!!uci.sections('network','device').find(s=>s.type=='bridge'&&s.name==currentDevice);const needBridge=hasMultipleDevices(networkSectionId);if(hasBridge&&!needBridge){const wifiIfaces=getNetworkWifiIfaces(networkSectionId);if(wifiIfaces.length===1){const iface=wifiIfaces[0];if(iface.mode==='adhoc'||(iface.mode==='sta'&&iface.wds!=='1')){uci.unset('network',networkSectionId,'device');}}}else if(!hasBridge&&needBridge){setBridgeWithPorts(networkSectionId,currentDevice?[currentDevice]:[]);}}
const BRIDGED_NON_WDS_CLIENT_ERROR_TEMPLATE=_(`The configuration for the "%s" network is not supported.

If a network has a non-WDS Wi-Fi client, it must be the only device.

This network currently has non-WDS Wi-Fi clients: %s

This network currently has other devices: %s

Please do one of:
 - remove the non-WDS Wi-Fi clients;
 - enable WDS for the Wi-Fi clients (if possible); or
 - remove all other devices from this network to leave a single non-WDS Wi-Fi client.
`);const BRIDGED_PORT_SUMMARY_TEMPLATE=_('A "%s" port');const BRIDGED_WIFI_SUMMARY_TEMPLATE=_('A %s Wi-Fi device in "%s" mode with SSID "%s"');function validateBridge(networkSectionId,wifiDevices){const currentDevice=uci.get('network',networkSectionId,'device');const bridge=uci.sections('network','device').find(s=>s.type=='bridge'&&s.name==currentDevice);if(!bridge){return;}
const wifiIfaces=getNetworkWifiIfaces(networkSectionId);const isNonWDSClient=wifiIface=>(wifiIface.mode==='adhoc'||(wifiIface.mode==='sta'&&wifiIface.wds!=='1'));const nonWDSWiFiClients=wifiIfaces.filter(isNonWDSClient);if(nonWDSWiFiClients.length){const formatWifiDeviceSummary=wifiIface=>BRIDGED_WIFI_SUMMARY_TEMPLATE.format(wifiDevices[wifiIface.device]?.get('type')??'unknown',wifiIface.mode,wifiIface.ssid);const otherBridgedDevices=[...L.toArray(bridge.ports).map(port=>BRIDGED_PORT_SUMMARY_TEMPLATE.format(port)),...wifiIfaces.filter(wifiIface=>!isNonWDSClient(wifiIface)).map(formatWifiDeviceSummary),];throw new TypeError(BRIDGED_NON_WDS_CLIENT_ERROR_TEMPLATE.format(networkSectionId,['',...nonWDSWiFiClients.map(formatWifiDeviceSummary)].join('\n - '),['',...otherBridgedDevices].join('\n - '),));}}
function setBridgeWithPorts(networkSectionId,ports){const currentDevice=uci.get('network',networkSectionId,'device');const existing=currentDevice&&uci.sections('network','device').find(s=>s.type=='bridge'&&s.name==currentDevice);if(existing){if(ports.length>0){uci.set('network',existing['.name'],'ports',ports);}
return existing['name'];}
const namePrefix=`br-${networkSectionId}`;let proposedName=namePrefix,i=0;let bridgeSectionId;for(;;){const existingBridge=uci.sections('network','device').find(s=>s.name===proposedName);if(!existingBridge){bridgeSectionId=uci.add('network','device');uci.set('network',bridgeSectionId,'name',proposedName);uci.set('network',bridgeSectionId,'type','bridge');break;}else if(!uci.sections('network','interface').some(s=>s.device===proposedName)){bridgeSectionId=existingBridge['.name'];break;}
proposedName=`${namePrefix}${++i}`;}
if(ports.length>0){uci.set('network',bridgeSectionId,'ports',ports);}
uci.set('network',networkSectionId,'device',proposedName);}
function getNetworkWifiIfaces(networkSectionId){return uci.sections('wireless','wifi-iface').filter(wifiIface=>wifiIface.disabled!=='1'&&wifiIface.network===networkSectionId);}
function getNetworkDevices(sectionId){const device=uci.get('network',sectionId,'device');const bridge=uci.sections('network','device').find(s=>s.name===device&&s.type==='bridge');let res;if(bridge){res=bridge.ports;}else{res=device;}
return res?L.toArray(res):[];}
function setNetworkDevices(sectionId,devices){const device=uci.get('network',sectionId,'device');const deviceSection=uci.sections('network','device').find(s=>s.name===device);if(device&&deviceSection&&deviceSection.type==='bridge'){uci.set('network',deviceSection['.name'],'ports',devices);}else if(devices.length===1){uci.set('network',sectionId,'device',devices[0]);}else if(devices.length>1){setBridgeWithPorts(sectionId,devices);}}
function setupNetworkWithDnsmasq(sectionId,ip,uplink=true){const dnsmasq=getOrCreateDnsmasq(sectionId);const dhcp=getOrCreateDhcp(dnsmasq,sectionId);uci.set('network',sectionId,'proto','static');uci.set('network',sectionId,'ipaddr',ip);uci.set('network',sectionId,'netmask','255.255.255.0');if(!uplink){uci.set('dhcp',dhcp,'dhcp_option',['3','6']);}else{uci.unset('dhcp',dnsmasq,'notinterface');uci.unset('dhcp',dhcp,'dhcp_option');}}
function getFirstIpaddrAndNetmask(iface){let netmask=uci.get('network',iface,'netmask');let ipaddr=uci.get('network',iface,'ipaddr');if(Array.isArray(ipaddr)){ipaddr=ipaddr[0];}
if(ipaddr){const ipaddrSplit=ipaddr.split('/');if(ipaddrSplit.length==2){ipaddr=ipaddrSplit[0];netmask=network.prefixToMask(ipaddrSplit[1]);}}
return{ipaddr,netmask};}
function getFirstIpaddr(iface){const{ipaddr}=getFirstIpaddrAndNetmask(iface);return ipaddr;}
function getFirstNetmask(iface){const{netmask}=getFirstIpaddrAndNetmask(iface);return netmask;}
function getEthernetPorts(builtinEthernetPorts,networkDevices){const ports={};for(const port of builtinEthernetPorts){ports[port.device]=Object.assign({builtin:true},port);}
for(const device of networkDevices){if(!['ethernet','vlan'].includes(device.getType())||device.dev.type===803){continue;}
ports[device.getName()]??={builtin:false,device:device.getName(),role:'wan'};ports[device.getName()].deviceinfo=device;}
return Object.values(ports);}
function getEthernetStaticIp(ports){const portsObj={};for(const port of ports){portsObj[port.device]=port;}
const builtinIps=[];const externalIps=[];for(const network of uci.sections('network','interface')){if(network.proto==='static'){for(const deviceName of getNetworkDevices(network['.name'])){if(portsObj[deviceName]){(portsObj[deviceName].builtin?builtinIps:externalIps).push(getFirstIpaddr(network['.name']));}}}}
if(builtinIps.length>0){return builtinIps[0];}else if(externalIps.length>0){return externalIps[0];}else{return null;}}
return baseclass.extend({getZoneForNetwork,getOrCreateZone,createDhcp,getOrCreateDnsmasq,getOrCreateDhcp,createOrRemoveBridgeAsNeeded,validateBridge,forceBridge,getNetworkDevices,setNetworkDevices,getNetworkWifiIfaces,getOrCreateForwarding,setupNetworkWithDnsmasq,getDefaultSSID,getDefaultWifiKey,getRandomMAC,getFakeMorseMAC,getFirstIpaddr,getFirstNetmask,getEthernetPorts,getEthernetStaticIp,});