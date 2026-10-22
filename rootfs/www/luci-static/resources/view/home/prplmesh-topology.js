'use strict';'require baseclass';'require rpc';const callDeviceWiFiDataElementsGet=rpc.declare({object:'Device.WiFi.DataElements',method:'_get',params:['depth'],});const PRERENDER_ITERATIONS=1000;function unpackDataModel(data){function unpackKey(d,k,v){let firstKey=k.split('.',1)[0];const remainingKey=k.slice(firstKey.length+1);const isNumber=/^\d+$/.test(firstKey);if(isNumber){firstKey=Number(firstKey)-1;}
if(isNumber!=Array.isArray(d)){console.error('Unexpected data when parsing Device.Wifi.DataElements.Network:',d,k,v);return;}
if(!remainingKey){if(typeof v==='string'){if(d[firstKey]){throw new Error(`overwriting - invalid structure ${firstKey} - ${k}`);}
d[firstKey]=v;}else{Object.assign(d[firstKey]??={},v);}}else{if(!d[firstKey]){d[firstKey]=/^\d+\./.test(remainingKey)?[]:{};}
unpackKey(d[firstKey],remainingKey,v);}}
const outputData={};const inputData=[...Object.entries(data)].sort((a,b)=>b[0].length-a[0].length);for(const[k,v]of inputData){if(!v){continue;}
unpackKey(outputData,k,v);}
return outputData;}
function*validItems(arr){if(!Array.isArray(arr)){return;}
for(const x of arr){if(x){yield x;}}}
class PrplmeshTopologyGraph{constructor(topoData,interactive=true,nodeWidth=240,nodeHeight=100){this.interactive=interactive;this.nodeHeight=nodeHeight;this.nodeWidth=nodeWidth;this.stateInfo=this.buildGraph(topoData);}
getStateInfo(){return this.stateInfo;}
buildGraph(topoData){const graph=this.graph=Viva.Graph.graph();const stateInfo=new Set();const network=topoData?.Device?.WiFi?.DataElements?.Network;if(!network){return graph;}
const controllerId=network.ControllerID;const idMap={};for(const device of validItems(network.Device)){let myID=validItems(device.Radio).next().value?.ID||device.ID;idMap[device.ID]=myID;for(const radio of validItems(device.Radio)){idMap[radio.ID]=myID;}
for(const iface of validItems(device.Interface)){idMap[iface.MACAddress]=myID;idMap[iface.Name]=myID;}}
function getID(id){return idMap[id]||id;}
for(const device of validItems(network.Device)){const halowIfaceEnabled=Array.from(validItems(device.Interface)).some(iface=>iface.MediaType==='IEEE_802_11AH'&&iface.Status==='Up');const radio=validItems(device.Radio).next().value;const radioEnabled=!!(radio?.Enabled)||halowIfaceEnabled;graph.addNode(idMap[device.ID],{controller:device.ID===controllerId,agent:true,macAddress:idMap[device.ID],backhaulMacAddress:device.MultiAPDevice?.Backhaul?.BackhaulMACAddress,enabled:radioEnabled,channel:radio?.CurrentOperatingClasses?.['1']?.Channel,model:device.ManufacturerModel,});stateInfo.add(`node:${idMap[device.ID]}:${radioEnabled}`);}
const signalStrengths={};for(const device of validItems(network.Device)){for(const radio of validItems(device.Radio)){for(const bss of validItems(radio.BSS)){for(const sta of validItems(bss.STA)){const id=getID(sta.MACAddress);const signalStrength=sta.SignalStrength>0?(sta.SignalStrength/2)-110:undefined;if(!graph.hasNode(id)){stateInfo.add(`node:${id}:true`);graph.addNode(id,{controller:false,agent:false,enabled:true,macAddress:sta.MACAddress});graph.addLink(idMap[device.ID],id,{signalStrength});}else{if(signalStrength){signalStrengths[`${idMap[device.ID]} - ${id}`]=signalStrengths[`${id} - ${idMap[device.ID]}`]=signalStrength;}}}}}}
for(const device of validItems(network.Device)){for(const iface of validItems(device.Interface)){if(!iface.Neighbor){continue;}
for(const neighbor of Object.values(iface.Neighbor)){const neighborID=getID(neighbor.ID);if(!graph.hasNode(neighborID)){stateInfo.add(`node:${neighborID}:true`);graph.addNode(neighborID,{agent:true,macAddress:neighbor.ID,enabled:true});}
if(!graph.hasLink(idMap[device.ID],neighborID)){graph.addLink(idMap[device.ID],neighborID,{signalStrength:signalStrengths[`${idMap[device.ID]} - ${neighborID}`]});}}}}
const associations={};for(const association of validItems(topoData?.Device?.WiFi?.DataElements?.AssociationEvent?.AssociationEventData)){const id=getID(association.MACAddress);if(!associations[id]||association.TimeStamp>associations[id].TimeStamp){associations[id]=association;}}
for(const disassociation of validItems(topoData?.Device?.WiFi?.DataElements?.DisassociationEvent?.DisassociationEventData)){const id=getID(disassociation.MACAddress);if(associations[id]&&associations[id].BSSID===disassociation.BSSID&&disassociation.TimeStamp>associations[id].TimeStamp){associations[id].disabled=true;}}
for(const[id,association]of Object.entries(associations)){const bssid=getID(association.BSSID);if(!graph.hasNode(bssid)){continue;}
if(!graph.hasNode(id)){stateInfo.add(`node:${id}:true`);graph.addNode(id,{agent:false,macAddress:association.MACAddress,enabled:!association.disabled});}
if(!graph.hasLink(bssid,id)){graph.addLink(bssid,id);}}
return stateInfo;}
findRoleDisplay(data){if(data.controller&&data.agent){return'Controller/Agent';}else if(data.controller){return'Controller';}else if(data.agent){return'Agent';}else{return'Client';}}
renderNode(data){return`
   <div
    class="node ${data.agent ? 'node-agent' : ''} ${data.controller ? 'node-controller' : ''} ${data.enabled ? '' : 'node-disabled'}"
    style="
     width: ${this.nodeWidth - 8}px;
     height: ${this.nodeHeight - 8}px;
    "
    xmlns="http://www.w3.org/1999/xhtml"
    title="${data.enabled ? 'active' : 'offline'}"
   >
    <div>
    ${data.model ? `<strong>${data.model}</strong><br>` : ''}
    ${this.findRoleDisplay(data)} ${data.channel ? `(Ch:${data.channel})` : ''}<br>
    <strong><code>${data.macAddress}</code></strong><br>
    ${data.backhaulMacAddress ? `<div><small><strong>Backhaul:</strong><code>${data.backhaulMacAddress}</code></small><br>` : ''}
    </div>
   </div>
  `;}
renderTo(container){const graphics=Viva.Graph.View.svgGraphics().node((node)=>{const foreignObject=Viva.Graph.svg('foreignObject').attr('width',this.nodeWidth).attr('height',this.nodeHeight);foreignObject.insertAdjacentHTML('beforeend',this.renderNode(node.data||{enabled:false,macAddress:'unknown'}));return foreignObject;}).placeNode((nodeUI,pos)=>{nodeUI.attr('x',pos.x-this.nodeWidth/2).attr('y',pos.y-this.nodeHeight/2);}).link((link)=>{const titleLine=Viva.Graph.svg('line').attr('stroke-width',20).attr('stroke','black').attr('stroke-opacity',0);const title=Viva.Graph.svg('title');title.textContent=link.data?.signalStrength?`RSSI: ${link.data?.signalStrength}dBm`:'RSSI: unknown';titleLine.append(title);const g=Viva.Graph.svg('g');g.append(Viva.Graph.svg('line').attr('stroke','black').attr('stroke-width',2));g.append(titleLine);return g;}).placeLink((link,from,to)=>{for(const line of link.querySelectorAll('line')){line.attr('x1',from.x);line.attr('y1',from.y);line.attr('x2',to.x);line.attr('y2',to.y);}
return link;});const layout=Viva.Graph.Layout.forceDirected(this.graph,{springLength:Math.max(this.nodeHeight,this.nodeWidth)*1.2,gravity:-3,});const renderer=Viva.Graph.View.renderer(this.graph,{graphics,layout,container,interactive:this.interactive,prerender:PRERENDER_ITERATIONS,});renderer.run();setTimeout(()=>renderer.reset(),0);return renderer;}}
class PrplmeshTopologyData{constructor(topoData){this.topoData=topoData;}
buildGraph(){return new PrplmeshTopologyGraph(this.topoData);}
countAgents(){const network=this.topoData?.Device?.WiFi?.DataElements?.Network;if(!network){return 0;}
const controllerId=network.ControllerID;let count=0;for(const device of validItems(network.Device)){if(device.ID===controllerId){continue;}
const halowIfaceEnabled=Array.from(validItems(device.Interface)).some(iface=>iface.MediaType==='IEEE_802_11AH'&&iface.Status==='Up');const radio=validItems(device.Radio).next().value;const radioEnabled=!!(radio?.Enabled)||halowIfaceEnabled;if(radioEnabled){count+=1;}}
return count;}}
return baseclass.extend({async load(){const[data]=await Promise.all([unpackDataModel(await callDeviceWiFiDataElementsGet(10)),import('./vivagraph.min.js'),]);return new PrplmeshTopologyData(data);},});