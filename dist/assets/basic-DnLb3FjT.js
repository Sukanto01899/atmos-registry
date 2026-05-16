import{i as L,e as M,r as B,a as I,b as c,C as O,A as S,O as q,c as E,d as _,f as fe,E as J,R as A,g as ze,H as yi,h as z,S as bt,W as De,j as te,k as li,T as Dt,l as Me,M as xi,m as Ci,w as ke,n as Gi,o as ci,p as Yi}from"./index-DWGoDKNc.js";import{n as u,c as C,o as x,r as y,U as le,e as Ji,f as Qi,a as Xi}from"./index-DJRNm8zn.js";import"./index-p3q4YtgS.js";const Zi=L`
  :host {
    position: relative;
    background-color: var(--wui-color-gray-glass-002);
    display: flex;
    justify-content: center;
    align-items: center;
    width: var(--local-size);
    height: var(--local-size);
    border-radius: inherit;
    border-radius: var(--local-border-radius);
  }

  :host > wui-flex {
    overflow: hidden;
    border-radius: inherit;
    border-radius: var(--local-border-radius);
  }

  :host::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: inherit;
    border: 1px solid var(--wui-color-gray-glass-010);
    pointer-events: none;
  }

  :host([name='Extension'])::after {
    border: 1px solid var(--wui-color-accent-glass-010);
  }

  :host([data-wallet-icon='allWallets']) {
    background-color: var(--wui-all-wallets-bg-100);
  }

  :host([data-wallet-icon='allWallets'])::after {
    border: 1px solid var(--wui-color-accent-glass-010);
  }

  wui-icon[data-parent-size='inherit'] {
    width: 75%;
    height: 75%;
    align-items: center;
  }

  wui-icon[data-parent-size='sm'] {
    width: 18px;
    height: 18px;
  }

  wui-icon[data-parent-size='md'] {
    width: 24px;
    height: 24px;
  }

  wui-icon[data-parent-size='lg'] {
    width: 42px;
    height: 42px;
  }

  wui-icon[data-parent-size='full'] {
    width: 100%;
    height: 100%;
  }

  :host > wui-icon-box {
    position: absolute;
    overflow: hidden;
    right: -1px;
    bottom: -2px;
    z-index: 1;
    border: 2px solid var(--wui-color-bg-150, #1e1f1f);
    padding: 1px;
  }
`;var $e=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let ce=class extends I{constructor(){super(...arguments),this.size="md",this.name="",this.installed=!1,this.badgeSize="xs"}render(){let e="xxs";return this.size==="lg"?e="m":this.size==="md"?e="xs":e="xxs",this.style.cssText=`
       --local-border-radius: var(--wui-border-radius-${e});
       --local-size: var(--wui-wallet-image-size-${this.size});
   `,this.walletIcon&&(this.dataset.walletIcon=this.walletIcon),c`
      <wui-flex justifyContent="center" alignItems="center"> ${this.templateVisual()} </wui-flex>
    `}templateVisual(){return this.imageSrc?c`<wui-image src=${this.imageSrc} alt=${this.name}></wui-image>`:this.walletIcon?c`<wui-icon
        data-parent-size="md"
        size="md"
        color="inherit"
        name=${this.walletIcon}
      ></wui-icon>`:c`<wui-icon
      data-parent-size=${this.size}
      size="inherit"
      color="inherit"
      name="walletPlaceholder"
    ></wui-icon>`}};ce.styles=[M,B,Zi];$e([u()],ce.prototype,"size",void 0);$e([u()],ce.prototype,"name",void 0);$e([u()],ce.prototype,"imageSrc",void 0);$e([u()],ce.prototype,"walletIcon",void 0);$e([u({type:Boolean})],ce.prototype,"installed",void 0);$e([u()],ce.prototype,"badgeSize",void 0);ce=$e([C("wui-wallet-image")],ce);const en=L`
  :host {
    position: relative;
    border-radius: var(--wui-border-radius-xxs);
    width: 40px;
    height: 40px;
    overflow: hidden;
    background: var(--wui-color-gray-glass-002);
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--wui-spacing-4xs);
    padding: 3.75px !important;
  }

  :host::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: inherit;
    border: 1px solid var(--wui-color-gray-glass-010);
    pointer-events: none;
  }

  :host > wui-wallet-image {
    width: 14px;
    height: 14px;
    border-radius: var(--wui-border-radius-5xs);
  }

  :host > wui-flex {
    padding: 2px;
    position: fixed;
    overflow: hidden;
    left: 34px;
    bottom: 8px;
    background: var(--dark-background-150, #1e1f1f);
    border-radius: 50%;
    z-index: 2;
    display: flex;
  }
`;var $i=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};const Ot=4;let nt=class extends I{constructor(){super(...arguments),this.walletImages=[]}render(){const e=this.walletImages.length<Ot;return c`${this.walletImages.slice(0,Ot).map(({src:i,walletName:o})=>c`
            <wui-wallet-image
              size="inherit"
              imageSrc=${i}
              name=${x(o)}
            ></wui-wallet-image>
          `)}
      ${e?[...Array(Ot-this.walletImages.length)].map(()=>c` <wui-wallet-image size="inherit" name=""></wui-wallet-image>`):null}
      <wui-flex>
        <wui-icon-box
          size="xxs"
          iconSize="xxs"
          iconcolor="success-100"
          backgroundcolor="success-100"
          icon="checkmark"
          background="opaque"
        ></wui-icon-box>
      </wui-flex>`}};nt.styles=[B,en];$i([u({type:Array})],nt.prototype,"walletImages",void 0);nt=$i([C("wui-all-wallets-image")],nt);const tn=L`
  button {
    column-gap: var(--wui-spacing-s);
    padding: 7px var(--wui-spacing-l) 7px var(--wui-spacing-xs);
    width: 100%;
    background-color: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-xs);
    color: var(--wui-color-fg-100);
  }

  button > wui-text:nth-child(2) {
    display: flex;
    flex: 1;
  }

  button:disabled {
    background-color: var(--wui-color-gray-glass-015);
    color: var(--wui-color-gray-glass-015);
  }

  button:disabled > wui-tag {
    background-color: var(--wui-color-gray-glass-010);
    color: var(--wui-color-fg-300);
  }

  wui-icon {
    color: var(--wui-color-fg-200) !important;
  }
`;var U=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let j=class extends I{constructor(){super(...arguments),this.walletImages=[],this.imageSrc="",this.name="",this.tabIdx=void 0,this.installed=!1,this.disabled=!1,this.showAllWallets=!1,this.loading=!1,this.loadingSpinnerColor="accent-100"}render(){return c`
      <button ?disabled=${this.disabled} tabindex=${x(this.tabIdx)}>
        ${this.templateAllWallets()} ${this.templateWalletImage()}
        <wui-text variant="paragraph-500" color="inherit">${this.name}</wui-text>
        ${this.templateStatus()}
      </button>
    `}templateAllWallets(){return this.showAllWallets&&this.imageSrc?c` <wui-all-wallets-image .imageeSrc=${this.imageSrc}> </wui-all-wallets-image> `:this.showAllWallets&&this.walletIcon?c` <wui-wallet-image .walletIcon=${this.walletIcon} size="sm"> </wui-wallet-image> `:null}templateWalletImage(){return!this.showAllWallets&&this.imageSrc?c`<wui-wallet-image
        size="sm"
        imageSrc=${this.imageSrc}
        name=${this.name}
        .installed=${this.installed}
      ></wui-wallet-image>`:!this.showAllWallets&&!this.imageSrc?c`<wui-wallet-image size="sm" name=${this.name}></wui-wallet-image>`:null}templateStatus(){return this.loading?c`<wui-loading-spinner
        size="lg"
        color=${this.loadingSpinnerColor}
      ></wui-loading-spinner>`:this.tagLabel&&this.tagVariant?c`<wui-tag variant=${this.tagVariant}>${this.tagLabel}</wui-tag>`:this.icon?c`<wui-icon color="inherit" size="sm" name=${this.icon}></wui-icon>`:null}};j.styles=[B,M,tn];U([u({type:Array})],j.prototype,"walletImages",void 0);U([u()],j.prototype,"imageSrc",void 0);U([u()],j.prototype,"name",void 0);U([u()],j.prototype,"tagLabel",void 0);U([u()],j.prototype,"tagVariant",void 0);U([u()],j.prototype,"icon",void 0);U([u()],j.prototype,"walletIcon",void 0);U([u()],j.prototype,"tabIdx",void 0);U([u({type:Boolean})],j.prototype,"installed",void 0);U([u({type:Boolean})],j.prototype,"disabled",void 0);U([u({type:Boolean})],j.prototype,"showAllWallets",void 0);U([u({type:Boolean})],j.prototype,"loading",void 0);U([u({type:String})],j.prototype,"loadingSpinnerColor",void 0);j=U([C("wui-list-wallet")],j);var Pe=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let me=class extends I{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=O.state.connectors,this.count=S.state.count,this.filteredCount=S.state.filteredWallets.length,this.isFetchingRecommendedWallets=S.state.isFetchingRecommendedWallets,this.unsubscribe.push(O.subscribeKey("connectors",e=>this.connectors=e),S.subscribeKey("count",e=>this.count=e),S.subscribeKey("filteredWallets",e=>this.filteredCount=e.length),S.subscribeKey("isFetchingRecommendedWallets",e=>this.isFetchingRecommendedWallets=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const e=this.connectors.find(h=>h.id==="walletConnect"),{allWallets:i}=q.state;if(!e||i==="HIDE"||i==="ONLY_MOBILE"&&!E.isMobile())return null;const o=S.state.featured.length,n=this.count+o,t=n<10?n:Math.floor(n/10)*10,a=this.filteredCount>0?this.filteredCount:t;let s=`${a}`;this.filteredCount>0?s=`${this.filteredCount}`:a<n&&(s=`${a}+`);const l=_.hasAnyConnection(fe.CONNECTOR_ID.WALLET_CONNECT);return c`
      <wui-list-wallet
        name="All Wallets"
        walletIcon="allWallets"
        showAllWallets
        @click=${this.onAllWallets.bind(this)}
        tagLabel=${s}
        tagVariant="shade"
        data-testid="all-wallets"
        tabIdx=${x(this.tabIdx)}
        .loading=${this.isFetchingRecommendedWallets}
        loadingSpinnerColor=${this.isFetchingRecommendedWallets?"fg-300":"accent-100"}
        ?disabled=${l}
      ></wui-list-wallet>
    `}onAllWallets(){J.sendEvent({type:"track",event:"CLICK_ALL_WALLETS"}),A.push("AllWallets")}};Pe([u()],me.prototype,"tabIdx",void 0);Pe([y()],me.prototype,"connectors",void 0);Pe([y()],me.prototype,"count",void 0);Pe([y()],me.prototype,"filteredCount",void 0);Pe([y()],me.prototype,"isFetchingRecommendedWallets",void 0);me=Pe([C("w3m-all-wallets-widget")],me);var mt=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let Ue=class extends I{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=O.state.connectors,this.connections=_.state.connections,this.unsubscribe.push(O.subscribeKey("connectors",e=>this.connectors=e),_.subscribeKey("connections",e=>this.connections=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const e=this.connectors.filter(i=>i.type==="ANNOUNCED");return e!=null&&e.length?c`
      <wui-flex flexDirection="column" gap="xs">
        ${e.filter(ze.showConnector).map(i=>{const n=(this.connections.get(i.chain)??[]).some(t=>yi.isLowerCaseMatch(t.connectorId,i.id));return c`
            <wui-list-wallet
              imageSrc=${x(z.getConnectorImage(i))}
              name=${i.name??"Unknown"}
              @click=${()=>this.onConnector(i)}
              tagVariant=${n?"shade":"success"}
              tagLabel=${n?"connected":"installed"}
              data-testid=${`wallet-selector-${i.id}`}
              .installed=${!0}
              tabIdx=${x(this.tabIdx)}
            >
            </wui-list-wallet>
          `})}
      </wui-flex>
    `:(this.style.cssText="display: none",null)}onConnector(e){e.id==="walletConnect"?E.isMobile()?A.push("AllWallets"):A.push("ConnectingWalletConnect"):A.push("ConnectingExternal",{connector:e})}};mt([u()],Ue.prototype,"tabIdx",void 0);mt([y()],Ue.prototype,"connectors",void 0);mt([y()],Ue.prototype,"connections",void 0);Ue=mt([C("w3m-connect-announced-widget")],Ue);var vt=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let Fe=class extends I{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=O.state.connectors,this.loading=!1,this.unsubscribe.push(O.subscribeKey("connectors",e=>this.connectors=e)),E.isTelegram()&&E.isIos()&&(this.loading=!_.state.wcUri,this.unsubscribe.push(_.subscribeKey("wcUri",e=>this.loading=!e)))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const{customWallets:e}=q.state;if(!(e!=null&&e.length))return this.style.cssText="display: none",null;const i=this.filterOutDuplicateWallets(e),o=_.hasAnyConnection(fe.CONNECTOR_ID.WALLET_CONNECT);return c`<wui-flex flexDirection="column" gap="xs">
      ${i.map(n=>c`
          <wui-list-wallet
            imageSrc=${x(z.getWalletImage(n))}
            name=${n.name??"Unknown"}
            @click=${()=>this.onConnectWallet(n)}
            data-testid=${`wallet-selector-${n.id}`}
            tabIdx=${x(this.tabIdx)}
            ?loading=${this.loading}
            ?disabled=${o}
          >
          </wui-list-wallet>
        `)}
    </wui-flex>`}filterOutDuplicateWallets(e){const i=bt.getRecentWallets(),o=this.connectors.map(s=>{var l;return(l=s.info)==null?void 0:l.rdns}).filter(Boolean),n=i.map(s=>s.rdns).filter(Boolean),t=o.concat(n);if(t.includes("io.metamask.mobile")&&E.isMobile()){const s=t.indexOf("io.metamask.mobile");t[s]="io.metamask"}return e.filter(s=>!t.includes(String(s==null?void 0:s.rdns)))}onConnectWallet(e){this.loading||A.push("ConnectingWalletConnect",{wallet:e})}};vt([u()],Fe.prototype,"tabIdx",void 0);vt([y()],Fe.prototype,"connectors",void 0);vt([y()],Fe.prototype,"loading",void 0);Fe=vt([C("w3m-connect-custom-widget")],Fe);var Jt=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let ot=class extends I{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=O.state.connectors,this.unsubscribe.push(O.subscribeKey("connectors",e=>this.connectors=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const o=this.connectors.filter(t=>t.type==="EXTERNAL").filter(ze.showConnector).filter(t=>t.id!==fe.CONNECTOR_ID.COINBASE_SDK);if(!(o!=null&&o.length))return this.style.cssText="display: none",null;const n=_.hasAnyConnection(fe.CONNECTOR_ID.WALLET_CONNECT);return c`
      <wui-flex flexDirection="column" gap="xs">
        ${o.map(t=>c`
            <wui-list-wallet
              imageSrc=${x(z.getConnectorImage(t))}
              .installed=${!0}
              name=${t.name??"Unknown"}
              data-testid=${`wallet-selector-external-${t.id}`}
              @click=${()=>this.onConnector(t)}
              tabIdx=${x(this.tabIdx)}
              ?disabled=${n}
            >
            </wui-list-wallet>
          `)}
      </wui-flex>
    `}onConnector(e){A.push("ConnectingExternal",{connector:e})}};Jt([u()],ot.prototype,"tabIdx",void 0);Jt([y()],ot.prototype,"connectors",void 0);ot=Jt([C("w3m-connect-external-widget")],ot);var Qt=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let rt=class extends I{constructor(){super(...arguments),this.tabIdx=void 0,this.wallets=[]}render(){if(!this.wallets.length)return this.style.cssText="display: none",null;const e=_.hasAnyConnection(fe.CONNECTOR_ID.WALLET_CONNECT);return c`
      <wui-flex flexDirection="column" gap="xs">
        ${this.wallets.map(i=>c`
            <wui-list-wallet
              data-testid=${`wallet-selector-featured-${i.id}`}
              imageSrc=${x(z.getWalletImage(i))}
              name=${i.name??"Unknown"}
              @click=${()=>this.onConnectWallet(i)}
              tabIdx=${x(this.tabIdx)}
              ?disabled=${e}
            >
            </wui-list-wallet>
          `)}
      </wui-flex>
    `}onConnectWallet(e){O.selectWalletConnector(e)}};Qt([u()],rt.prototype,"tabIdx",void 0);Qt([u()],rt.prototype,"wallets",void 0);rt=Qt([C("w3m-connect-featured-widget")],rt);var yt=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let Ve=class extends I{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=[],this.connections=_.state.connections,this.unsubscribe.push(_.subscribeKey("connections",e=>this.connections=e))}render(){const e=this.connectors.filter(ze.showConnector);return e.length===0?(this.style.cssText="display: none",null):c`
      <wui-flex flexDirection="column" gap="xs">
        ${e.map(i=>{const n=(this.connections.get(i.chain)??[]).some(t=>yi.isLowerCaseMatch(t.connectorId,i.id));return c`
            <wui-list-wallet
              imageSrc=${x(z.getConnectorImage(i))}
              .installed=${!0}
              name=${i.name??"Unknown"}
              tagVariant=${n?"shade":"success"}
              tagLabel=${n?"connected":"installed"}
              data-testid=${`wallet-selector-${i.id}`}
              @click=${()=>this.onConnector(i)}
              tabIdx=${x(this.tabIdx)}
            >
            </wui-list-wallet>
          `})}
      </wui-flex>
    `}onConnector(e){O.setActiveConnector(e),A.push("ConnectingExternal",{connector:e})}};yt([u()],Ve.prototype,"tabIdx",void 0);yt([u()],Ve.prototype,"connectors",void 0);yt([y()],Ve.prototype,"connections",void 0);Ve=yt([C("w3m-connect-injected-widget")],Ve);var Xt=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let at=class extends I{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=O.state.connectors,this.unsubscribe.push(O.subscribeKey("connectors",e=>this.connectors=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const e=this.connectors.filter(i=>i.type==="MULTI_CHAIN"&&i.name!=="WalletConnect");return e!=null&&e.length?c`
      <wui-flex flexDirection="column" gap="xs">
        ${e.map(i=>c`
            <wui-list-wallet
              imageSrc=${x(z.getConnectorImage(i))}
              .installed=${!0}
              name=${i.name??"Unknown"}
              tagVariant="shade"
              tagLabel="multichain"
              data-testid=${`wallet-selector-${i.id}`}
              @click=${()=>this.onConnector(i)}
              tabIdx=${x(this.tabIdx)}
            >
            </wui-list-wallet>
          `)}
      </wui-flex>
    `:(this.style.cssText="display: none",null)}onConnector(e){O.setActiveConnector(e),A.push("ConnectingMultiChain")}};Xt([u()],at.prototype,"tabIdx",void 0);Xt([y()],at.prototype,"connectors",void 0);at=Xt([C("w3m-connect-multi-chain-widget")],at);var xt=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let qe=class extends I{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=O.state.connectors,this.loading=!1,this.unsubscribe.push(O.subscribeKey("connectors",e=>this.connectors=e)),E.isTelegram()&&E.isIos()&&(this.loading=!_.state.wcUri,this.unsubscribe.push(_.subscribeKey("wcUri",e=>this.loading=!e)))}render(){const i=bt.getRecentWallets().filter(n=>!De.isExcluded(n)).filter(n=>!this.hasWalletConnector(n)).filter(n=>this.isWalletCompatibleWithCurrentChain(n));if(!i.length)return this.style.cssText="display: none",null;const o=_.hasAnyConnection(fe.CONNECTOR_ID.WALLET_CONNECT);return c`
      <wui-flex flexDirection="column" gap="xs">
        ${i.map(n=>c`
            <wui-list-wallet
              imageSrc=${x(z.getWalletImage(n))}
              name=${n.name??"Unknown"}
              @click=${()=>this.onConnectWallet(n)}
              tagLabel="recent"
              tagVariant="shade"
              tabIdx=${x(this.tabIdx)}
              ?loading=${this.loading}
              ?disabled=${o}
            >
            </wui-list-wallet>
          `)}
      </wui-flex>
    `}onConnectWallet(e){this.loading||O.selectWalletConnector(e)}hasWalletConnector(e){return this.connectors.some(i=>i.id===e.id||i.name===e.name)}isWalletCompatibleWithCurrentChain(e){const i=te.state.activeChain;return i&&e.chains?e.chains.some(o=>{const n=o.split(":")[0];return i===n}):!0}};xt([u()],qe.prototype,"tabIdx",void 0);xt([y()],qe.prototype,"connectors",void 0);xt([y()],qe.prototype,"loading",void 0);qe=xt([C("w3m-connect-recent-widget")],qe);var Ct=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let He=class extends I{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.wallets=[],this.loading=!1,E.isTelegram()&&E.isIos()&&(this.loading=!_.state.wcUri,this.unsubscribe.push(_.subscribeKey("wcUri",e=>this.loading=!e)))}render(){const{connectors:e}=O.state,{customWallets:i,featuredWalletIds:o}=q.state,n=bt.getRecentWallets(),t=e.find(g=>g.id==="walletConnect"),s=e.filter(g=>g.type==="INJECTED"||g.type==="ANNOUNCED"||g.type==="MULTI_CHAIN").filter(g=>g.name!=="Browser Wallet");if(!t)return null;if(o||i||!this.wallets.length)return this.style.cssText="display: none",null;const l=s.length+n.length,h=Math.max(0,2-l),d=De.filterOutDuplicateWallets(this.wallets).slice(0,h);if(!d.length)return this.style.cssText="display: none",null;const T=_.hasAnyConnection(fe.CONNECTOR_ID.WALLET_CONNECT);return c`
      <wui-flex flexDirection="column" gap="xs">
        ${d.map(g=>c`
            <wui-list-wallet
              imageSrc=${x(z.getWalletImage(g))}
              name=${(g==null?void 0:g.name)??"Unknown"}
              @click=${()=>this.onConnectWallet(g)}
              tabIdx=${x(this.tabIdx)}
              ?loading=${this.loading}
              ?disabled=${T}
            >
            </wui-list-wallet>
          `)}
      </wui-flex>
    `}onConnectWallet(e){if(this.loading)return;const i=O.getConnector({id:e.id,rdns:e.rdns});i?A.push("ConnectingExternal",{connector:i}):A.push("ConnectingWalletConnect",{wallet:e})}};Ct([u()],He.prototype,"tabIdx",void 0);Ct([u()],He.prototype,"wallets",void 0);Ct([y()],He.prototype,"loading",void 0);He=Ct([C("w3m-connect-recommended-widget")],He);var $t=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let Ke=class extends I{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=O.state.connectors,this.connectorImages=li.state.connectorImages,this.unsubscribe.push(O.subscribeKey("connectors",e=>this.connectors=e),li.subscribeKey("connectorImages",e=>this.connectorImages=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){if(E.isMobile())return this.style.cssText="display: none",null;const e=this.connectors.find(n=>n.id==="walletConnect");if(!e)return this.style.cssText="display: none",null;const i=e.imageUrl||this.connectorImages[(e==null?void 0:e.imageId)??""],o=_.hasAnyConnection(fe.CONNECTOR_ID.WALLET_CONNECT);return c`
      <wui-list-wallet
        imageSrc=${x(i)}
        name=${e.name??"Unknown"}
        @click=${()=>this.onConnector(e)}
        tagLabel="qr code"
        tagVariant="main"
        tabIdx=${x(this.tabIdx)}
        data-testid="wallet-selector-walletconnect"
        ?disabled=${o}
      >
      </wui-list-wallet>
    `}onConnector(e){O.setActiveConnector(e),A.push("ConnectingWalletConnect")}};$t([u()],Ke.prototype,"tabIdx",void 0);$t([y()],Ke.prototype,"connectors",void 0);$t([y()],Ke.prototype,"connectorImages",void 0);Ke=$t([C("w3m-connect-walletconnect-widget")],Ke);const nn=L`
  :host {
    margin-top: var(--wui-spacing-3xs);
  }
  wui-separator {
    margin: var(--wui-spacing-m) calc(var(--wui-spacing-m) * -1) var(--wui-spacing-xs)
      calc(var(--wui-spacing-m) * -1);
    width: calc(100% + var(--wui-spacing-s) * 2);
  }
`;var Ye=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let ve=class extends I{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=O.state.connectors,this.recommended=S.state.recommended,this.featured=S.state.featured,this.unsubscribe.push(O.subscribeKey("connectors",e=>this.connectors=e),S.subscribeKey("recommended",e=>this.recommended=e),S.subscribeKey("featured",e=>this.featured=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return c`
      <wui-flex flexDirection="column" gap="xs"> ${this.connectorListTemplate()} </wui-flex>
    `}connectorListTemplate(){const{custom:e,recent:i,announced:o,injected:n,multiChain:t,recommended:a,featured:s,external:l}=ze.getConnectorsByType(this.connectors,this.recommended,this.featured);return ze.getConnectorTypeOrder({custom:e,recent:i,announced:o,injected:n,multiChain:t,recommended:a,featured:s,external:l}).map(d=>{switch(d){case"injected":return c`
            ${t.length?c`<w3m-connect-multi-chain-widget
                  tabIdx=${x(this.tabIdx)}
                ></w3m-connect-multi-chain-widget>`:null}
            ${o.length?c`<w3m-connect-announced-widget
                  tabIdx=${x(this.tabIdx)}
                ></w3m-connect-announced-widget>`:null}
            ${n.length?c`<w3m-connect-injected-widget
                  .connectors=${n}
                  tabIdx=${x(this.tabIdx)}
                ></w3m-connect-injected-widget>`:null}
          `;case"walletConnect":return c`<w3m-connect-walletconnect-widget
            tabIdx=${x(this.tabIdx)}
          ></w3m-connect-walletconnect-widget>`;case"recent":return c`<w3m-connect-recent-widget
            tabIdx=${x(this.tabIdx)}
          ></w3m-connect-recent-widget>`;case"featured":return c`<w3m-connect-featured-widget
            .wallets=${s}
            tabIdx=${x(this.tabIdx)}
          ></w3m-connect-featured-widget>`;case"custom":return c`<w3m-connect-custom-widget
            tabIdx=${x(this.tabIdx)}
          ></w3m-connect-custom-widget>`;case"external":return c`<w3m-connect-external-widget
            tabIdx=${x(this.tabIdx)}
          ></w3m-connect-external-widget>`;case"recommended":return c`<w3m-connect-recommended-widget
            .wallets=${a}
            tabIdx=${x(this.tabIdx)}
          ></w3m-connect-recommended-widget>`;default:return console.warn(`Unknown connector type: ${d}`),null}})}};ve.styles=nn;Ye([u()],ve.prototype,"tabIdx",void 0);Ye([y()],ve.prototype,"connectors",void 0);Ye([y()],ve.prototype,"recommended",void 0);Ye([y()],ve.prototype,"featured",void 0);ve=Ye([C("w3m-connector-list")],ve);const on=L`
  :host {
    display: inline-flex;
    background-color: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-3xl);
    padding: var(--wui-spacing-3xs);
    position: relative;
    height: 36px;
    min-height: 36px;
    overflow: hidden;
  }

  :host::before {
    content: '';
    position: absolute;
    pointer-events: none;
    top: 4px;
    left: 4px;
    display: block;
    width: var(--local-tab-width);
    height: 28px;
    border-radius: var(--wui-border-radius-3xl);
    background-color: var(--wui-color-gray-glass-002);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-002);
    transform: translateX(calc(var(--local-tab) * var(--local-tab-width)));
    transition: transform var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: background-color, opacity;
  }

  :host([data-type='flex'])::before {
    left: 3px;
    transform: translateX(calc((var(--local-tab) * 34px) + (var(--local-tab) * 4px)));
  }

  :host([data-type='flex']) {
    display: flex;
    padding: 0px 0px 0px 12px;
    gap: 4px;
  }

  :host([data-type='flex']) > button > wui-text {
    position: absolute;
    left: 18px;
    opacity: 0;
  }

  button[data-active='true'] > wui-icon,
  button[data-active='true'] > wui-text {
    color: var(--wui-color-fg-100);
  }

  button[data-active='false'] > wui-icon,
  button[data-active='false'] > wui-text {
    color: var(--wui-color-fg-200);
  }

  button[data-active='true']:disabled,
  button[data-active='false']:disabled {
    background-color: transparent;
    opacity: 0.5;
    cursor: not-allowed;
  }

  button[data-active='true']:disabled > wui-text {
    color: var(--wui-color-fg-200);
  }

  button[data-active='false']:disabled > wui-text {
    color: var(--wui-color-fg-300);
  }

  button > wui-icon,
  button > wui-text {
    pointer-events: none;
    transition: color var(--wui-e ase-out-power-1) var(--wui-duration-md);
    will-change: color;
  }

  button {
    width: var(--local-tab-width);
    transition: background-color var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: background-color;
  }

  :host([data-type='flex']) > button {
    width: 34px;
    position: relative;
    display: flex;
    justify-content: flex-start;
  }

  button:hover:enabled,
  button:active:enabled {
    background-color: transparent !important;
  }

  button:hover:enabled > wui-icon,
  button:active:enabled > wui-icon {
    transition: all var(--wui-ease-out-power-1) var(--wui-duration-lg);
    color: var(--wui-color-fg-125);
  }

  button:hover:enabled > wui-text,
  button:active:enabled > wui-text {
    transition: all var(--wui-ease-out-power-1) var(--wui-duration-lg);
    color: var(--wui-color-fg-125);
  }

  button {
    border-radius: var(--wui-border-radius-3xl);
  }
`;var we=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let ie=class extends I{constructor(){super(...arguments),this.tabs=[],this.onTabChange=()=>null,this.buttons=[],this.disabled=!1,this.localTabWidth="100px",this.activeTab=0,this.isDense=!1}render(){return this.isDense=this.tabs.length>3,this.style.cssText=`
      --local-tab: ${this.activeTab};
      --local-tab-width: ${this.localTabWidth};
    `,this.dataset.type=this.isDense?"flex":"block",this.tabs.map((e,i)=>{var n;const o=i===this.activeTab;return c`
        <button
          ?disabled=${this.disabled}
          @click=${()=>this.onTabClick(i)}
          data-active=${o}
          data-testid="tab-${(n=e.label)==null?void 0:n.toLowerCase()}"
        >
          ${this.iconTemplate(e)}
          <wui-text variant="small-600" color="inherit"> ${e.label} </wui-text>
        </button>
      `})}firstUpdated(){this.shadowRoot&&this.isDense&&(this.buttons=[...this.shadowRoot.querySelectorAll("button")],setTimeout(()=>{this.animateTabs(0,!0)},0))}iconTemplate(e){return e.icon?c`<wui-icon size="xs" color="inherit" name=${e.icon}></wui-icon>`:null}onTabClick(e){this.buttons&&this.animateTabs(e,!1),this.activeTab=e,this.onTabChange(e)}animateTabs(e,i){const o=this.buttons[this.activeTab],n=this.buttons[e],t=o==null?void 0:o.querySelector("wui-text"),a=n==null?void 0:n.querySelector("wui-text"),s=n==null?void 0:n.getBoundingClientRect(),l=a==null?void 0:a.getBoundingClientRect();o&&t&&!i&&e!==this.activeTab&&(t.animate([{opacity:0}],{duration:50,easing:"ease",fill:"forwards"}),o.animate([{width:"34px"}],{duration:500,easing:"ease",fill:"forwards"})),n&&s&&l&&a&&(e!==this.activeTab||i)&&(this.localTabWidth=`${Math.round(s.width+l.width)+6}px`,n.animate([{width:`${s.width+l.width}px`}],{duration:i?0:500,fill:"forwards",easing:"ease"}),a.animate([{opacity:1}],{duration:i?0:125,delay:i?0:200,fill:"forwards",easing:"ease"}))}};ie.styles=[B,M,on];we([u({type:Array})],ie.prototype,"tabs",void 0);we([u()],ie.prototype,"onTabChange",void 0);we([u({type:Array})],ie.prototype,"buttons",void 0);we([u({type:Boolean})],ie.prototype,"disabled",void 0);we([u()],ie.prototype,"localTabWidth",void 0);we([y()],ie.prototype,"activeTab",void 0);we([y()],ie.prototype,"isDense",void 0);ie=we([C("wui-tabs")],ie);var Zt=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let st=class extends I{constructor(){super(...arguments),this.platformTabs=[],this.unsubscribe=[],this.platforms=[],this.onSelectPlatfrom=void 0}disconnectCallback(){this.unsubscribe.forEach(e=>e())}render(){const e=this.generateTabs();return c`
      <wui-flex justifyContent="center" .padding=${["0","0","l","0"]}>
        <wui-tabs .tabs=${e} .onTabChange=${this.onTabChange.bind(this)}></wui-tabs>
      </wui-flex>
    `}generateTabs(){const e=this.platforms.map(i=>i==="browser"?{label:"Browser",icon:"extension",platform:"browser"}:i==="mobile"?{label:"Mobile",icon:"mobile",platform:"mobile"}:i==="qrcode"?{label:"Mobile",icon:"mobile",platform:"qrcode"}:i==="web"?{label:"Webapp",icon:"browser",platform:"web"}:i==="desktop"?{label:"Desktop",icon:"desktop",platform:"desktop"}:{label:"Browser",icon:"extension",platform:"unsupported"});return this.platformTabs=e.map(({platform:i})=>i),e}onTabChange(e){var o;const i=this.platformTabs[e];i&&((o=this.onSelectPlatfrom)==null||o.call(this,i))}};Zt([u({type:Array})],st.prototype,"platforms",void 0);Zt([u()],st.prototype,"onSelectPlatfrom",void 0);st=Zt([C("w3m-connecting-header")],st);const rn=L`
  :host {
    width: var(--local-width);
    position: relative;
  }

  button {
    border: none;
    border-radius: var(--local-border-radius);
    width: var(--local-width);
    white-space: nowrap;
  }

  /* -- Sizes --------------------------------------------------- */
  button[data-size='xs'] {
    padding: var(--wui-spacing-3xs) var(--wui-spacing-s) var(--wui-spacing-3xs) var(--wui-spacing-s);
    height: 24px;
  }

  button[data-size='xs'][data-icon-left='true'][data-icon-right='false'] {
    padding: var(--wui-spacing-3xs) var(--wui-spacing-s) var(--wui-spacing-3xs) var(--wui-spacing-s);
  }

  button[data-size='xs'][data-icon-right='true'][data-icon-left='false'] {
    padding: var(--wui-spacing-3xs) var(--wui-spacing-s) var(--wui-spacing-3xs) var(--wui-spacing-s);
  }

  button[data-size='sm'] {
    padding: 7.2px var(--wui-spacing-s) 7.2px var(--wui-spacing-s);
    height: 32px;
  }

  button[data-size='sm'][data-icon-left='true'][data-icon-right='false'] {
    padding: 7.2px var(--wui-spacing-s) 7.2px var(--wui-spacing-s);
  }

  button[data-size='sm'][data-icon-right='true'][data-icon-left='false'] {
    padding: 7.2px var(--wui-spacing-s) 7.2px var(--wui-spacing-s);
  }

  button[data-size='md'] {
    padding: 8.2px var(--wui-spacing-l) 9px var(--wui-spacing-l);
    height: 36px;
  }

  button[data-size='md'][data-icon-left='true'][data-icon-right='false'] {
    padding: 8.2px var(--wui-spacing-l) 9px var(--wui-spacing-s);
  }

  button[data-size='md'][data-icon-right='true'][data-icon-left='false'] {
    padding: 8.2px var(--wui-spacing-s) 9px var(--wui-spacing-l);
  }

  button[data-size='lg'] {
    padding: var(--wui-spacing-m) var(--wui-spacing-2l);
    height: 48px;
  }

  /* -- Variants --------------------------------------------------------- */
  button[data-variant='main'] {
    background-color: var(--wui-color-accent-100);
    color: var(--wui-color-inverse-100);
    border: none;
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-010);
  }

  button[data-variant='inverse'] {
    background-color: var(--wui-color-inverse-100);
    color: var(--wui-color-inverse-000);
    border: none;
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-010);
  }

  button[data-variant='accent'] {
    background-color: var(--wui-color-accent-glass-010);
    color: var(--wui-color-accent-100);
    border: none;
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-005);
  }

  button[data-variant='accent-error'] {
    background: var(--wui-color-error-glass-015);
    color: var(--wui-color-error-100);
    border: none;
    box-shadow: inset 0 0 0 1px var(--wui-color-error-glass-010);
  }

  button[data-variant='accent-success'] {
    background: var(--wui-color-success-glass-015);
    color: var(--wui-color-success-100);
    border: none;
    box-shadow: inset 0 0 0 1px var(--wui-color-success-glass-010);
  }

  button[data-variant='neutral'] {
    background: transparent;
    color: var(--wui-color-fg-100);
    border: none;
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-005);
  }

  /* -- Focus states --------------------------------------------------- */
  button[data-variant='main']:focus-visible:enabled {
    background-color: var(--wui-color-accent-090);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-accent-100),
      0 0 0 4px var(--wui-color-accent-glass-020);
  }
  button[data-variant='inverse']:focus-visible:enabled {
    background-color: var(--wui-color-inverse-100);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-gray-glass-010),
      0 0 0 4px var(--wui-color-accent-glass-020);
  }
  button[data-variant='accent']:focus-visible:enabled {
    background-color: var(--wui-color-accent-glass-010);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-accent-100),
      0 0 0 4px var(--wui-color-accent-glass-020);
  }
  button[data-variant='accent-error']:focus-visible:enabled {
    background: var(--wui-color-error-glass-015);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-error-100),
      0 0 0 4px var(--wui-color-error-glass-020);
  }
  button[data-variant='accent-success']:focus-visible:enabled {
    background: var(--wui-color-success-glass-015);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-success-100),
      0 0 0 4px var(--wui-color-success-glass-020);
  }
  button[data-variant='neutral']:focus-visible:enabled {
    background: var(--wui-color-gray-glass-005);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-gray-glass-010),
      0 0 0 4px var(--wui-color-gray-glass-002);
  }

  /* -- Hover & Active states ----------------------------------------------------------- */
  @media (hover: hover) and (pointer: fine) {
    button[data-variant='main']:hover:enabled {
      background-color: var(--wui-color-accent-090);
    }

    button[data-variant='main']:active:enabled {
      background-color: var(--wui-color-accent-080);
    }

    button[data-variant='accent']:hover:enabled {
      background-color: var(--wui-color-accent-glass-015);
    }

    button[data-variant='accent']:active:enabled {
      background-color: var(--wui-color-accent-glass-020);
    }

    button[data-variant='accent-error']:hover:enabled {
      background: var(--wui-color-error-glass-020);
      color: var(--wui-color-error-100);
    }

    button[data-variant='accent-error']:active:enabled {
      background: var(--wui-color-error-glass-030);
      color: var(--wui-color-error-100);
    }

    button[data-variant='accent-success']:hover:enabled {
      background: var(--wui-color-success-glass-020);
      color: var(--wui-color-success-100);
    }

    button[data-variant='accent-success']:active:enabled {
      background: var(--wui-color-success-glass-030);
      color: var(--wui-color-success-100);
    }

    button[data-variant='neutral']:hover:enabled {
      background: var(--wui-color-gray-glass-002);
    }

    button[data-variant='neutral']:active:enabled {
      background: var(--wui-color-gray-glass-005);
    }

    button[data-size='lg'][data-icon-left='true'][data-icon-right='false'] {
      padding-left: var(--wui-spacing-m);
    }

    button[data-size='lg'][data-icon-right='true'][data-icon-left='false'] {
      padding-right: var(--wui-spacing-m);
    }
  }

  /* -- Disabled state --------------------------------------------------- */
  button:disabled {
    background-color: var(--wui-color-gray-glass-002);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-002);
    color: var(--wui-color-gray-glass-020);
    cursor: not-allowed;
  }

  button > wui-text {
    transition: opacity var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: opacity;
    opacity: var(--local-opacity-100);
  }

  ::slotted(*) {
    transition: opacity var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: opacity;
    opacity: var(--local-opacity-100);
  }

  wui-loading-spinner {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    opacity: var(--local-opacity-000);
  }
`;var ne=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};const ui={main:"inverse-100",inverse:"inverse-000",accent:"accent-100","accent-error":"error-100","accent-success":"success-100",neutral:"fg-100",disabled:"gray-glass-020"},an={lg:"paragraph-600",md:"small-600",sm:"small-600",xs:"tiny-600"},sn={lg:"md",md:"md",sm:"sm",xs:"sm"};let H=class extends I{constructor(){super(...arguments),this.size="lg",this.disabled=!1,this.fullWidth=!1,this.loading=!1,this.variant="main",this.hasIconLeft=!1,this.hasIconRight=!1,this.borderRadius="m"}render(){this.style.cssText=`
    --local-width: ${this.fullWidth?"100%":"auto"};
    --local-opacity-100: ${this.loading?0:1};
    --local-opacity-000: ${this.loading?1:0};
    --local-border-radius: var(--wui-border-radius-${this.borderRadius});
    `;const e=this.textVariant??an[this.size];return c`
      <button
        data-variant=${this.variant}
        data-icon-left=${this.hasIconLeft}
        data-icon-right=${this.hasIconRight}
        data-size=${this.size}
        ?disabled=${this.disabled}
      >
        ${this.loadingTemplate()}
        <slot name="iconLeft" @slotchange=${()=>this.handleSlotLeftChange()}></slot>
        <wui-text variant=${e} color="inherit">
          <slot></slot>
        </wui-text>
        <slot name="iconRight" @slotchange=${()=>this.handleSlotRightChange()}></slot>
      </button>
    `}handleSlotLeftChange(){this.hasIconLeft=!0}handleSlotRightChange(){this.hasIconRight=!0}loadingTemplate(){if(this.loading){const e=sn[this.size],i=this.disabled?ui.disabled:ui[this.variant];return c`<wui-loading-spinner color=${i} size=${e}></wui-loading-spinner>`}return c``}};H.styles=[B,M,rn];ne([u()],H.prototype,"size",void 0);ne([u({type:Boolean})],H.prototype,"disabled",void 0);ne([u({type:Boolean})],H.prototype,"fullWidth",void 0);ne([u({type:Boolean})],H.prototype,"loading",void 0);ne([u()],H.prototype,"variant",void 0);ne([u({type:Boolean})],H.prototype,"hasIconLeft",void 0);ne([u({type:Boolean})],H.prototype,"hasIconRight",void 0);ne([u()],H.prototype,"borderRadius",void 0);ne([u()],H.prototype,"textVariant",void 0);H=ne([C("wui-button")],H);const ln=L`
  button {
    padding: var(--wui-spacing-4xs) var(--wui-spacing-xxs);
    border-radius: var(--wui-border-radius-3xs);
    background-color: transparent;
    color: var(--wui-color-accent-100);
  }

  button:disabled {
    background-color: transparent;
    color: var(--wui-color-gray-glass-015);
  }

  button:hover {
    background-color: var(--wui-color-gray-glass-005);
  }
`;var Rt=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let _e=class extends I{constructor(){super(...arguments),this.tabIdx=void 0,this.disabled=!1,this.color="inherit"}render(){return c`
      <button ?disabled=${this.disabled} tabindex=${x(this.tabIdx)}>
        <slot name="iconLeft"></slot>
        <wui-text variant="small-600" color=${this.color}>
          <slot></slot>
        </wui-text>
        <slot name="iconRight"></slot>
      </button>
    `}};_e.styles=[B,M,ln];Rt([u()],_e.prototype,"tabIdx",void 0);Rt([u({type:Boolean})],_e.prototype,"disabled",void 0);Rt([u()],_e.prototype,"color",void 0);_e=Rt([C("wui-link")],_e);const cn=L`
  :host {
    display: block;
    width: var(--wui-box-size-md);
    height: var(--wui-box-size-md);
  }

  svg {
    width: var(--wui-box-size-md);
    height: var(--wui-box-size-md);
  }

  rect {
    fill: none;
    stroke: var(--wui-color-accent-100);
    stroke-width: 4px;
    stroke-linecap: round;
    animation: dash 1s linear infinite;
  }

  @keyframes dash {
    to {
      stroke-dashoffset: 0px;
    }
  }
`;var Ri=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let lt=class extends I{constructor(){super(...arguments),this.radius=36}render(){return this.svgLoaderTemplate()}svgLoaderTemplate(){const e=this.radius>50?50:this.radius,o=36-e,n=116+o,t=245+o,a=360+o*1.75;return c`
      <svg viewBox="0 0 110 110" width="110" height="110">
        <rect
          x="2"
          y="2"
          width="106"
          height="106"
          rx=${e}
          stroke-dasharray="${n} ${t}"
          stroke-dashoffset=${a}
        />
      </svg>
    `}};lt.styles=[B,cn];Ri([u({type:Number})],lt.prototype,"radius",void 0);lt=Ri([C("wui-loading-thumbnail")],lt);const un=L`
  button {
    border: none;
    border-radius: var(--wui-border-radius-3xl);
  }

  button[data-variant='main'] {
    background-color: var(--wui-color-accent-100);
    color: var(--wui-color-inverse-100);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-010);
  }

  button[data-variant='accent'] {
    background-color: var(--wui-color-accent-glass-010);
    color: var(--wui-color-accent-100);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-005);
  }

  button[data-variant='gray'] {
    background-color: transparent;
    color: var(--wui-color-fg-200);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-010);
  }

  button[data-variant='shade'] {
    background-color: transparent;
    color: var(--wui-color-accent-100);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-010);
  }

  button[data-size='sm'] {
    height: 32px;
    padding: 0 var(--wui-spacing-s);
  }

  button[data-size='md'] {
    height: 40px;
    padding: 0 var(--wui-spacing-l);
  }

  button[data-size='sm'] > wui-image {
    width: 16px;
    height: 16px;
  }

  button[data-size='md'] > wui-image {
    width: 24px;
    height: 24px;
  }

  button[data-size='sm'] > wui-icon {
    width: 12px;
    height: 12px;
  }

  button[data-size='md'] > wui-icon {
    width: 14px;
    height: 14px;
  }

  wui-image {
    border-radius: var(--wui-border-radius-3xl);
    overflow: hidden;
  }

  button.disabled > wui-icon,
  button.disabled > wui-image {
    filter: grayscale(1);
  }

  button[data-variant='main'] > wui-image {
    box-shadow: inset 0 0 0 1px var(--wui-color-accent-090);
  }

  button[data-variant='shade'] > wui-image,
  button[data-variant='gray'] > wui-image {
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-010);
  }

  @media (hover: hover) and (pointer: fine) {
    button[data-variant='main']:focus-visible {
      background-color: var(--wui-color-accent-090);
    }

    button[data-variant='main']:hover:enabled {
      background-color: var(--wui-color-accent-090);
    }

    button[data-variant='main']:active:enabled {
      background-color: var(--wui-color-accent-080);
    }

    button[data-variant='accent']:hover:enabled {
      background-color: var(--wui-color-accent-glass-015);
    }

    button[data-variant='accent']:active:enabled {
      background-color: var(--wui-color-accent-glass-020);
    }

    button[data-variant='shade']:focus-visible,
    button[data-variant='gray']:focus-visible,
    button[data-variant='shade']:hover,
    button[data-variant='gray']:hover {
      background-color: var(--wui-color-gray-glass-002);
    }

    button[data-variant='gray']:active,
    button[data-variant='shade']:active {
      background-color: var(--wui-color-gray-glass-005);
    }
  }

  button.disabled {
    color: var(--wui-color-gray-glass-020);
    background-color: var(--wui-color-gray-glass-002);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-002);
    pointer-events: none;
  }
`;var Re=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let ue=class extends I{constructor(){super(...arguments),this.variant="accent",this.imageSrc="",this.disabled=!1,this.icon="externalLink",this.size="md",this.text=""}render(){const e=this.size==="sm"?"small-600":"paragraph-600";return c`
      <button
        class=${this.disabled?"disabled":""}
        data-variant=${this.variant}
        data-size=${this.size}
      >
        ${this.imageSrc?c`<wui-image src=${this.imageSrc}></wui-image>`:null}
        <wui-text variant=${e} color="inherit"> ${this.text} </wui-text>
        <wui-icon name=${this.icon} color="inherit" size="inherit"></wui-icon>
      </button>
    `}};ue.styles=[B,M,un];Re([u()],ue.prototype,"variant",void 0);Re([u()],ue.prototype,"imageSrc",void 0);Re([u({type:Boolean})],ue.prototype,"disabled",void 0);Re([u()],ue.prototype,"icon",void 0);Re([u()],ue.prototype,"size",void 0);Re([u()],ue.prototype,"text",void 0);ue=Re([C("wui-chip-button")],ue);const dn=L`
  wui-flex {
    width: 100%;
    background-color: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-xs);
  }
`;var _t=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let Ie=class extends I{constructor(){super(...arguments),this.disabled=!1,this.label="",this.buttonLabel=""}render(){return c`
      <wui-flex
        justifyContent="space-between"
        alignItems="center"
        .padding=${["1xs","2l","1xs","2l"]}
      >
        <wui-text variant="paragraph-500" color="fg-200">${this.label}</wui-text>
        <wui-chip-button size="sm" variant="shade" text=${this.buttonLabel} icon="chevronRight">
        </wui-chip-button>
      </wui-flex>
    `}};Ie.styles=[B,M,dn];_t([u({type:Boolean})],Ie.prototype,"disabled",void 0);_t([u()],Ie.prototype,"label",void 0);_t([u()],Ie.prototype,"buttonLabel",void 0);Ie=_t([C("wui-cta-button")],Ie);const hn=L`
  :host {
    display: block;
    padding: 0 var(--wui-spacing-xl) var(--wui-spacing-xl);
  }
`;var _i=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let ct=class extends I{constructor(){super(...arguments),this.wallet=void 0}render(){if(!this.wallet)return this.style.display="none",null;const{name:e,app_store:i,play_store:o,chrome_store:n,homepage:t}=this.wallet,a=E.isMobile(),s=E.isIos(),l=E.isAndroid(),h=[i,o,t,n].filter(Boolean).length>1,d=le.getTruncateString({string:e,charsStart:12,charsEnd:0,truncate:"end"});return h&&!a?c`
        <wui-cta-button
          label=${`Don't have ${d}?`}
          buttonLabel="Get"
          @click=${()=>A.push("Downloads",{wallet:this.wallet})}
        ></wui-cta-button>
      `:!h&&t?c`
        <wui-cta-button
          label=${`Don't have ${d}?`}
          buttonLabel="Get"
          @click=${this.onHomePage.bind(this)}
        ></wui-cta-button>
      `:i&&s?c`
        <wui-cta-button
          label=${`Don't have ${d}?`}
          buttonLabel="Get"
          @click=${this.onAppStore.bind(this)}
        ></wui-cta-button>
      `:o&&l?c`
        <wui-cta-button
          label=${`Don't have ${d}?`}
          buttonLabel="Get"
          @click=${this.onPlayStore.bind(this)}
        ></wui-cta-button>
      `:(this.style.display="none",null)}onAppStore(){var e;(e=this.wallet)!=null&&e.app_store&&E.openHref(this.wallet.app_store,"_blank")}onPlayStore(){var e;(e=this.wallet)!=null&&e.play_store&&E.openHref(this.wallet.play_store,"_blank")}onHomePage(){var e;(e=this.wallet)!=null&&e.homepage&&E.openHref(this.wallet.homepage,"_blank")}};ct.styles=[hn];_i([u({type:Object})],ct.prototype,"wallet",void 0);ct=_i([C("w3m-mobile-download-links")],ct);const pn=L`
  @keyframes shake {
    0% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(3px);
    }
    50% {
      transform: translateX(-3px);
    }
    75% {
      transform: translateX(3px);
    }
    100% {
      transform: translateX(0);
    }
  }

  wui-flex:first-child:not(:only-child) {
    position: relative;
  }

  wui-loading-thumbnail {
    position: absolute;
  }

  wui-icon-box {
    position: absolute;
    right: calc(var(--wui-spacing-3xs) * -1);
    bottom: calc(var(--wui-spacing-3xs) * -1);
    opacity: 0;
    transform: scale(0.5);
    transition-property: opacity, transform;
    transition-duration: var(--wui-duration-lg);
    transition-timing-function: var(--wui-ease-out-power-2);
    will-change: opacity, transform;
  }

  wui-text[align='center'] {
    width: 100%;
    padding: 0px var(--wui-spacing-l);
  }

  [data-error='true'] wui-icon-box {
    opacity: 1;
    transform: scale(1);
  }

  [data-error='true'] > wui-flex:first-child {
    animation: shake 250ms cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  }

  [data-retry='false'] wui-link {
    display: none;
  }

  [data-retry='true'] wui-link {
    display: block;
    opacity: 1;
  }
`;var X=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};class k extends I{constructor(){var e,i,o,n,t;super(),this.wallet=(e=A.state.data)==null?void 0:e.wallet,this.connector=(i=A.state.data)==null?void 0:i.connector,this.timeout=void 0,this.secondaryBtnIcon="refresh",this.onConnect=void 0,this.onRender=void 0,this.onAutoConnect=void 0,this.isWalletConnect=!0,this.unsubscribe=[],this.imageSrc=z.getWalletImage(this.wallet)??z.getConnectorImage(this.connector),this.name=((o=this.wallet)==null?void 0:o.name)??((n=this.connector)==null?void 0:n.name)??"Wallet",this.isRetrying=!1,this.uri=_.state.wcUri,this.error=_.state.wcError,this.ready=!1,this.showRetry=!1,this.label=void 0,this.secondaryBtnLabel="Try again",this.secondaryLabel="Accept connection request in the wallet",this.isLoading=!1,this.isMobile=!1,this.onRetry=void 0,this.unsubscribe.push(_.subscribeKey("wcUri",a=>{var s;this.uri=a,this.isRetrying&&this.onRetry&&(this.isRetrying=!1,(s=this.onConnect)==null||s.call(this))}),_.subscribeKey("wcError",a=>this.error=a)),(E.isTelegram()||E.isSafari())&&E.isIos()&&_.state.wcUri&&((t=this.onConnect)==null||t.call(this))}firstUpdated(){var e;(e=this.onAutoConnect)==null||e.call(this),this.showRetry=!this.onAutoConnect}disconnectedCallback(){this.unsubscribe.forEach(e=>e()),_.setWcError(!1),clearTimeout(this.timeout)}render(){var o;(o=this.onRender)==null||o.call(this),this.onShowRetry();const e=this.error?"Connection can be declined if a previous request is still active":this.secondaryLabel;let i="";return this.label?i=this.label:(i=`Continue in ${this.name}`,this.error&&(i="Connection declined")),c`
      <wui-flex
        data-error=${x(this.error)}
        data-retry=${this.showRetry}
        flexDirection="column"
        alignItems="center"
        .padding=${["3xl","xl","xl","xl"]}
        gap="xl"
      >
        <wui-flex justifyContent="center" alignItems="center">
          <wui-wallet-image size="lg" imageSrc=${x(this.imageSrc)}></wui-wallet-image>

          ${this.error?null:this.loaderTemplate()}

          <wui-icon-box
            backgroundColor="error-100"
            background="opaque"
            iconColor="error-100"
            icon="close"
            size="sm"
            border
            borderColor="wui-color-bg-125"
          ></wui-icon-box>
        </wui-flex>

        <wui-flex flexDirection="column" alignItems="center" gap="xs">
          <wui-text
            align="center"
            variant="paragraph-500"
            color=${this.error?"error-100":"fg-100"}
          >
            ${i}
          </wui-text>
          <wui-text align="center" variant="small-500" color="fg-200">${e}</wui-text>
        </wui-flex>

        ${this.secondaryBtnLabel?c`
              <wui-button
                variant="accent"
                size="md"
                ?disabled=${this.isRetrying||this.isLoading}
                @click=${this.onTryAgain.bind(this)}
                data-testid="w3m-connecting-widget-secondary-button"
              >
                <wui-icon color="inherit" slot="iconLeft" name=${this.secondaryBtnIcon}></wui-icon>
                ${this.secondaryBtnLabel}
              </wui-button>
            `:null}
      </wui-flex>

      ${this.isWalletConnect?c`
            <wui-flex .padding=${["0","xl","xl","xl"]} justifyContent="center">
              <wui-link @click=${this.onCopyUri} color="fg-200" data-testid="wui-link-copy">
                <wui-icon size="xs" color="fg-200" slot="iconLeft" name="copy"></wui-icon>
                Copy link
              </wui-link>
            </wui-flex>
          `:null}

      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links>
    `}onShowRetry(){var e;if(this.error&&!this.showRetry){this.showRetry=!0;const i=(e=this.shadowRoot)==null?void 0:e.querySelector("wui-button");i==null||i.animate([{opacity:0},{opacity:1}],{fill:"forwards",easing:"ease"})}}onTryAgain(){var e,i;_.setWcError(!1),this.onRetry?(this.isRetrying=!0,(e=this.onRetry)==null||e.call(this)):(i=this.onConnect)==null||i.call(this)}loaderTemplate(){const e=Dt.state.themeVariables["--w3m-border-radius-master"],i=e?parseInt(e.replace("px",""),10):4;return c`<wui-loading-thumbnail radius=${i*9}></wui-loading-thumbnail>`}onCopyUri(){try{this.uri&&(E.copyToClopboard(this.uri),Me.showSuccess("Link copied"))}catch{Me.showError("Failed to copy")}}}k.styles=pn;X([y()],k.prototype,"isRetrying",void 0);X([y()],k.prototype,"uri",void 0);X([y()],k.prototype,"error",void 0);X([y()],k.prototype,"ready",void 0);X([y()],k.prototype,"showRetry",void 0);X([y()],k.prototype,"label",void 0);X([y()],k.prototype,"secondaryBtnLabel",void 0);X([y()],k.prototype,"secondaryLabel",void 0);X([y()],k.prototype,"isLoading",void 0);X([u({type:Boolean})],k.prototype,"isMobile",void 0);X([u()],k.prototype,"onRetry",void 0);var fn=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let di=class extends k{constructor(){var e;if(super(),!this.wallet)throw new Error("w3m-connecting-wc-browser: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.onAutoConnect=this.onConnectProxy.bind(this),J.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"browser",displayIndex:(e=this.wallet)==null?void 0:e.display_index}})}async onConnectProxy(){var e,i;try{this.error=!1;const{connectors:o}=O.state,n=o.find(t=>{var a,s,l;return t.type==="ANNOUNCED"&&((a=t.info)==null?void 0:a.rdns)===((s=this.wallet)==null?void 0:s.rdns)||t.type==="INJECTED"||t.name===((l=this.wallet)==null?void 0:l.name)});if(n)await _.connectExternal(n,n.chain);else throw new Error("w3m-connecting-wc-browser: No connector found");xi.close(),J.sendEvent({type:"track",event:"CONNECT_SUCCESS",properties:{method:"browser",name:((e=this.wallet)==null?void 0:e.name)||"Unknown",caipNetworkId:(i=te.getActiveCaipNetwork())==null?void 0:i.caipNetworkId}})}catch(o){J.sendEvent({type:"track",event:"CONNECT_ERROR",properties:{message:(o==null?void 0:o.message)??"Unknown"}}),this.error=!0}}};di=fn([C("w3m-connecting-wc-browser")],di);var gn=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let hi=class extends k{constructor(){var e;if(super(),!this.wallet)throw new Error("w3m-connecting-wc-desktop: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.onRender=this.onRenderProxy.bind(this),J.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"desktop",displayIndex:(e=this.wallet)==null?void 0:e.display_index}})}onRenderProxy(){var e;!this.ready&&this.uri&&(this.ready=!0,(e=this.onConnect)==null||e.call(this))}onConnectProxy(){var e;if((e=this.wallet)!=null&&e.desktop_link&&this.uri)try{this.error=!1;const{desktop_link:i,name:o}=this.wallet,{redirect:n,href:t}=E.formatNativeUrl(i,this.uri);_.setWcLinking({name:o,href:t}),_.setRecentWallet(this.wallet),E.openHref(n,"_blank")}catch{this.error=!0}}};hi=gn([C("w3m-connecting-wc-desktop")],hi);var Ae=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let ye=class extends k{constructor(){var e;if(super(),this.btnLabelTimeout=void 0,this.redirectDeeplink=void 0,this.redirectUniversalLink=void 0,this.target=void 0,this.preferUniversalLinks=q.state.experimental_preferUniversalLinks,this.isLoading=!0,this.onConnect=()=>{var i;if((i=this.wallet)!=null&&i.mobile_link&&this.uri)try{this.error=!1;const{mobile_link:o,link_mode:n,name:t}=this.wallet,{redirect:a,redirectUniversalLink:s,href:l}=E.formatNativeUrl(o,this.uri,n);this.redirectDeeplink=a,this.redirectUniversalLink=s,this.target=E.isIframe()?"_top":"_self",_.setWcLinking({name:t,href:l}),_.setRecentWallet(this.wallet),this.preferUniversalLinks&&this.redirectUniversalLink?E.openHref(this.redirectUniversalLink,this.target):E.openHref(this.redirectDeeplink,this.target)}catch(o){J.sendEvent({type:"track",event:"CONNECT_PROXY_ERROR",properties:{message:o instanceof Error?o.message:"Error parsing the deeplink",uri:this.uri,mobile_link:this.wallet.mobile_link,name:this.wallet.name}}),this.error=!0}},!this.wallet)throw new Error("w3m-connecting-wc-mobile: No wallet provided");this.secondaryBtnLabel="Open",this.secondaryLabel=Ci.CONNECT_LABELS.MOBILE,this.secondaryBtnIcon="externalLink",this.onHandleURI(),this.unsubscribe.push(_.subscribeKey("wcUri",()=>{this.onHandleURI()})),J.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"mobile",displayIndex:(e=this.wallet)==null?void 0:e.display_index}})}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(this.btnLabelTimeout)}onHandleURI(){var e;this.isLoading=!this.uri,!this.ready&&this.uri&&(this.ready=!0,(e=this.onConnect)==null||e.call(this))}onTryAgain(){var e;_.setWcError(!1),(e=this.onConnect)==null||e.call(this)}};Ae([y()],ye.prototype,"redirectDeeplink",void 0);Ae([y()],ye.prototype,"redirectUniversalLink",void 0);Ae([y()],ye.prototype,"target",void 0);Ae([y()],ye.prototype,"preferUniversalLinks",void 0);Ae([y()],ye.prototype,"isLoading",void 0);ye=Ae([C("w3m-connecting-wc-mobile")],ye);var Je={},wn=function(){return typeof Promise=="function"&&Promise.prototype&&Promise.prototype.then},Ii={},V={};let ei;const bn=[0,26,44,70,100,134,172,196,242,292,346,404,466,532,581,655,733,815,901,991,1085,1156,1258,1364,1474,1588,1706,1828,1921,2051,2185,2323,2465,2611,2761,2876,3034,3196,3362,3532,3706];V.getSymbolSize=function(e){if(!e)throw new Error('"version" cannot be null or undefined');if(e<1||e>40)throw new Error('"version" should be in range from 1 to 40');return e*4+17};V.getSymbolTotalCodewords=function(e){return bn[e]};V.getBCHDigit=function(r){let e=0;for(;r!==0;)e++,r>>>=1;return e};V.setToSJISFunction=function(e){if(typeof e!="function")throw new Error('"toSJISFunc" is not a valid function.');ei=e};V.isKanjiModeEnabled=function(){return typeof ei<"u"};V.toSJIS=function(e){return ei(e)};var It={};(function(r){r.L={bit:1},r.M={bit:0},r.Q={bit:3},r.H={bit:2};function e(i){if(typeof i!="string")throw new Error("Param is not a string");switch(i.toLowerCase()){case"l":case"low":return r.L;case"m":case"medium":return r.M;case"q":case"quartile":return r.Q;case"h":case"high":return r.H;default:throw new Error("Unknown EC Level: "+i)}}r.isValid=function(o){return o&&typeof o.bit<"u"&&o.bit>=0&&o.bit<4},r.from=function(o,n){if(r.isValid(o))return o;try{return e(o)}catch{return n}}})(It);function Ei(){this.buffer=[],this.length=0}Ei.prototype={get:function(r){const e=Math.floor(r/8);return(this.buffer[e]>>>7-r%8&1)===1},put:function(r,e){for(let i=0;i<e;i++)this.putBit((r>>>e-i-1&1)===1)},getLengthInBits:function(){return this.length},putBit:function(r){const e=Math.floor(this.length/8);this.buffer.length<=e&&this.buffer.push(0),r&&(this.buffer[e]|=128>>>this.length%8),this.length++}};var mn=Ei;function Qe(r){if(!r||r<1)throw new Error("BitMatrix size must be defined and greater than 0");this.size=r,this.data=new Uint8Array(r*r),this.reservedBit=new Uint8Array(r*r)}Qe.prototype.set=function(r,e,i,o){const n=r*this.size+e;this.data[n]=i,o&&(this.reservedBit[n]=!0)};Qe.prototype.get=function(r,e){return this.data[r*this.size+e]};Qe.prototype.xor=function(r,e,i){this.data[r*this.size+e]^=i};Qe.prototype.isReserved=function(r,e){return this.reservedBit[r*this.size+e]};var vn=Qe,Wi={};(function(r){const e=V.getSymbolSize;r.getRowColCoords=function(o){if(o===1)return[];const n=Math.floor(o/7)+2,t=e(o),a=t===145?26:Math.ceil((t-13)/(2*n-2))*2,s=[t-7];for(let l=1;l<n-1;l++)s[l]=s[l-1]-a;return s.push(6),s.reverse()},r.getPositions=function(o){const n=[],t=r.getRowColCoords(o),a=t.length;for(let s=0;s<a;s++)for(let l=0;l<a;l++)s===0&&l===0||s===0&&l===a-1||s===a-1&&l===0||n.push([t[s],t[l]]);return n}})(Wi);var Ti={};const yn=V.getSymbolSize,pi=7;Ti.getPositions=function(e){const i=yn(e);return[[0,0],[i-pi,0],[0,i-pi]]};var Si={};(function(r){r.Patterns={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7};const e={N1:3,N2:3,N3:40,N4:10};r.isValid=function(n){return n!=null&&n!==""&&!isNaN(n)&&n>=0&&n<=7},r.from=function(n){return r.isValid(n)?parseInt(n,10):void 0},r.getPenaltyN1=function(n){const t=n.size;let a=0,s=0,l=0,h=null,d=null;for(let T=0;T<t;T++){s=l=0,h=d=null;for(let g=0;g<t;g++){let v=n.get(T,g);v===h?s++:(s>=5&&(a+=e.N1+(s-5)),h=v,s=1),v=n.get(g,T),v===d?l++:(l>=5&&(a+=e.N1+(l-5)),d=v,l=1)}s>=5&&(a+=e.N1+(s-5)),l>=5&&(a+=e.N1+(l-5))}return a},r.getPenaltyN2=function(n){const t=n.size;let a=0;for(let s=0;s<t-1;s++)for(let l=0;l<t-1;l++){const h=n.get(s,l)+n.get(s,l+1)+n.get(s+1,l)+n.get(s+1,l+1);(h===4||h===0)&&a++}return a*e.N2},r.getPenaltyN3=function(n){const t=n.size;let a=0,s=0,l=0;for(let h=0;h<t;h++){s=l=0;for(let d=0;d<t;d++)s=s<<1&2047|n.get(h,d),d>=10&&(s===1488||s===93)&&a++,l=l<<1&2047|n.get(d,h),d>=10&&(l===1488||l===93)&&a++}return a*e.N3},r.getPenaltyN4=function(n){let t=0;const a=n.data.length;for(let l=0;l<a;l++)t+=n.data[l];return Math.abs(Math.ceil(t*100/a/5)-10)*e.N4};function i(o,n,t){switch(o){case r.Patterns.PATTERN000:return(n+t)%2===0;case r.Patterns.PATTERN001:return n%2===0;case r.Patterns.PATTERN010:return t%3===0;case r.Patterns.PATTERN011:return(n+t)%3===0;case r.Patterns.PATTERN100:return(Math.floor(n/2)+Math.floor(t/3))%2===0;case r.Patterns.PATTERN101:return n*t%2+n*t%3===0;case r.Patterns.PATTERN110:return(n*t%2+n*t%3)%2===0;case r.Patterns.PATTERN111:return(n*t%3+(n+t)%2)%2===0;default:throw new Error("bad maskPattern:"+o)}}r.applyMask=function(n,t){const a=t.size;for(let s=0;s<a;s++)for(let l=0;l<a;l++)t.isReserved(l,s)||t.xor(l,s,i(n,l,s))},r.getBestMask=function(n,t){const a=Object.keys(r.Patterns).length;let s=0,l=1/0;for(let h=0;h<a;h++){t(h),r.applyMask(h,n);const d=r.getPenaltyN1(n)+r.getPenaltyN2(n)+r.getPenaltyN3(n)+r.getPenaltyN4(n);r.applyMask(h,n),d<l&&(l=d,s=h)}return s}})(Si);var Et={};const pe=It,tt=[1,1,1,1,1,1,1,1,1,1,2,2,1,2,2,4,1,2,4,4,2,4,4,4,2,4,6,5,2,4,6,6,2,5,8,8,4,5,8,8,4,5,8,11,4,8,10,11,4,9,12,16,4,9,16,16,6,10,12,18,6,10,17,16,6,11,16,19,6,13,18,21,7,14,21,25,8,16,20,25,8,17,23,25,9,17,23,34,9,18,25,30,10,20,27,32,12,21,29,35,12,23,34,37,12,25,34,40,13,26,35,42,14,28,38,45,15,29,40,48,16,31,43,51,17,33,45,54,18,35,48,57,19,37,51,60,19,38,53,63,20,40,56,66,21,43,59,70,22,45,62,74,24,47,65,77,25,49,68,81],it=[7,10,13,17,10,16,22,28,15,26,36,44,20,36,52,64,26,48,72,88,36,64,96,112,40,72,108,130,48,88,132,156,60,110,160,192,72,130,192,224,80,150,224,264,96,176,260,308,104,198,288,352,120,216,320,384,132,240,360,432,144,280,408,480,168,308,448,532,180,338,504,588,196,364,546,650,224,416,600,700,224,442,644,750,252,476,690,816,270,504,750,900,300,560,810,960,312,588,870,1050,336,644,952,1110,360,700,1020,1200,390,728,1050,1260,420,784,1140,1350,450,812,1200,1440,480,868,1290,1530,510,924,1350,1620,540,980,1440,1710,570,1036,1530,1800,570,1064,1590,1890,600,1120,1680,1980,630,1204,1770,2100,660,1260,1860,2220,720,1316,1950,2310,750,1372,2040,2430];Et.getBlocksCount=function(e,i){switch(i){case pe.L:return tt[(e-1)*4+0];case pe.M:return tt[(e-1)*4+1];case pe.Q:return tt[(e-1)*4+2];case pe.H:return tt[(e-1)*4+3];default:return}};Et.getTotalCodewordsCount=function(e,i){switch(i){case pe.L:return it[(e-1)*4+0];case pe.M:return it[(e-1)*4+1];case pe.Q:return it[(e-1)*4+2];case pe.H:return it[(e-1)*4+3];default:return}};var Li={},Wt={};const je=new Uint8Array(512),ut=new Uint8Array(256);(function(){let e=1;for(let i=0;i<255;i++)je[i]=e,ut[e]=i,e<<=1,e&256&&(e^=285);for(let i=255;i<512;i++)je[i]=je[i-255]})();Wt.log=function(e){if(e<1)throw new Error("log("+e+")");return ut[e]};Wt.exp=function(e){return je[e]};Wt.mul=function(e,i){return e===0||i===0?0:je[ut[e]+ut[i]]};(function(r){const e=Wt;r.mul=function(o,n){const t=new Uint8Array(o.length+n.length-1);for(let a=0;a<o.length;a++)for(let s=0;s<n.length;s++)t[a+s]^=e.mul(o[a],n[s]);return t},r.mod=function(o,n){let t=new Uint8Array(o);for(;t.length-n.length>=0;){const a=t[0];for(let l=0;l<n.length;l++)t[l]^=e.mul(n[l],a);let s=0;for(;s<t.length&&t[s]===0;)s++;t=t.slice(s)}return t},r.generateECPolynomial=function(o){let n=new Uint8Array([1]);for(let t=0;t<o;t++)n=r.mul(n,new Uint8Array([1,e.exp(t)]));return n}})(Li);const Oi=Li;function ti(r){this.genPoly=void 0,this.degree=r,this.degree&&this.initialize(this.degree)}ti.prototype.initialize=function(e){this.degree=e,this.genPoly=Oi.generateECPolynomial(this.degree)};ti.prototype.encode=function(e){if(!this.genPoly)throw new Error("Encoder not initialized");const i=new Uint8Array(e.length+this.degree);i.set(e);const o=Oi.mod(i,this.genPoly),n=this.degree-o.length;if(n>0){const t=new Uint8Array(this.degree);return t.set(o,n),t}return o};var xn=ti,Pi={},be={},ii={};ii.isValid=function(e){return!isNaN(e)&&e>=1&&e<=40};var oe={};const Ai="[0-9]+",Cn="[A-Z $%*+\\-./:]+";let Ge="(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+";Ge=Ge.replace(/u/g,"\\u");const $n="(?:(?![A-Z0-9 $%*+\\-./:]|"+Ge+`)(?:.|[\r
]))+`;oe.KANJI=new RegExp(Ge,"g");oe.BYTE_KANJI=new RegExp("[^A-Z0-9 $%*+\\-./:]+","g");oe.BYTE=new RegExp($n,"g");oe.NUMERIC=new RegExp(Ai,"g");oe.ALPHANUMERIC=new RegExp(Cn,"g");const Rn=new RegExp("^"+Ge+"$"),_n=new RegExp("^"+Ai+"$"),In=new RegExp("^[A-Z0-9 $%*+\\-./:]+$");oe.testKanji=function(e){return Rn.test(e)};oe.testNumeric=function(e){return _n.test(e)};oe.testAlphanumeric=function(e){return In.test(e)};(function(r){const e=ii,i=oe;r.NUMERIC={id:"Numeric",bit:1,ccBits:[10,12,14]},r.ALPHANUMERIC={id:"Alphanumeric",bit:2,ccBits:[9,11,13]},r.BYTE={id:"Byte",bit:4,ccBits:[8,16,16]},r.KANJI={id:"Kanji",bit:8,ccBits:[8,10,12]},r.MIXED={bit:-1},r.getCharCountIndicator=function(t,a){if(!t.ccBits)throw new Error("Invalid mode: "+t);if(!e.isValid(a))throw new Error("Invalid version: "+a);return a>=1&&a<10?t.ccBits[0]:a<27?t.ccBits[1]:t.ccBits[2]},r.getBestModeForData=function(t){return i.testNumeric(t)?r.NUMERIC:i.testAlphanumeric(t)?r.ALPHANUMERIC:i.testKanji(t)?r.KANJI:r.BYTE},r.toString=function(t){if(t&&t.id)return t.id;throw new Error("Invalid mode")},r.isValid=function(t){return t&&t.bit&&t.ccBits};function o(n){if(typeof n!="string")throw new Error("Param is not a string");switch(n.toLowerCase()){case"numeric":return r.NUMERIC;case"alphanumeric":return r.ALPHANUMERIC;case"kanji":return r.KANJI;case"byte":return r.BYTE;default:throw new Error("Unknown mode: "+n)}}r.from=function(t,a){if(r.isValid(t))return t;try{return o(t)}catch{return a}}})(be);(function(r){const e=V,i=Et,o=It,n=be,t=ii,a=7973,s=e.getBCHDigit(a);function l(g,v,$){for(let m=1;m<=40;m++)if(v<=r.getCapacity(m,$,g))return m}function h(g,v){return n.getCharCountIndicator(g,v)+4}function d(g,v){let $=0;return g.forEach(function(m){const R=h(m.mode,v);$+=R+m.getBitsLength()}),$}function T(g,v){for(let $=1;$<=40;$++)if(d(g,$)<=r.getCapacity($,v,n.MIXED))return $}r.from=function(v,$){return t.isValid(v)?parseInt(v,10):$},r.getCapacity=function(v,$,m){if(!t.isValid(v))throw new Error("Invalid QR Code version");typeof m>"u"&&(m=n.BYTE);const R=e.getSymbolTotalCodewords(v),w=i.getTotalCodewordsCount(v,$),f=(R-w)*8;if(m===n.MIXED)return f;const b=f-h(m,v);switch(m){case n.NUMERIC:return Math.floor(b/10*3);case n.ALPHANUMERIC:return Math.floor(b/11*2);case n.KANJI:return Math.floor(b/13);case n.BYTE:default:return Math.floor(b/8)}},r.getBestVersionForData=function(v,$){let m;const R=o.from($,o.M);if(Array.isArray(v)){if(v.length>1)return T(v,R);if(v.length===0)return 1;m=v[0]}else m=v;return l(m.mode,m.getLength(),R)},r.getEncodedBits=function(v){if(!t.isValid(v)||v<7)throw new Error("Invalid QR Code version");let $=v<<12;for(;e.getBCHDigit($)-s>=0;)$^=a<<e.getBCHDigit($)-s;return v<<12|$}})(Pi);var Bi={};const Mt=V,Ni=1335,En=21522,fi=Mt.getBCHDigit(Ni);Bi.getEncodedBits=function(e,i){const o=e.bit<<3|i;let n=o<<10;for(;Mt.getBCHDigit(n)-fi>=0;)n^=Ni<<Mt.getBCHDigit(n)-fi;return(o<<10|n)^En};var ki={};const Wn=be;function Ee(r){this.mode=Wn.NUMERIC,this.data=r.toString()}Ee.getBitsLength=function(e){return 10*Math.floor(e/3)+(e%3?e%3*3+1:0)};Ee.prototype.getLength=function(){return this.data.length};Ee.prototype.getBitsLength=function(){return Ee.getBitsLength(this.data.length)};Ee.prototype.write=function(e){let i,o,n;for(i=0;i+3<=this.data.length;i+=3)o=this.data.substr(i,3),n=parseInt(o,10),e.put(n,10);const t=this.data.length-i;t>0&&(o=this.data.substr(i),n=parseInt(o,10),e.put(n,t*3+1))};var Tn=Ee;const Sn=be,Pt=["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"," ","$","%","*","+","-",".","/",":"];function We(r){this.mode=Sn.ALPHANUMERIC,this.data=r}We.getBitsLength=function(e){return 11*Math.floor(e/2)+6*(e%2)};We.prototype.getLength=function(){return this.data.length};We.prototype.getBitsLength=function(){return We.getBitsLength(this.data.length)};We.prototype.write=function(e){let i;for(i=0;i+2<=this.data.length;i+=2){let o=Pt.indexOf(this.data[i])*45;o+=Pt.indexOf(this.data[i+1]),e.put(o,11)}this.data.length%2&&e.put(Pt.indexOf(this.data[i]),6)};var Ln=We,On=function(e){for(var i=[],o=e.length,n=0;n<o;n++){var t=e.charCodeAt(n);if(t>=55296&&t<=56319&&o>n+1){var a=e.charCodeAt(n+1);a>=56320&&a<=57343&&(t=(t-55296)*1024+a-56320+65536,n+=1)}if(t<128){i.push(t);continue}if(t<2048){i.push(t>>6|192),i.push(t&63|128);continue}if(t<55296||t>=57344&&t<65536){i.push(t>>12|224),i.push(t>>6&63|128),i.push(t&63|128);continue}if(t>=65536&&t<=1114111){i.push(t>>18|240),i.push(t>>12&63|128),i.push(t>>6&63|128),i.push(t&63|128);continue}i.push(239,191,189)}return new Uint8Array(i).buffer};const Pn=On,An=be;function Te(r){this.mode=An.BYTE,typeof r=="string"&&(r=Pn(r)),this.data=new Uint8Array(r)}Te.getBitsLength=function(e){return e*8};Te.prototype.getLength=function(){return this.data.length};Te.prototype.getBitsLength=function(){return Te.getBitsLength(this.data.length)};Te.prototype.write=function(r){for(let e=0,i=this.data.length;e<i;e++)r.put(this.data[e],8)};var Bn=Te;const Nn=be,kn=V;function Se(r){this.mode=Nn.KANJI,this.data=r}Se.getBitsLength=function(e){return e*13};Se.prototype.getLength=function(){return this.data.length};Se.prototype.getBitsLength=function(){return Se.getBitsLength(this.data.length)};Se.prototype.write=function(r){let e;for(e=0;e<this.data.length;e++){let i=kn.toSJIS(this.data[e]);if(i>=33088&&i<=40956)i-=33088;else if(i>=57408&&i<=60351)i-=49472;else throw new Error("Invalid SJIS character: "+this.data[e]+`
Make sure your charset is UTF-8`);i=(i>>>8&255)*192+(i&255),r.put(i,13)}};var jn=Se,ji={exports:{}};(function(r){var e={single_source_shortest_paths:function(i,o,n){var t={},a={};a[o]=0;var s=e.PriorityQueue.make();s.push(o,0);for(var l,h,d,T,g,v,$,m,R;!s.empty();){l=s.pop(),h=l.value,T=l.cost,g=i[h]||{};for(d in g)g.hasOwnProperty(d)&&(v=g[d],$=T+v,m=a[d],R=typeof a[d]>"u",(R||m>$)&&(a[d]=$,s.push(d,$),t[d]=h))}if(typeof n<"u"&&typeof a[n]>"u"){var w=["Could not find a path from ",o," to ",n,"."].join("");throw new Error(w)}return t},extract_shortest_path_from_predecessor_list:function(i,o){for(var n=[],t=o;t;)n.push(t),i[t],t=i[t];return n.reverse(),n},find_path:function(i,o,n){var t=e.single_source_shortest_paths(i,o,n);return e.extract_shortest_path_from_predecessor_list(t,n)},PriorityQueue:{make:function(i){var o=e.PriorityQueue,n={},t;i=i||{};for(t in o)o.hasOwnProperty(t)&&(n[t]=o[t]);return n.queue=[],n.sorter=i.sorter||o.default_sorter,n},default_sorter:function(i,o){return i.cost-o.cost},push:function(i,o){var n={value:i,cost:o};this.queue.push(n),this.queue.sort(this.sorter)},pop:function(){return this.queue.shift()},empty:function(){return this.queue.length===0}}};r.exports=e})(ji);var zn=ji.exports;(function(r){const e=be,i=Tn,o=Ln,n=Bn,t=jn,a=oe,s=V,l=zn;function h(w){return unescape(encodeURIComponent(w)).length}function d(w,f,b){const p=[];let W;for(;(W=w.exec(b))!==null;)p.push({data:W[0],index:W.index,mode:f,length:W[0].length});return p}function T(w){const f=d(a.NUMERIC,e.NUMERIC,w),b=d(a.ALPHANUMERIC,e.ALPHANUMERIC,w);let p,W;return s.isKanjiModeEnabled()?(p=d(a.BYTE,e.BYTE,w),W=d(a.KANJI,e.KANJI,w)):(p=d(a.BYTE_KANJI,e.BYTE,w),W=[]),f.concat(b,p,W).sort(function(N,Y){return N.index-Y.index}).map(function(N){return{data:N.data,mode:N.mode,length:N.length}})}function g(w,f){switch(f){case e.NUMERIC:return i.getBitsLength(w);case e.ALPHANUMERIC:return o.getBitsLength(w);case e.KANJI:return t.getBitsLength(w);case e.BYTE:return n.getBitsLength(w)}}function v(w){return w.reduce(function(f,b){const p=f.length-1>=0?f[f.length-1]:null;return p&&p.mode===b.mode?(f[f.length-1].data+=b.data,f):(f.push(b),f)},[])}function $(w){const f=[];for(let b=0;b<w.length;b++){const p=w[b];switch(p.mode){case e.NUMERIC:f.push([p,{data:p.data,mode:e.ALPHANUMERIC,length:p.length},{data:p.data,mode:e.BYTE,length:p.length}]);break;case e.ALPHANUMERIC:f.push([p,{data:p.data,mode:e.BYTE,length:p.length}]);break;case e.KANJI:f.push([p,{data:p.data,mode:e.BYTE,length:h(p.data)}]);break;case e.BYTE:f.push([{data:p.data,mode:e.BYTE,length:h(p.data)}])}}return f}function m(w,f){const b={},p={start:{}};let W=["start"];for(let P=0;P<w.length;P++){const N=w[P],Y=[];for(let he=0;he<N.length;he++){const ee=N[he],Ne=""+P+he;Y.push(Ne),b[Ne]={node:ee,lastCount:0},p[Ne]={};for(let Lt=0;Lt<W.length;Lt++){const ae=W[Lt];b[ae]&&b[ae].node.mode===ee.mode?(p[ae][Ne]=g(b[ae].lastCount+ee.length,ee.mode)-g(b[ae].lastCount,ee.mode),b[ae].lastCount+=ee.length):(b[ae]&&(b[ae].lastCount=ee.length),p[ae][Ne]=g(ee.length,ee.mode)+4+e.getCharCountIndicator(ee.mode,f))}}W=Y}for(let P=0;P<W.length;P++)p[W[P]].end=0;return{map:p,table:b}}function R(w,f){let b;const p=e.getBestModeForData(w);if(b=e.from(f,p),b!==e.BYTE&&b.bit<p.bit)throw new Error('"'+w+'" cannot be encoded with mode '+e.toString(b)+`.
 Suggested mode is: `+e.toString(p));switch(b===e.KANJI&&!s.isKanjiModeEnabled()&&(b=e.BYTE),b){case e.NUMERIC:return new i(w);case e.ALPHANUMERIC:return new o(w);case e.KANJI:return new t(w);case e.BYTE:return new n(w)}}r.fromArray=function(f){return f.reduce(function(b,p){return typeof p=="string"?b.push(R(p,null)):p.data&&b.push(R(p.data,p.mode)),b},[])},r.fromString=function(f,b){const p=T(f,s.isKanjiModeEnabled()),W=$(p),P=m(W,b),N=l.find_path(P.map,"start","end"),Y=[];for(let he=1;he<N.length-1;he++)Y.push(P.table[N[he]].node);return r.fromArray(v(Y))},r.rawSplit=function(f){return r.fromArray(T(f,s.isKanjiModeEnabled()))}})(ki);const Tt=V,At=It,Dn=mn,Mn=vn,Un=Wi,Fn=Ti,Ut=Si,Ft=Et,Vn=xn,dt=Pi,qn=Bi,Hn=be,Bt=ki;function Kn(r,e){const i=r.size,o=Fn.getPositions(e);for(let n=0;n<o.length;n++){const t=o[n][0],a=o[n][1];for(let s=-1;s<=7;s++)if(!(t+s<=-1||i<=t+s))for(let l=-1;l<=7;l++)a+l<=-1||i<=a+l||(s>=0&&s<=6&&(l===0||l===6)||l>=0&&l<=6&&(s===0||s===6)||s>=2&&s<=4&&l>=2&&l<=4?r.set(t+s,a+l,!0,!0):r.set(t+s,a+l,!1,!0))}}function Gn(r){const e=r.size;for(let i=8;i<e-8;i++){const o=i%2===0;r.set(i,6,o,!0),r.set(6,i,o,!0)}}function Yn(r,e){const i=Un.getPositions(e);for(let o=0;o<i.length;o++){const n=i[o][0],t=i[o][1];for(let a=-2;a<=2;a++)for(let s=-2;s<=2;s++)a===-2||a===2||s===-2||s===2||a===0&&s===0?r.set(n+a,t+s,!0,!0):r.set(n+a,t+s,!1,!0)}}function Jn(r,e){const i=r.size,o=dt.getEncodedBits(e);let n,t,a;for(let s=0;s<18;s++)n=Math.floor(s/3),t=s%3+i-8-3,a=(o>>s&1)===1,r.set(n,t,a,!0),r.set(t,n,a,!0)}function Nt(r,e,i){const o=r.size,n=qn.getEncodedBits(e,i);let t,a;for(t=0;t<15;t++)a=(n>>t&1)===1,t<6?r.set(t,8,a,!0):t<8?r.set(t+1,8,a,!0):r.set(o-15+t,8,a,!0),t<8?r.set(8,o-t-1,a,!0):t<9?r.set(8,15-t-1+1,a,!0):r.set(8,15-t-1,a,!0);r.set(o-8,8,1,!0)}function Qn(r,e){const i=r.size;let o=-1,n=i-1,t=7,a=0;for(let s=i-1;s>0;s-=2)for(s===6&&s--;;){for(let l=0;l<2;l++)if(!r.isReserved(n,s-l)){let h=!1;a<e.length&&(h=(e[a]>>>t&1)===1),r.set(n,s-l,h),t--,t===-1&&(a++,t=7)}if(n+=o,n<0||i<=n){n-=o,o=-o;break}}}function Xn(r,e,i){const o=new Dn;i.forEach(function(l){o.put(l.mode.bit,4),o.put(l.getLength(),Hn.getCharCountIndicator(l.mode,r)),l.write(o)});const n=Tt.getSymbolTotalCodewords(r),t=Ft.getTotalCodewordsCount(r,e),a=(n-t)*8;for(o.getLengthInBits()+4<=a&&o.put(0,4);o.getLengthInBits()%8!==0;)o.putBit(0);const s=(a-o.getLengthInBits())/8;for(let l=0;l<s;l++)o.put(l%2?17:236,8);return Zn(o,r,e)}function Zn(r,e,i){const o=Tt.getSymbolTotalCodewords(e),n=Ft.getTotalCodewordsCount(e,i),t=o-n,a=Ft.getBlocksCount(e,i),s=o%a,l=a-s,h=Math.floor(o/a),d=Math.floor(t/a),T=d+1,g=h-d,v=new Vn(g);let $=0;const m=new Array(a),R=new Array(a);let w=0;const f=new Uint8Array(r.buffer);for(let N=0;N<a;N++){const Y=N<l?d:T;m[N]=f.slice($,$+Y),R[N]=v.encode(m[N]),$+=Y,w=Math.max(w,Y)}const b=new Uint8Array(o);let p=0,W,P;for(W=0;W<w;W++)for(P=0;P<a;P++)W<m[P].length&&(b[p++]=m[P][W]);for(W=0;W<g;W++)for(P=0;P<a;P++)b[p++]=R[P][W];return b}function eo(r,e,i,o){let n;if(Array.isArray(r))n=Bt.fromArray(r);else if(typeof r=="string"){let h=e;if(!h){const d=Bt.rawSplit(r);h=dt.getBestVersionForData(d,i)}n=Bt.fromString(r,h||40)}else throw new Error("Invalid data");const t=dt.getBestVersionForData(n,i);if(!t)throw new Error("The amount of data is too big to be stored in a QR Code");if(!e)e=t;else if(e<t)throw new Error(`
The chosen QR Code version cannot contain this amount of data.
Minimum version required to store current data is: `+t+`.
`);const a=Xn(e,i,n),s=Tt.getSymbolSize(e),l=new Mn(s);return Kn(l,e),Gn(l),Yn(l,e),Nt(l,i,0),e>=7&&Jn(l,e),Qn(l,a),isNaN(o)&&(o=Ut.getBestMask(l,Nt.bind(null,l,i))),Ut.applyMask(o,l),Nt(l,i,o),{modules:l,version:e,errorCorrectionLevel:i,maskPattern:o,segments:n}}Ii.create=function(e,i){if(typeof e>"u"||e==="")throw new Error("No input text");let o=At.M,n,t;return typeof i<"u"&&(o=At.from(i.errorCorrectionLevel,At.M),n=dt.from(i.version),t=Ut.from(i.maskPattern),i.toSJISFunc&&Tt.setToSJISFunction(i.toSJISFunc)),eo(e,n,o,t)};var zi={},ni={};(function(r){function e(i){if(typeof i=="number"&&(i=i.toString()),typeof i!="string")throw new Error("Color should be defined as hex string");let o=i.slice().replace("#","").split("");if(o.length<3||o.length===5||o.length>8)throw new Error("Invalid hex color: "+i);(o.length===3||o.length===4)&&(o=Array.prototype.concat.apply([],o.map(function(t){return[t,t]}))),o.length===6&&o.push("F","F");const n=parseInt(o.join(""),16);return{r:n>>24&255,g:n>>16&255,b:n>>8&255,a:n&255,hex:"#"+o.slice(0,6).join("")}}r.getOptions=function(o){o||(o={}),o.color||(o.color={});const n=typeof o.margin>"u"||o.margin===null||o.margin<0?4:o.margin,t=o.width&&o.width>=21?o.width:void 0,a=o.scale||4;return{width:t,scale:t?4:a,margin:n,color:{dark:e(o.color.dark||"#000000ff"),light:e(o.color.light||"#ffffffff")},type:o.type,rendererOpts:o.rendererOpts||{}}},r.getScale=function(o,n){return n.width&&n.width>=o+n.margin*2?n.width/(o+n.margin*2):n.scale},r.getImageWidth=function(o,n){const t=r.getScale(o,n);return Math.floor((o+n.margin*2)*t)},r.qrToImageData=function(o,n,t){const a=n.modules.size,s=n.modules.data,l=r.getScale(a,t),h=Math.floor((a+t.margin*2)*l),d=t.margin*l,T=[t.color.light,t.color.dark];for(let g=0;g<h;g++)for(let v=0;v<h;v++){let $=(g*h+v)*4,m=t.color.light;if(g>=d&&v>=d&&g<h-d&&v<h-d){const R=Math.floor((g-d)/l),w=Math.floor((v-d)/l);m=T[s[R*a+w]?1:0]}o[$++]=m.r,o[$++]=m.g,o[$++]=m.b,o[$]=m.a}}})(ni);(function(r){const e=ni;function i(n,t,a){n.clearRect(0,0,t.width,t.height),t.style||(t.style={}),t.height=a,t.width=a,t.style.height=a+"px",t.style.width=a+"px"}function o(){try{return document.createElement("canvas")}catch{throw new Error("You need to specify a canvas element")}}r.render=function(t,a,s){let l=s,h=a;typeof l>"u"&&(!a||!a.getContext)&&(l=a,a=void 0),a||(h=o()),l=e.getOptions(l);const d=e.getImageWidth(t.modules.size,l),T=h.getContext("2d"),g=T.createImageData(d,d);return e.qrToImageData(g.data,t,l),i(T,h,d),T.putImageData(g,0,0),h},r.renderToDataURL=function(t,a,s){let l=s;typeof l>"u"&&(!a||!a.getContext)&&(l=a,a=void 0),l||(l={});const h=r.render(t,a,l),d=l.type||"image/png",T=l.rendererOpts||{};return h.toDataURL(d,T.quality)}})(zi);var Di={};const to=ni;function gi(r,e){const i=r.a/255,o=e+'="'+r.hex+'"';return i<1?o+" "+e+'-opacity="'+i.toFixed(2).slice(1)+'"':o}function kt(r,e,i){let o=r+e;return typeof i<"u"&&(o+=" "+i),o}function io(r,e,i){let o="",n=0,t=!1,a=0;for(let s=0;s<r.length;s++){const l=Math.floor(s%e),h=Math.floor(s/e);!l&&!t&&(t=!0),r[s]?(a++,s>0&&l>0&&r[s-1]||(o+=t?kt("M",l+i,.5+h+i):kt("m",n,0),n=0,t=!1),l+1<e&&r[s+1]||(o+=kt("h",a),a=0)):n++}return o}Di.render=function(e,i,o){const n=to.getOptions(i),t=e.modules.size,a=e.modules.data,s=t+n.margin*2,l=n.color.light.a?"<path "+gi(n.color.light,"fill")+' d="M0 0h'+s+"v"+s+'H0z"/>':"",h="<path "+gi(n.color.dark,"stroke")+' d="'+io(a,t,n.margin)+'"/>',d='viewBox="0 0 '+s+" "+s+'"',g='<svg xmlns="http://www.w3.org/2000/svg" '+(n.width?'width="'+n.width+'" height="'+n.width+'" ':"")+d+' shape-rendering="crispEdges">'+l+h+`</svg>
`;return typeof o=="function"&&o(null,g),g};const no=wn,Vt=Ii,Mi=zi,oo=Di;function oi(r,e,i,o,n){const t=[].slice.call(arguments,1),a=t.length,s=typeof t[a-1]=="function";if(!s&&!no())throw new Error("Callback required as last argument");if(s){if(a<2)throw new Error("Too few arguments provided");a===2?(n=i,i=e,e=o=void 0):a===3&&(e.getContext&&typeof n>"u"?(n=o,o=void 0):(n=o,o=i,i=e,e=void 0))}else{if(a<1)throw new Error("Too few arguments provided");return a===1?(i=e,e=o=void 0):a===2&&!e.getContext&&(o=i,i=e,e=void 0),new Promise(function(l,h){try{const d=Vt.create(i,o);l(r(d,e,o))}catch(d){h(d)}})}try{const l=Vt.create(i,o);n(null,r(l,e,o))}catch(l){n(l)}}Je.create=Vt.create;Je.toCanvas=oi.bind(null,Mi.render);Je.toDataURL=oi.bind(null,Mi.renderToDataURL);Je.toString=oi.bind(null,function(r,e,i){return oo.render(r,i)});const ro=.1,wi=2.5,se=7;function jt(r,e,i){return r===e?!1:(r-e<0?e-r:r-e)<=i+ro}function ao(r,e){const i=Array.prototype.slice.call(Je.create(r,{errorCorrectionLevel:e}).modules.data,0),o=Math.sqrt(i.length);return i.reduce((n,t,a)=>(a%o===0?n.push([t]):n[n.length-1].push(t))&&n,[])}const so={generate({uri:r,size:e,logoSize:i,dotColor:o="#141414"}){const n="transparent",a=[],s=ao(r,"Q"),l=e/s.length,h=[{x:0,y:0},{x:1,y:0},{x:0,y:1}];h.forEach(({x:m,y:R})=>{const w=(s.length-se)*l*m,f=(s.length-se)*l*R,b=.45;for(let p=0;p<h.length;p+=1){const W=l*(se-p*2);a.push(ke`
            <rect
              fill=${p===2?o:n}
              width=${p===0?W-5:W}
              rx= ${p===0?(W-5)*b:W*b}
              ry= ${p===0?(W-5)*b:W*b}
              stroke=${o}
              stroke-width=${p===0?5:0}
              height=${p===0?W-5:W}
              x= ${p===0?f+l*p+5/2:f+l*p}
              y= ${p===0?w+l*p+5/2:w+l*p}
            />
          `)}});const d=Math.floor((i+25)/l),T=s.length/2-d/2,g=s.length/2+d/2-1,v=[];s.forEach((m,R)=>{m.forEach((w,f)=>{if(s[R][f]&&!(R<se&&f<se||R>s.length-(se+1)&&f<se||R<se&&f>s.length-(se+1))&&!(R>T&&R<g&&f>T&&f<g)){const b=R*l+l/2,p=f*l+l/2;v.push([b,p])}})});const $={};return v.forEach(([m,R])=>{var w;$[m]?(w=$[m])==null||w.push(R):$[m]=[R]}),Object.entries($).map(([m,R])=>{const w=R.filter(f=>R.every(b=>!jt(f,b,l)));return[Number(m),w]}).forEach(([m,R])=>{R.forEach(w=>{a.push(ke`<circle cx=${m} cy=${w} fill=${o} r=${l/wi} />`)})}),Object.entries($).filter(([m,R])=>R.length>1).map(([m,R])=>{const w=R.filter(f=>R.some(b=>jt(f,b,l)));return[Number(m),w]}).map(([m,R])=>{R.sort((f,b)=>f<b?-1:1);const w=[];for(const f of R){const b=w.find(p=>p.some(W=>jt(f,W,l)));b?b.push(f):w.push([f])}return[m,w.map(f=>[f[0],f[f.length-1]])]}).forEach(([m,R])=>{R.forEach(([w,f])=>{a.push(ke`
              <line
                x1=${m}
                x2=${m}
                y1=${w}
                y2=${f}
                stroke=${o}
                stroke-width=${l/(wi/2)}
                stroke-linecap="round"
              />
            `)})}),a}},lo=L`
  :host {
    position: relative;
    user-select: none;
    display: block;
    overflow: hidden;
    aspect-ratio: 1 / 1;
    width: var(--local-size);
  }

  :host([data-theme='dark']) {
    border-radius: clamp(0px, var(--wui-border-radius-l), 40px);
    background-color: var(--wui-color-inverse-100);
    padding: var(--wui-spacing-l);
  }

  :host([data-theme='light']) {
    box-shadow: 0 0 0 1px var(--wui-color-bg-125);
    background-color: var(--wui-color-bg-125);
  }

  :host([data-clear='true']) > wui-icon {
    display: none;
  }

  svg:first-child,
  wui-image,
  wui-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translateY(-50%) translateX(-50%);
  }

  wui-image {
    width: 25%;
    height: 25%;
    border-radius: var(--wui-border-radius-xs);
  }

  wui-icon {
    width: 100%;
    height: 100%;
    color: var(--local-icon-color) !important;
    transform: translateY(-50%) translateX(-50%) scale(0.25);
  }
`;var de=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};const co="#3396ff";let Q=class extends I{constructor(){super(...arguments),this.uri="",this.size=0,this.theme="dark",this.imageSrc=void 0,this.alt=void 0,this.arenaClear=void 0,this.farcaster=void 0}render(){return this.dataset.theme=this.theme,this.dataset.clear=String(this.arenaClear),this.style.cssText=`
     --local-size: ${this.size}px;
     --local-icon-color: ${this.color??co}
    `,c`${this.templateVisual()} ${this.templateSvg()}`}templateSvg(){const e=this.theme==="light"?this.size:this.size-32;return ke`
      <svg height=${e} width=${e}>
        ${so.generate({uri:this.uri,size:e,logoSize:this.arenaClear?0:e/4,dotColor:this.color})}
      </svg>
    `}templateVisual(){return this.imageSrc?c`<wui-image src=${this.imageSrc} alt=${this.alt??"logo"}></wui-image>`:this.farcaster?c`<wui-icon
        class="farcaster"
        size="inherit"
        color="inherit"
        name="farcaster"
      ></wui-icon>`:c`<wui-icon size="inherit" color="inherit" name="walletConnect"></wui-icon>`}};Q.styles=[B,lo];de([u()],Q.prototype,"uri",void 0);de([u({type:Number})],Q.prototype,"size",void 0);de([u()],Q.prototype,"theme",void 0);de([u()],Q.prototype,"imageSrc",void 0);de([u()],Q.prototype,"alt",void 0);de([u()],Q.prototype,"color",void 0);de([u({type:Boolean})],Q.prototype,"arenaClear",void 0);de([u({type:Boolean})],Q.prototype,"farcaster",void 0);Q=de([C("wui-qr-code")],Q);const uo=L`
  :host {
    display: block;
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-005);
    background: linear-gradient(
      120deg,
      var(--wui-color-bg-200) 5%,
      var(--wui-color-bg-200) 48%,
      var(--wui-color-bg-300) 55%,
      var(--wui-color-bg-300) 60%,
      var(--wui-color-bg-300) calc(60% + 10px),
      var(--wui-color-bg-200) calc(60% + 12px),
      var(--wui-color-bg-200) 100%
    );
    background-size: 250%;
    animation: shimmer 3s linear infinite reverse;
  }

  :host([variant='light']) {
    background: linear-gradient(
      120deg,
      var(--wui-color-bg-150) 5%,
      var(--wui-color-bg-150) 48%,
      var(--wui-color-bg-200) 55%,
      var(--wui-color-bg-200) 60%,
      var(--wui-color-bg-200) calc(60% + 10px),
      var(--wui-color-bg-150) calc(60% + 12px),
      var(--wui-color-bg-150) 100%
    );
    background-size: 250%;
  }

  @keyframes shimmer {
    from {
      background-position: -250% 0;
    }
    to {
      background-position: 250% 0;
    }
  }
`;var Xe=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let xe=class extends I{constructor(){super(...arguments),this.width="",this.height="",this.borderRadius="m",this.variant="default"}render(){return this.style.cssText=`
      width: ${this.width};
      height: ${this.height};
      border-radius: ${`clamp(0px,var(--wui-border-radius-${this.borderRadius}), 40px)`};
    `,c`<slot></slot>`}};xe.styles=[uo];Xe([u()],xe.prototype,"width",void 0);Xe([u()],xe.prototype,"height",void 0);Xe([u()],xe.prototype,"borderRadius",void 0);Xe([u()],xe.prototype,"variant",void 0);xe=Xe([C("wui-shimmer")],xe);const ho="https://reown.com",po=L`
  .reown-logo {
    height: var(--wui-spacing-xxl);
  }

  a {
    text-decoration: none;
    cursor: pointer;
  }

  a:hover {
    opacity: 0.9;
  }
`;var fo=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let qt=class extends I{render(){return c`
      <a
        data-testid="ux-branding-reown"
        href=${ho}
        rel="noreferrer"
        target="_blank"
        style="text-decoration: none;"
      >
        <wui-flex
          justifyContent="center"
          alignItems="center"
          gap="xs"
          .padding=${["0","0","l","0"]}
        >
          <wui-text variant="small-500" color="fg-100"> UX by </wui-text>
          <wui-icon name="reown" size="xxxl" class="reown-logo"></wui-icon>
        </wui-flex>
      </a>
    `}};qt.styles=[B,M,po];qt=fo([C("wui-ux-by-reown")],qt);const go=L`
  @keyframes fadein {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  wui-shimmer {
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: clamp(0px, var(--wui-border-radius-l), 40px) !important;
  }

  wui-qr-code {
    opacity: 0;
    animation-duration: 200ms;
    animation-timing-function: ease;
    animation-name: fadein;
    animation-fill-mode: forwards;
  }
`;var wo=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let Ht=class extends k{constructor(){var e,i;super(),this.forceUpdate=()=>{this.requestUpdate()},window.addEventListener("resize",this.forceUpdate),J.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:((e=this.wallet)==null?void 0:e.name)??"WalletConnect",platform:"qrcode",displayIndex:(i=this.wallet)==null?void 0:i.display_index}})}disconnectedCallback(){var e;super.disconnectedCallback(),(e=this.unsubscribe)==null||e.forEach(i=>i()),window.removeEventListener("resize",this.forceUpdate)}render(){return this.onRenderProxy(),c`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["0","xl","xl","xl"]}
        gap="xl"
      >
        <wui-shimmer borderRadius="l" width="100%"> ${this.qrCodeTemplate()} </wui-shimmer>

        <wui-text variant="paragraph-500" color="fg-100">
          Scan this QR Code with your phone
        </wui-text>
        ${this.copyTemplate()}
      </wui-flex>
      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links>
    `}onRenderProxy(){!this.ready&&this.uri&&(this.timeout=setTimeout(()=>{this.ready=!0},200))}qrCodeTemplate(){if(!this.uri||!this.ready)return null;const e=this.getBoundingClientRect().width-40,i=this.wallet?this.wallet.name:void 0;return _.setWcLinking(void 0),_.setRecentWallet(this.wallet),c` <wui-qr-code
      size=${e}
      theme=${Dt.state.themeMode}
      uri=${this.uri}
      imageSrc=${x(z.getWalletImage(this.wallet))}
      color=${x(Dt.state.themeVariables["--w3m-qr-color"])}
      alt=${x(i)}
      data-testid="wui-qr-code"
    ></wui-qr-code>`}copyTemplate(){const e=!this.uri||!this.ready;return c`<wui-link
      .disabled=${e}
      @click=${this.onCopyUri}
      color="fg-200"
      data-testid="copy-wc2-uri"
    >
      <wui-icon size="xs" color="fg-200" slot="iconLeft" name="copy"></wui-icon>
      Copy link
    </wui-link>`}};Ht.styles=go;Ht=wo([C("w3m-connecting-wc-qrcode")],Ht);var bo=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let bi=class extends I{constructor(){var e,i;if(super(),this.wallet=(e=A.state.data)==null?void 0:e.wallet,!this.wallet)throw new Error("w3m-connecting-wc-unsupported: No wallet provided");J.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"browser",displayIndex:(i=this.wallet)==null?void 0:i.display_index}})}render(){return c`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["3xl","xl","xl","xl"]}
        gap="xl"
      >
        <wui-wallet-image
          size="lg"
          imageSrc=${x(z.getWalletImage(this.wallet))}
        ></wui-wallet-image>

        <wui-text variant="paragraph-500" color="fg-100">Not Detected</wui-text>
      </wui-flex>

      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links>
    `}};bi=bo([C("w3m-connecting-wc-unsupported")],bi);var Ui=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let Kt=class extends k{constructor(){var e;if(super(),this.isLoading=!0,!this.wallet)throw new Error("w3m-connecting-wc-web: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.secondaryBtnLabel="Open",this.secondaryLabel=Ci.CONNECT_LABELS.MOBILE,this.secondaryBtnIcon="externalLink",this.updateLoadingState(),this.unsubscribe.push(_.subscribeKey("wcUri",()=>{this.updateLoadingState()})),J.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"web",displayIndex:(e=this.wallet)==null?void 0:e.display_index}})}updateLoadingState(){this.isLoading=!this.uri}onConnectProxy(){var e;if((e=this.wallet)!=null&&e.webapp_link&&this.uri)try{this.error=!1;const{webapp_link:i,name:o}=this.wallet,{redirect:n,href:t}=E.formatUniversalUrl(i,this.uri);_.setWcLinking({name:o,href:t}),_.setRecentWallet(this.wallet),E.openHref(n,"_blank")}catch{this.error=!0}}};Ui([y()],Kt.prototype,"isLoading",void 0);Kt=Ui([C("w3m-connecting-wc-web")],Kt);var Ze=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let Le=class extends I{constructor(){var e;super(),this.wallet=(e=A.state.data)==null?void 0:e.wallet,this.unsubscribe=[],this.platform=void 0,this.platforms=[],this.isSiwxEnabled=!!q.state.siwx,this.remoteFeatures=q.state.remoteFeatures,this.determinePlatforms(),this.initializeConnection(),this.unsubscribe.push(q.subscribeKey("remoteFeatures",i=>this.remoteFeatures=i))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return c`
      ${this.headerTemplate()}
      <div>${this.platformTemplate()}</div>
      ${this.reownBrandingTemplate()}
    `}reownBrandingTemplate(){var e;return(e=this.remoteFeatures)!=null&&e.reownBranding?c`<wui-ux-by-reown></wui-ux-by-reown>`:null}async initializeConnection(e=!1){var i,o;if(!(this.platform==="browser"||q.state.manualWCControl&&!e))try{const{wcPairingExpiry:n,status:t}=_.state;if(e||q.state.enableEmbedded||E.isPairingExpired(n)||t==="connecting"){const a=_.getConnections(te.state.activeChain),s=(i=this.remoteFeatures)==null?void 0:i.multiWallet,l=a.length>0;await _.connectWalletConnect(),this.isSiwxEnabled||(l&&s?(A.replace("ProfileWallets"),Me.showSuccess("New Wallet Added")):xi.close())}}catch(n){if(n instanceof Error&&n.message.includes("An error occurred when attempting to switch chain")&&!q.state.enableNetworkSwitch&&te.state.activeChain){te.setActiveCaipNetwork(Gi.getUnsupportedNetwork(`${te.state.activeChain}:${(o=te.state.activeCaipNetwork)==null?void 0:o.id}`)),te.showUnsupportedChainUI();return}J.sendEvent({type:"track",event:"CONNECT_ERROR",properties:{message:(n==null?void 0:n.message)??"Unknown"}}),_.setWcError(!0),Me.showError(n.message??"Connection error"),_.resetWcConnection(),A.goBack()}}determinePlatforms(){if(!this.wallet){this.platforms.push("qrcode"),this.platform="qrcode";return}if(this.platform)return;const{mobile_link:e,desktop_link:i,webapp_link:o,injected:n,rdns:t}=this.wallet,a=n==null?void 0:n.map(({injected_id:$})=>$).filter(Boolean),s=[...t?[t]:a??[]],l=q.state.isUniversalProvider?!1:s.length,h=e,d=o,T=_.checkInstalled(s),g=l&&T,v=i&&!E.isMobile();g&&!te.state.noAdapters&&this.platforms.push("browser"),h&&this.platforms.push(E.isMobile()?"mobile":"qrcode"),d&&this.platforms.push("web"),v&&this.platforms.push("desktop"),!g&&l&&!te.state.noAdapters&&this.platforms.push("unsupported"),this.platform=this.platforms[0]}platformTemplate(){switch(this.platform){case"browser":return c`<w3m-connecting-wc-browser></w3m-connecting-wc-browser>`;case"web":return c`<w3m-connecting-wc-web></w3m-connecting-wc-web>`;case"desktop":return c`
          <w3m-connecting-wc-desktop .onRetry=${()=>this.initializeConnection(!0)}>
          </w3m-connecting-wc-desktop>
        `;case"mobile":return c`
          <w3m-connecting-wc-mobile isMobile .onRetry=${()=>this.initializeConnection(!0)}>
          </w3m-connecting-wc-mobile>
        `;case"qrcode":return c`<w3m-connecting-wc-qrcode></w3m-connecting-wc-qrcode>`;default:return c`<w3m-connecting-wc-unsupported></w3m-connecting-wc-unsupported>`}}headerTemplate(){return this.platforms.length>1?c`
      <w3m-connecting-header
        .platforms=${this.platforms}
        .onSelectPlatfrom=${this.onSelectPlatform.bind(this)}
      >
      </w3m-connecting-header>
    `:null}async onSelectPlatform(e){var o;const i=(o=this.shadowRoot)==null?void 0:o.querySelector("div");i&&(await i.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards",easing:"ease"}).finished,this.platform=e,i.animate([{opacity:0},{opacity:1}],{duration:200,fill:"forwards",easing:"ease"}))}};Ze([y()],Le.prototype,"platform",void 0);Ze([y()],Le.prototype,"platforms",void 0);Ze([y()],Le.prototype,"isSiwxEnabled",void 0);Ze([y()],Le.prototype,"remoteFeatures",void 0);Le=Ze([C("w3m-connecting-wc-view")],Le);var Fi=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let Gt=class extends I{constructor(){super(...arguments),this.isMobile=E.isMobile()}render(){if(this.isMobile){const{featured:e,recommended:i}=S.state,{customWallets:o}=q.state,n=bt.getRecentWallets(),t=e.length||i.length||(o==null?void 0:o.length)||n.length;return c`<wui-flex
        flexDirection="column"
        gap="xs"
        .margin=${["3xs","s","s","s"]}
      >
        ${t?c`<w3m-connector-list></w3m-connector-list>`:null}
        <w3m-all-wallets-widget></w3m-all-wallets-widget>
      </wui-flex>`}return c`<wui-flex flexDirection="column" .padding=${["0","0","l","0"]}>
      <w3m-connecting-wc-view></w3m-connecting-wc-view>
      <wui-flex flexDirection="column" .padding=${["0","m","0","m"]}>
        <w3m-all-wallets-widget></w3m-all-wallets-widget> </wui-flex
    ></wui-flex>`}};Fi([y()],Gt.prototype,"isMobile",void 0);Gt=Fi([C("w3m-connecting-wc-basic-view")],Gt);/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const ri=()=>new mo;class mo{}const zt=new WeakMap,ai=Ji(class extends Qi{render(r){return ci}update(r,[e]){var o;const i=e!==this.G;return i&&this.G!==void 0&&this.rt(void 0),(i||this.lt!==this.ct)&&(this.G=e,this.ht=(o=r.options)==null?void 0:o.host,this.rt(this.ct=r.element)),ci}rt(r){if(this.isConnected||(r=void 0),typeof this.G=="function"){const e=this.ht??globalThis;let i=zt.get(e);i===void 0&&(i=new WeakMap,zt.set(e,i)),i.get(this.G)!==void 0&&this.G.call(this.ht,void 0),i.set(this.G,r),r!==void 0&&this.G.call(this.ht,r)}else this.G.value=r}get lt(){var r,e;return typeof this.G=="function"?(r=zt.get(this.ht??globalThis))==null?void 0:r.get(this.G):(e=this.G)==null?void 0:e.value}disconnected(){this.lt===this.ct&&this.rt(void 0)}reconnected(){this.rt(this.ct)}}),vo=L`
  :host {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  label {
    position: relative;
    display: inline-block;
    width: 32px;
    height: 22px;
  }

  input {
    width: 0;
    height: 0;
    opacity: 0;
  }

  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--wui-color-blue-100);
    border-width: 1px;
    border-style: solid;
    border-color: var(--wui-color-gray-glass-002);
    border-radius: 999px;
    transition:
      background-color var(--wui-ease-inout-power-1) var(--wui-duration-md),
      border-color var(--wui-ease-inout-power-1) var(--wui-duration-md);
    will-change: background-color, border-color;
  }

  span:before {
    position: absolute;
    content: '';
    height: 16px;
    width: 16px;
    left: 3px;
    top: 2px;
    background-color: var(--wui-color-inverse-100);
    transition: transform var(--wui-ease-inout-power-1) var(--wui-duration-lg);
    will-change: transform;
    border-radius: 50%;
  }

  input:checked + span {
    border-color: var(--wui-color-gray-glass-005);
    background-color: var(--wui-color-blue-100);
  }

  input:not(:checked) + span {
    background-color: var(--wui-color-gray-glass-010);
  }

  input:checked + span:before {
    transform: translateX(calc(100% - 7px));
  }
`;var Vi=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let ht=class extends I{constructor(){super(...arguments),this.inputElementRef=ri(),this.checked=void 0}render(){return c`
      <label>
        <input
          ${ai(this.inputElementRef)}
          type="checkbox"
          ?checked=${x(this.checked)}
          @change=${this.dispatchChangeEvent.bind(this)}
        />
        <span></span>
      </label>
    `}dispatchChangeEvent(){var e;this.dispatchEvent(new CustomEvent("switchChange",{detail:(e=this.inputElementRef.value)==null?void 0:e.checked,bubbles:!0,composed:!0}))}};ht.styles=[B,M,Yi,vo];Vi([u({type:Boolean})],ht.prototype,"checked",void 0);ht=Vi([C("wui-switch")],ht);const yo=L`
  :host {
    height: 100%;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    column-gap: var(--wui-spacing-1xs);
    padding: var(--wui-spacing-xs) var(--wui-spacing-s);
    background-color: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-xs);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-002);
    transition: background-color var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: background-color;
    cursor: pointer;
  }

  wui-switch {
    pointer-events: none;
  }
`;var qi=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let pt=class extends I{constructor(){super(...arguments),this.checked=void 0}render(){return c`
      <button>
        <wui-icon size="xl" name="walletConnectBrown"></wui-icon>
        <wui-switch ?checked=${x(this.checked)}></wui-switch>
      </button>
    `}};pt.styles=[B,M,yo];qi([u({type:Boolean})],pt.prototype,"checked",void 0);pt=qi([C("wui-certified-switch")],pt);const xo=L`
  button {
    background-color: var(--wui-color-fg-300);
    border-radius: var(--wui-border-radius-4xs);
    width: 16px;
    height: 16px;
  }

  button:disabled {
    background-color: var(--wui-color-bg-300);
  }

  wui-icon {
    color: var(--wui-color-bg-200) !important;
  }

  button:focus-visible {
    background-color: var(--wui-color-fg-250);
    border: 1px solid var(--wui-color-accent-100);
  }

  @media (hover: hover) and (pointer: fine) {
    button:hover:enabled {
      background-color: var(--wui-color-fg-250);
    }

    button:active:enabled {
      background-color: var(--wui-color-fg-225);
    }
  }
`;var Hi=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let ft=class extends I{constructor(){super(...arguments),this.icon="copy"}render(){return c`
      <button>
        <wui-icon color="inherit" size="xxs" name=${this.icon}></wui-icon>
      </button>
    `}};ft.styles=[B,M,xo];Hi([u()],ft.prototype,"icon",void 0);ft=Hi([C("wui-input-element")],ft);const Co=L`
  :host {
    position: relative;
    width: 100%;
    display: inline-block;
    color: var(--wui-color-fg-275);
  }

  input {
    width: 100%;
    border-radius: var(--wui-border-radius-xs);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-002);
    background: var(--wui-color-gray-glass-002);
    font-size: var(--wui-font-size-paragraph);
    letter-spacing: var(--wui-letter-spacing-paragraph);
    color: var(--wui-color-fg-100);
    transition:
      background-color var(--wui-ease-inout-power-1) var(--wui-duration-md),
      border-color var(--wui-ease-inout-power-1) var(--wui-duration-md),
      box-shadow var(--wui-ease-inout-power-1) var(--wui-duration-md);
    will-change: background-color, border-color, box-shadow;
    caret-color: var(--wui-color-accent-100);
  }

  input:disabled {
    cursor: not-allowed;
    border: 1px solid var(--wui-color-gray-glass-010);
  }

  input:disabled::placeholder,
  input:disabled + wui-icon {
    color: var(--wui-color-fg-300);
  }

  input::placeholder {
    color: var(--wui-color-fg-275);
  }

  input:focus:enabled {
    background-color: var(--wui-color-gray-glass-005);
    -webkit-box-shadow:
      inset 0 0 0 1px var(--wui-color-accent-100),
      0px 0px 0px 4px var(--wui-box-shadow-blue);
    -moz-box-shadow:
      inset 0 0 0 1px var(--wui-color-accent-100),
      0px 0px 0px 4px var(--wui-box-shadow-blue);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-accent-100),
      0px 0px 0px 4px var(--wui-box-shadow-blue);
  }

  input:hover:enabled {
    background-color: var(--wui-color-gray-glass-005);
  }

  wui-icon {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
  }

  .wui-size-sm {
    padding: 9px var(--wui-spacing-m) 10px var(--wui-spacing-s);
  }

  wui-icon + .wui-size-sm {
    padding: 9px var(--wui-spacing-m) 10px 36px;
  }

  wui-icon[data-input='sm'] {
    left: var(--wui-spacing-s);
  }

  .wui-size-md {
    padding: 15px var(--wui-spacing-m) var(--wui-spacing-l) var(--wui-spacing-m);
  }

  wui-icon + .wui-size-md,
  wui-loading-spinner + .wui-size-md {
    padding: 10.5px var(--wui-spacing-3xl) 10.5px var(--wui-spacing-3xl);
  }

  wui-icon[data-input='md'] {
    left: var(--wui-spacing-l);
  }

  .wui-size-lg {
    padding: var(--wui-spacing-s) var(--wui-spacing-s) var(--wui-spacing-s) var(--wui-spacing-l);
    letter-spacing: var(--wui-letter-spacing-medium-title);
    font-size: var(--wui-font-size-medium-title);
    font-weight: var(--wui-font-weight-light);
    line-height: 130%;
    color: var(--wui-color-fg-100);
    height: 64px;
  }

  .wui-padding-right-xs {
    padding-right: var(--wui-spacing-xs);
  }

  .wui-padding-right-s {
    padding-right: var(--wui-spacing-s);
  }

  .wui-padding-right-m {
    padding-right: var(--wui-spacing-m);
  }

  .wui-padding-right-l {
    padding-right: var(--wui-spacing-l);
  }

  .wui-padding-right-xl {
    padding-right: var(--wui-spacing-xl);
  }

  .wui-padding-right-2xl {
    padding-right: var(--wui-spacing-2xl);
  }

  .wui-padding-right-3xl {
    padding-right: var(--wui-spacing-3xl);
  }

  .wui-padding-right-4xl {
    padding-right: var(--wui-spacing-4xl);
  }

  .wui-padding-right-5xl {
    padding-right: var(--wui-spacing-5xl);
  }

  wui-icon + .wui-size-lg,
  wui-loading-spinner + .wui-size-lg {
    padding-left: 50px;
  }

  wui-icon[data-input='lg'] {
    left: var(--wui-spacing-l);
  }

  .wui-size-mdl {
    padding: 17.25px var(--wui-spacing-m) 17.25px var(--wui-spacing-m);
  }
  wui-icon + .wui-size-mdl,
  wui-loading-spinner + .wui-size-mdl {
    padding: 17.25px var(--wui-spacing-3xl) 17.25px 40px;
  }
  wui-icon[data-input='mdl'] {
    left: var(--wui-spacing-m);
  }

  input:placeholder-shown ~ ::slotted(wui-input-element),
  input:placeholder-shown ~ ::slotted(wui-icon) {
    opacity: 0;
    pointer-events: none;
  }

  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type='number'] {
    -moz-appearance: textfield;
  }

  ::slotted(wui-input-element),
  ::slotted(wui-icon) {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
  }

  ::slotted(wui-input-element) {
    right: var(--wui-spacing-m);
  }

  ::slotted(wui-icon) {
    right: 0px;
  }
`;var re=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let K=class extends I{constructor(){super(...arguments),this.inputElementRef=ri(),this.size="md",this.disabled=!1,this.placeholder="",this.type="text",this.value=""}render(){const e=`wui-padding-right-${this.inputRightPadding}`,o={[`wui-size-${this.size}`]:!0,[e]:!!this.inputRightPadding};return c`${this.templateIcon()}
      <input
        data-testid="wui-input-text"
        ${ai(this.inputElementRef)}
        class=${Xi(o)}
        type=${this.type}
        enterkeyhint=${x(this.enterKeyHint)}
        ?disabled=${this.disabled}
        placeholder=${this.placeholder}
        @input=${this.dispatchInputChangeEvent.bind(this)}
        .value=${this.value||""}
        tabindex=${x(this.tabIdx)}
      />
      <slot></slot>`}templateIcon(){return this.icon?c`<wui-icon
        data-input=${this.size}
        size=${this.size}
        color="inherit"
        name=${this.icon}
      ></wui-icon>`:null}dispatchInputChangeEvent(){var e;this.dispatchEvent(new CustomEvent("inputChange",{detail:(e=this.inputElementRef.value)==null?void 0:e.value,bubbles:!0,composed:!0}))}};K.styles=[B,M,Co];re([u()],K.prototype,"size",void 0);re([u()],K.prototype,"icon",void 0);re([u({type:Boolean})],K.prototype,"disabled",void 0);re([u()],K.prototype,"placeholder",void 0);re([u()],K.prototype,"type",void 0);re([u()],K.prototype,"keyHint",void 0);re([u()],K.prototype,"value",void 0);re([u()],K.prototype,"inputRightPadding",void 0);re([u()],K.prototype,"tabIdx",void 0);K=re([C("wui-input-text")],K);const $o=L`
  :host {
    position: relative;
    display: inline-block;
    width: 100%;
  }
`;var Ro=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let Yt=class extends I{constructor(){super(...arguments),this.inputComponentRef=ri()}render(){return c`
      <wui-input-text
        ${ai(this.inputComponentRef)}
        placeholder="Search wallet"
        icon="search"
        type="search"
        enterKeyHint="search"
        size="sm"
      >
        <wui-input-element @click=${this.clearValue} icon="close"></wui-input-element>
      </wui-input-text>
    `}clearValue(){const e=this.inputComponentRef.value,i=e==null?void 0:e.inputElementRef.value;i&&(i.value="",i.focus(),i.dispatchEvent(new Event("input")))}};Yt.styles=[B,$o];Yt=Ro([C("wui-search-bar")],Yt);const _o=ke`<svg  viewBox="0 0 48 54" fill="none">
  <path
    d="M43.4605 10.7248L28.0485 1.61089C25.5438 0.129705 22.4562 0.129705 19.9515 1.61088L4.53951 10.7248C2.03626 12.2051 0.5 14.9365 0.5 17.886V36.1139C0.5 39.0635 2.03626 41.7949 4.53951 43.2752L19.9515 52.3891C22.4562 53.8703 25.5438 53.8703 28.0485 52.3891L43.4605 43.2752C45.9637 41.7949 47.5 39.0635 47.5 36.114V17.8861C47.5 14.9365 45.9637 12.2051 43.4605 10.7248Z"
  />
</svg>`,Io=L`
  :host {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 104px;
    row-gap: var(--wui-spacing-xs);
    padding: var(--wui-spacing-xs) 10px;
    background-color: var(--wui-color-gray-glass-002);
    border-radius: clamp(0px, var(--wui-border-radius-xs), 20px);
    position: relative;
  }

  wui-shimmer[data-type='network'] {
    border: none;
    -webkit-clip-path: var(--wui-path-network);
    clip-path: var(--wui-path-network);
  }

  svg {
    position: absolute;
    width: 48px;
    height: 54px;
    z-index: 1;
  }

  svg > path {
    stroke: var(--wui-color-gray-glass-010);
    stroke-width: 1px;
  }

  @media (max-width: 350px) {
    :host {
      width: 100%;
    }
  }
`;var Ki=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let gt=class extends I{constructor(){super(...arguments),this.type="wallet"}render(){return c`
      ${this.shimmerTemplate()}
      <wui-shimmer width="56px" height="20px" borderRadius="xs"></wui-shimmer>
    `}shimmerTemplate(){return this.type==="network"?c` <wui-shimmer
          data-type=${this.type}
          width="48px"
          height="54px"
          borderRadius="xs"
        ></wui-shimmer>
        ${_o}`:c`<wui-shimmer width="56px" height="56px" borderRadius="xs"></wui-shimmer>`}};gt.styles=[B,M,Io];Ki([u()],gt.prototype,"type",void 0);gt=Ki([C("wui-card-select-loader")],gt);const Eo=L`
  :host {
    display: grid;
    width: inherit;
    height: inherit;
  }
`;var G=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let D=class extends I{render(){return this.style.cssText=`
      grid-template-rows: ${this.gridTemplateRows};
      grid-template-columns: ${this.gridTemplateColumns};
      justify-items: ${this.justifyItems};
      align-items: ${this.alignItems};
      justify-content: ${this.justifyContent};
      align-content: ${this.alignContent};
      column-gap: ${this.columnGap&&`var(--wui-spacing-${this.columnGap})`};
      row-gap: ${this.rowGap&&`var(--wui-spacing-${this.rowGap})`};
      gap: ${this.gap&&`var(--wui-spacing-${this.gap})`};
      padding-top: ${this.padding&&le.getSpacingStyles(this.padding,0)};
      padding-right: ${this.padding&&le.getSpacingStyles(this.padding,1)};
      padding-bottom: ${this.padding&&le.getSpacingStyles(this.padding,2)};
      padding-left: ${this.padding&&le.getSpacingStyles(this.padding,3)};
      margin-top: ${this.margin&&le.getSpacingStyles(this.margin,0)};
      margin-right: ${this.margin&&le.getSpacingStyles(this.margin,1)};
      margin-bottom: ${this.margin&&le.getSpacingStyles(this.margin,2)};
      margin-left: ${this.margin&&le.getSpacingStyles(this.margin,3)};
    `,c`<slot></slot>`}};D.styles=[B,Eo];G([u()],D.prototype,"gridTemplateRows",void 0);G([u()],D.prototype,"gridTemplateColumns",void 0);G([u()],D.prototype,"justifyItems",void 0);G([u()],D.prototype,"alignItems",void 0);G([u()],D.prototype,"justifyContent",void 0);G([u()],D.prototype,"alignContent",void 0);G([u()],D.prototype,"columnGap",void 0);G([u()],D.prototype,"rowGap",void 0);G([u()],D.prototype,"gap",void 0);G([u()],D.prototype,"padding",void 0);G([u()],D.prototype,"margin",void 0);D=G([C("wui-grid")],D);const Wo=L`
  button {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    width: 104px;
    row-gap: var(--wui-spacing-xs);
    padding: var(--wui-spacing-s) var(--wui-spacing-0);
    background-color: var(--wui-color-gray-glass-002);
    border-radius: clamp(0px, var(--wui-border-radius-xs), 20px);
    transition:
      color var(--wui-duration-lg) var(--wui-ease-out-power-1),
      background-color var(--wui-duration-lg) var(--wui-ease-out-power-1),
      border-radius var(--wui-duration-lg) var(--wui-ease-out-power-1);
    will-change: background-color, color, border-radius;
    outline: none;
    border: none;
  }

  button > wui-flex > wui-text {
    color: var(--wui-color-fg-100);
    max-width: 86px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    justify-content: center;
  }

  button > wui-flex > wui-text.certified {
    max-width: 66px;
  }

  button:hover:enabled {
    background-color: var(--wui-color-gray-glass-005);
  }

  button:disabled > wui-flex > wui-text {
    color: var(--wui-color-gray-glass-015);
  }

  [data-selected='true'] {
    background-color: var(--wui-color-accent-glass-020);
  }

  @media (hover: hover) and (pointer: fine) {
    [data-selected='true']:hover:enabled {
      background-color: var(--wui-color-accent-glass-015);
    }
  }

  [data-selected='true']:active:enabled {
    background-color: var(--wui-color-accent-glass-010);
  }

  @media (max-width: 350px) {
    button {
      width: 100%;
    }
  }
`;var et=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let Ce=class extends I{constructor(){super(),this.observer=new IntersectionObserver(()=>{}),this.visible=!1,this.imageSrc=void 0,this.imageLoading=!1,this.wallet=void 0,this.observer=new IntersectionObserver(e=>{e.forEach(i=>{i.isIntersecting?(this.visible=!0,this.fetchImageSrc()):this.visible=!1})},{threshold:.01})}firstUpdated(){this.observer.observe(this)}disconnectedCallback(){this.observer.disconnect()}render(){var i,o;const e=((i=this.wallet)==null?void 0:i.badge_type)==="certified";return c`
      <button>
        ${this.imageTemplate()}
        <wui-flex flexDirection="row" alignItems="center" justifyContent="center" gap="3xs">
          <wui-text
            variant="tiny-500"
            color="inherit"
            class=${x(e?"certified":void 0)}
            >${(o=this.wallet)==null?void 0:o.name}</wui-text
          >
          ${e?c`<wui-icon size="sm" name="walletConnectBrown"></wui-icon>`:null}
        </wui-flex>
      </button>
    `}imageTemplate(){var e,i;return!this.visible&&!this.imageSrc||this.imageLoading?this.shimmerTemplate():c`
      <wui-wallet-image
        size="md"
        imageSrc=${x(this.imageSrc)}
        name=${(e=this.wallet)==null?void 0:e.name}
        .installed=${(i=this.wallet)==null?void 0:i.installed}
        badgeSize="sm"
      >
      </wui-wallet-image>
    `}shimmerTemplate(){return c`<wui-shimmer width="56px" height="56px" borderRadius="xs"></wui-shimmer>`}async fetchImageSrc(){this.wallet&&(this.imageSrc=z.getWalletImage(this.wallet),!this.imageSrc&&(this.imageLoading=!0,this.imageSrc=await z.fetchWalletImage(this.wallet.image_id),this.imageLoading=!1))}};Ce.styles=Wo;et([y()],Ce.prototype,"visible",void 0);et([y()],Ce.prototype,"imageSrc",void 0);et([y()],Ce.prototype,"imageLoading",void 0);et([u()],Ce.prototype,"wallet",void 0);Ce=et([C("w3m-all-wallets-list-item")],Ce);const To=L`
  wui-grid {
    max-height: clamp(360px, 400px, 80vh);
    overflow: scroll;
    scrollbar-width: none;
    grid-auto-rows: min-content;
    grid-template-columns: repeat(auto-fill, 104px);
  }

  @media (max-width: 350px) {
    wui-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  wui-grid[data-scroll='false'] {
    overflow: hidden;
  }

  wui-grid::-webkit-scrollbar {
    display: none;
  }

  wui-loading-spinner {
    padding-top: var(--wui-spacing-l);
    padding-bottom: var(--wui-spacing-l);
    justify-content: center;
    grid-column: 1 / span 4;
  }
`;var Be=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};const mi="local-paginator";let ge=class extends I{constructor(){super(),this.unsubscribe=[],this.paginationObserver=void 0,this.loading=!S.state.wallets.length,this.wallets=S.state.wallets,this.recommended=S.state.recommended,this.featured=S.state.featured,this.filteredWallets=S.state.filteredWallets,this.unsubscribe.push(S.subscribeKey("wallets",e=>this.wallets=e),S.subscribeKey("recommended",e=>this.recommended=e),S.subscribeKey("featured",e=>this.featured=e),S.subscribeKey("filteredWallets",e=>this.filteredWallets=e))}firstUpdated(){this.initialFetch(),this.createPaginationObserver()}disconnectedCallback(){var e;this.unsubscribe.forEach(i=>i()),(e=this.paginationObserver)==null||e.disconnect()}render(){return c`
      <wui-grid
        data-scroll=${!this.loading}
        .padding=${["0","s","s","s"]}
        columnGap="xxs"
        rowGap="l"
        justifyContent="space-between"
      >
        ${this.loading?this.shimmerTemplate(16):this.walletsTemplate()}
        ${this.paginationLoaderTemplate()}
      </wui-grid>
    `}async initialFetch(){var i;this.loading=!0;const e=(i=this.shadowRoot)==null?void 0:i.querySelector("wui-grid");e&&(await S.fetchWalletsByPage({page:1}),await e.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards",easing:"ease"}).finished,this.loading=!1,e.animate([{opacity:0},{opacity:1}],{duration:200,fill:"forwards",easing:"ease"}))}shimmerTemplate(e,i){return[...Array(e)].map(()=>c`
        <wui-card-select-loader type="wallet" id=${x(i)}></wui-card-select-loader>
      `)}getWallets(){var n;const e=[...this.featured,...this.recommended];((n=this.filteredWallets)==null?void 0:n.length)>0?e.push(...this.filteredWallets):e.push(...this.wallets);const i=E.uniqueBy(e,"id"),o=De.markWalletsAsInstalled(i);return De.markWalletsWithDisplayIndex(o)}walletsTemplate(){return this.getWallets().map(i=>c`
        <w3m-all-wallets-list-item
          @click=${()=>this.onConnectWallet(i)}
          .wallet=${i}
        ></w3m-all-wallets-list-item>
      `)}paginationLoaderTemplate(){const{wallets:e,recommended:i,featured:o,count:n}=S.state,t=window.innerWidth<352?3:4,a=e.length+i.length;let l=Math.ceil(a/t)*t-a+t;return l-=e.length?o.length%t:0,n===0&&o.length>0?null:n===0||[...o,...e,...i].length<n?this.shimmerTemplate(l,mi):null}createPaginationObserver(){var i;const e=(i=this.shadowRoot)==null?void 0:i.querySelector(`#${mi}`);e&&(this.paginationObserver=new IntersectionObserver(([o])=>{if(o!=null&&o.isIntersecting&&!this.loading){const{page:n,count:t,wallets:a}=S.state;a.length<t&&S.fetchWalletsByPage({page:n+1})}}),this.paginationObserver.observe(e))}onConnectWallet(e){O.selectWalletConnector(e)}};ge.styles=To;Be([y()],ge.prototype,"loading",void 0);Be([y()],ge.prototype,"wallets",void 0);Be([y()],ge.prototype,"recommended",void 0);Be([y()],ge.prototype,"featured",void 0);Be([y()],ge.prototype,"filteredWallets",void 0);ge=Be([C("w3m-all-wallets-list")],ge);const So=L`
  wui-grid,
  wui-loading-spinner,
  wui-flex {
    height: 360px;
  }

  wui-grid {
    overflow: scroll;
    scrollbar-width: none;
    grid-auto-rows: min-content;
    grid-template-columns: repeat(auto-fill, 104px);
  }

  wui-grid[data-scroll='false'] {
    overflow: hidden;
  }

  wui-grid::-webkit-scrollbar {
    display: none;
  }

  wui-loading-spinner {
    justify-content: center;
    align-items: center;
  }

  @media (max-width: 350px) {
    wui-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
`;var St=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let Oe=class extends I{constructor(){super(...arguments),this.prevQuery="",this.prevBadge=void 0,this.loading=!0,this.query=""}render(){return this.onSearch(),this.loading?c`<wui-loading-spinner color="accent-100"></wui-loading-spinner>`:this.walletsTemplate()}async onSearch(){(this.query.trim()!==this.prevQuery.trim()||this.badge!==this.prevBadge)&&(this.prevQuery=this.query,this.prevBadge=this.badge,this.loading=!0,await S.searchWallet({search:this.query,badge:this.badge}),this.loading=!1)}walletsTemplate(){const{search:e}=S.state,i=De.markWalletsAsInstalled(e);return e.length?c`
      <wui-grid
        data-testid="wallet-list"
        .padding=${["0","s","s","s"]}
        rowGap="l"
        columnGap="xs"
        justifyContent="space-between"
      >
        ${i.map(o=>c`
            <w3m-all-wallets-list-item
              @click=${()=>this.onConnectWallet(o)}
              .wallet=${o}
              data-testid="wallet-search-item-${o.id}"
            ></w3m-all-wallets-list-item>
          `)}
      </wui-grid>
    `:c`
        <wui-flex
          data-testid="no-wallet-found"
          justifyContent="center"
          alignItems="center"
          gap="s"
          flexDirection="column"
        >
          <wui-icon-box
            size="lg"
            iconColor="fg-200"
            backgroundColor="fg-300"
            icon="wallet"
            background="transparent"
          ></wui-icon-box>
          <wui-text data-testid="no-wallet-found-text" color="fg-200" variant="paragraph-500">
            No Wallet found
          </wui-text>
        </wui-flex>
      `}onConnectWallet(e){O.selectWalletConnector(e)}};Oe.styles=So;St([y()],Oe.prototype,"loading",void 0);St([u()],Oe.prototype,"query",void 0);St([u()],Oe.prototype,"badge",void 0);Oe=St([C("w3m-all-wallets-search")],Oe);var si=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let wt=class extends I{constructor(){super(...arguments),this.search="",this.onDebouncedSearch=E.debounce(e=>{this.search=e})}render(){const e=this.search.length>=2;return c`
      <wui-flex .padding=${["0","s","s","s"]} gap="xs">
        <wui-search-bar @inputChange=${this.onInputChange.bind(this)}></wui-search-bar>
        <wui-certified-switch
          ?checked=${this.badge}
          @click=${this.onClick.bind(this)}
          data-testid="wui-certified-switch"
        ></wui-certified-switch>
        ${this.qrButtonTemplate()}
      </wui-flex>
      ${e||this.badge?c`<w3m-all-wallets-search
            query=${this.search}
            badge=${x(this.badge)}
          ></w3m-all-wallets-search>`:c`<w3m-all-wallets-list badge=${x(this.badge)}></w3m-all-wallets-list>`}
    `}onInputChange(e){this.onDebouncedSearch(e.detail)}onClick(){if(this.badge==="certified"){this.badge=void 0;return}this.badge="certified",Me.showSvg("Only WalletConnect certified",{icon:"walletConnectBrown",iconColor:"accent-100"})}qrButtonTemplate(){return E.isMobile()?c`
        <wui-icon-box
          size="lg"
          iconSize="xl"
          iconColor="accent-100"
          backgroundColor="accent-100"
          icon="qrCode"
          background="transparent"
          border
          borderColor="wui-accent-glass-010"
          @click=${this.onWalletConnectQr.bind(this)}
        ></wui-icon-box>
      `:null}onWalletConnectQr(){A.push("ConnectingWalletConnect")}};si([y()],wt.prototype,"search",void 0);si([y()],wt.prototype,"badge",void 0);wt=si([C("w3m-all-wallets-view")],wt);const Lo=L`
  button {
    column-gap: var(--wui-spacing-s);
    padding: 11px 18px 11px var(--wui-spacing-s);
    width: 100%;
    background-color: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-xs);
    color: var(--wui-color-fg-250);
    transition:
      color var(--wui-ease-out-power-1) var(--wui-duration-md),
      background-color var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: color, background-color;
  }

  button[data-iconvariant='square'],
  button[data-iconvariant='square-blue'] {
    padding: 6px 18px 6px 9px;
  }

  button > wui-flex {
    flex: 1;
  }

  button > wui-image {
    width: 32px;
    height: 32px;
    box-shadow: 0 0 0 2px var(--wui-color-gray-glass-005);
    border-radius: var(--wui-border-radius-3xl);
  }

  button > wui-icon {
    width: 36px;
    height: 36px;
    transition: opacity var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: opacity;
  }

  button > wui-icon-box[data-variant='blue'] {
    box-shadow: 0 0 0 2px var(--wui-color-accent-glass-005);
  }

  button > wui-icon-box[data-variant='overlay'] {
    box-shadow: 0 0 0 2px var(--wui-color-gray-glass-005);
  }

  button > wui-icon-box[data-variant='square-blue'] {
    border-radius: var(--wui-border-radius-3xs);
    position: relative;
    border: none;
    width: 36px;
    height: 36px;
  }

  button > wui-icon-box[data-variant='square-blue']::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: inherit;
    border: 1px solid var(--wui-color-accent-glass-010);
    pointer-events: none;
  }

  button > wui-icon:last-child {
    width: 14px;
    height: 14px;
  }

  button:disabled {
    color: var(--wui-color-gray-glass-020);
  }

  button[data-loading='true'] > wui-icon {
    opacity: 0;
  }

  wui-loading-spinner {
    position: absolute;
    right: 18px;
    top: 50%;
    transform: translateY(-50%);
  }
`;var Z=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let F=class extends I{constructor(){super(...arguments),this.tabIdx=void 0,this.variant="icon",this.disabled=!1,this.imageSrc=void 0,this.alt=void 0,this.chevron=!1,this.loading=!1}render(){return c`
      <button
        ?disabled=${this.loading?!0:!!this.disabled}
        data-loading=${this.loading}
        data-iconvariant=${x(this.iconVariant)}
        tabindex=${x(this.tabIdx)}
      >
        ${this.loadingTemplate()} ${this.visualTemplate()}
        <wui-flex gap="3xs">
          <slot></slot>
        </wui-flex>
        ${this.chevronTemplate()}
      </button>
    `}visualTemplate(){if(this.variant==="image"&&this.imageSrc)return c`<wui-image src=${this.imageSrc} alt=${this.alt??"list item"}></wui-image>`;if(this.iconVariant==="square"&&this.icon&&this.variant==="icon")return c`<wui-icon name=${this.icon}></wui-icon>`;if(this.variant==="icon"&&this.icon&&this.iconVariant){const e=["blue","square-blue"].includes(this.iconVariant)?"accent-100":"fg-200",i=this.iconVariant==="square-blue"?"mdl":"md",o=this.iconSize?this.iconSize:i;return c`
        <wui-icon-box
          data-variant=${this.iconVariant}
          icon=${this.icon}
          iconSize=${o}
          background="transparent"
          iconColor=${e}
          backgroundColor=${e}
          size=${i}
        ></wui-icon-box>
      `}return null}loadingTemplate(){return this.loading?c`<wui-loading-spinner
        data-testid="wui-list-item-loading-spinner"
        color="fg-300"
      ></wui-loading-spinner>`:c``}chevronTemplate(){return this.chevron?c`<wui-icon size="inherit" color="fg-200" name="chevronRight"></wui-icon>`:null}};F.styles=[B,M,Lo];Z([u()],F.prototype,"icon",void 0);Z([u()],F.prototype,"iconSize",void 0);Z([u()],F.prototype,"tabIdx",void 0);Z([u()],F.prototype,"variant",void 0);Z([u()],F.prototype,"iconVariant",void 0);Z([u({type:Boolean})],F.prototype,"disabled",void 0);Z([u()],F.prototype,"imageSrc",void 0);Z([u()],F.prototype,"alt",void 0);Z([u({type:Boolean})],F.prototype,"chevron",void 0);Z([u({type:Boolean})],F.prototype,"loading",void 0);F=Z([C("wui-list-item")],F);var Oo=function(r,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,i,o);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(n<3?a(t):n>3?a(e,i,t):a(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let vi=class extends I{constructor(){var e;super(...arguments),this.wallet=(e=A.state.data)==null?void 0:e.wallet}render(){if(!this.wallet)throw new Error("w3m-downloads-view");return c`
      <wui-flex gap="xs" flexDirection="column" .padding=${["s","s","l","s"]}>
        ${this.chromeTemplate()} ${this.iosTemplate()} ${this.androidTemplate()}
        ${this.homepageTemplate()}
      </wui-flex>
    `}chromeTemplate(){var e;return(e=this.wallet)!=null&&e.chrome_store?c`<wui-list-item
      variant="icon"
      icon="chromeStore"
      iconVariant="square"
      @click=${this.onChromeStore.bind(this)}
      chevron
    >
      <wui-text variant="paragraph-500" color="fg-100">Chrome Extension</wui-text>
    </wui-list-item>`:null}iosTemplate(){var e;return(e=this.wallet)!=null&&e.app_store?c`<wui-list-item
      variant="icon"
      icon="appStore"
      iconVariant="square"
      @click=${this.onAppStore.bind(this)}
      chevron
    >
      <wui-text variant="paragraph-500" color="fg-100">iOS App</wui-text>
    </wui-list-item>`:null}androidTemplate(){var e;return(e=this.wallet)!=null&&e.play_store?c`<wui-list-item
      variant="icon"
      icon="playStore"
      iconVariant="square"
      @click=${this.onPlayStore.bind(this)}
      chevron
    >
      <wui-text variant="paragraph-500" color="fg-100">Android App</wui-text>
    </wui-list-item>`:null}homepageTemplate(){var e;return(e=this.wallet)!=null&&e.homepage?c`
      <wui-list-item
        variant="icon"
        icon="browser"
        iconVariant="square-blue"
        @click=${this.onHomePage.bind(this)}
        chevron
      >
        <wui-text variant="paragraph-500" color="fg-100">Website</wui-text>
      </wui-list-item>
    `:null}onChromeStore(){var e;(e=this.wallet)!=null&&e.chrome_store&&E.openHref(this.wallet.chrome_store,"_blank")}onAppStore(){var e;(e=this.wallet)!=null&&e.app_store&&E.openHref(this.wallet.app_store,"_blank")}onPlayStore(){var e;(e=this.wallet)!=null&&e.play_store&&E.openHref(this.wallet.play_store,"_blank")}onHomePage(){var e;(e=this.wallet)!=null&&e.homepage&&E.openHref(this.wallet.homepage,"_blank")}};vi=Oo([C("w3m-downloads-view")],vi);export{wt as W3mAllWalletsView,Gt as W3mConnectingWcBasicView,vi as W3mDownloadsView};
