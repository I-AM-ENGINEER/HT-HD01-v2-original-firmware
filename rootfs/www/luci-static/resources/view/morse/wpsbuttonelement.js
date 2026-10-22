'use strict';'require baseclass';'require fs';'require poll';'require rpc';const STYLE=`
button {
    margin: 2px;

    --default-btn-background: linear-gradient(var(--background-color-high), var(--background-color-high) 25%, var(--background-color-low));
    --on-color: var(--primary);

    cursor: pointer;
    display: inline-block;
    background: var(--default-btn-background);
    padding: 0 14px;
    color: var(--on-color);
    font-size: 13px;
    line-height: 2em;
    border: 1px solid var(--on-color);
    border-radius: 4px;
    white-space: pre;
}

button[disabled] {
    opacity: var(--disabled-opacity);
    pointer-events: none;
    cursor: default;
}

button:focus:enabled, button:hover:enabled {
    --focus-color-rgb: 82, 168, 236;
    outline: 0;
    border-color: rgba(var(--focus-color-rgb), 0.8) !important;
    box-shadow: inset 0 1px 3px hsla(var(--border-color-low-hsl), .01), 0 0 8px rgba(var(--focus-color-rgb), 0.6);
    text-decoration: none;
}

.spinning {
    position: relative;
    padding-left: 32px !important;
}

.spinning::before {
    --spinner-icon: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' stroke='%23000' stroke-width='3' fill='none'><circle cx='10' cy='10' r='8' stroke-opacity='.5'/><path d='M10 2c4 0 8 4 8 8'><animateTransform attributeName='transform' type='rotate' dur='1s' from='0 10 10' to='360 10 10' repeatCount='indefinite'/></path></svg>");

    position: absolute;
    top: calc(50% - 10px);
    left: 6px;
    width: 20px;
    height: 20px;
    content: " ";
    background: var(--on-color, #000);
    mask: var(--spinner-icon) center/cover no-repeat;
    -webkit-mask: var(--spinner-icon) center/cover no-repeat;
}
`;class AbstractWPSButtonElement extends HTMLElement{static STATES={INVISIBLE:'invisible',UPDATE_CONFIG:'update_config',AVAILABLE:'available',};constructor(){super();this.acting=false;this.attachShadow({mode:'open'});this.wpsStatus={pbc_status:'Unknown'};this.updateWPSStatusBound=this.updateWPSStatus.bind(this);this.shadowRoot.append(E('style',{},STYLE));this.shadowRoot.append(this.buttonElement=E('button'));}
isSupplicant(){return this.getAttribute('service')==='wpa_supplicant';}
updateActiveButton(){if(this.acting){this.buttonElement.disabled=true;this.buttonElement.classList.add('spinning');}
switch(this.wpsStatus.pbc_status){case'Active':this.buttonElement.textContent=_('Stop WPS');this.buttonElement.classList.add('spinning');this.buttonElement.onclick=()=>{this.stopWPS().catch(e=>e);this.update();};this.title=_('Waiting to connect - make sure you push the WPS button on the other device.');break;case'Disabled':case'Timed-out':case'Overlap':this.buttonElement.onclick=()=>{this.startWPS().catch(()=>this.buttonElement.classList.remove('spinning'));this.update();};if(this.isSupplicant()){this.title=_('Click this WPS (client) button to connect to an EasyMesh network. You must also push the normal WPS button on an existing Controller/Agent or Agent.');}else{this.title=_('Click this WPS button to allow another EasyMesh device to connect. You must also push the WPS (client) button on the new device.');}
break;case'Unknown':default:this.buttonElement.disabled=true;this.title=_('Unable to read current WPS status.');break;}}
update(){this.buttonElement.disabled=false;this.buttonElement.textContent=this.isSupplicant()?_('Start WPS (client)'):_('Start WPS');this.hidden=false;this.buttonElement.classList.remove('spinning');switch(this.getAttribute('state')){case this.constructor.STATES.INVISIBLE:this.hidden=true;break;case this.constructor.STATES.UPDATE_CONFIG:this.buttonElement.disabled=true;this.title=_('You must save the current mesh setting before starting WPS.');break;case this.constructor.STATES.AVAILABLE:this.updateActiveButton();break;}}
static get observedAttributes(){return['state'];}
attributeChangedCallback(name,oldValue,newValue){switch(name){case'state':if(newValue===this.constructor.STATES.AVAILABLE){this.updateWPSStatus();poll.add(this.updateWPSStatusBound,5);}else{poll.remove(this.updateWPSStatusBound);}
this.update();break;}}
connectedCallback(){if(!this.hasAttribute('state')){this.setAttribute('state',this.constructor.STATES.INVISIBLE);}
this.update();}
async startWPS(){this.acting=true;try{await this.backendStartWPS();this.updateWPSStatus();}finally{this.acting=false;}}
async stopWPS(){this.acting=true;try{await this.backendStopWPS();this.updateWPSStatus();}finally{this.acting=false;}}
async updateWPSStatus(){if(this.acting){return;}
try{this.wpsStatus=await this.backendGetWPSStatus();}catch(e){console.error(e,e.stack);this.wpsStatus={pbc_status:'Unknown'};}finally{this.update();}}}
class UbusWPSButtonElement extends AbstractWPSButtonElement{async backendStartWPS(){if(this.isSupplicant()){await rpc.declare({object:this.object,method:'wps_start',params:['multi_ap']})(true);}else{await rpc.declare({object:this.object,method:'wps_start'})();}}
async backendStopWPS(){await rpc.declare({object:this.object,method:'wps_stop'})();}
async backendGetWPSStatus(){return await rpc.declare({object:this.object,method:'wps_status'})();}}
class CLIWPSButtonElement extends AbstractWPSButtonElement{constructor(){super();this.startWPSTime=null;}
get command(){if(this.isSupplicant()){return'/usr/sbin/wpa_cli_s1g';}else{return'/usr/sbin/hostapd_cli_s1g';}}
async backendStartWPS(){if(this.isSupplicant()){this.startWPSTime=Date.now();try{await fs.exec(this.command,['wps_pbc','multi_ap=1']);}catch(e){this.startWPSTime=null;throw e;}}else{await fs.exec(this.command,['wps_pbc']);}}
async backendStopWPS(){await fs.exec(this.command,['wps_cancel']);this.startWPSTime=null;}
async backendGetWPSStatus(){if(this.isSupplicant()){if(this.startWPSTime&&Date.now()-this.startWPSTime<60000){return{pbc_status:'Active'};}else{return{pbc_status:'Disabled'};}}
const result=await fs.exec(this.command,['wps_get_status']);if(result.code===0){const regexResult=result.stdout.match(/^PBC Status: (.*$)/m);if(regexResult!=null){return{pbc_status:regexResult[1]};}}
return{pbc_status:'Unknown'};}}
class FakeWPSButtonElement extends AbstractWPSButtonElement{constructor(){super();this.state='Disabled';}
backendStartWPS(){clearInterval(this.interval);return new Promise((resolve)=>{this.interval=setTimeout(()=>{this.state='Active';this.interval=setTimeout(()=>this.state='Timed-out',10000);resolve();},1000);});}
backendStopWPS(){clearInterval(this.interval);return new Promise((resolve)=>{this.interval=setTimeout(()=>{this.state='Disabled';this.interval=setTimeout(()=>this.state='Timed-out',10000);resolve();},1000);});}
backendGetWPSStatus(){return Promise.resolve({pbc_status:this.state,});}}
customElements.define('ubus-wps-button',UbusWPSButtonElement);customElements.define('fake-wps-button',FakeWPSButtonElement);customElements.define('cli-wps-button',CLIWPSButtonElement);return baseclass.extend({});