"use strict";let gs_moto_ajax=exports;!function(){let t=self.moto;if(t||(t=self.moto={}),t.Ajax)return;t.Ajax=o,t.callAjax=function(t,e){new o(e).request(t)};let e=o.prototype,s=moto.KV,a="moto-ajax",i=moto.id=s.getItem(a)||(new Date).getTime().toString(36)+r()+r();t.restore=function(t){i=moto.id=t,s.setItem(a,i)},s.setItem(a,i);let n=["request not initialized","server connection established","request recieved","processing request","request complete"];function o(t,e){this.ajax=new XMLHttpRequest,this.ajax.onreadystatechange=this.onStateChange.bind(this),this.ajax.withCredentials=!0,this.state=n[0],this.callback=t,this.responseType=e}function r(){return Math.round(4294967295*Math.random()).toString(36)}e.onStateChange=function(){if(this.state=n[this.ajax.readyState],4===this.ajax.readyState&&this.callback){let t=this.ajax.status;t>=200&&t<300?this.callback(this.ajax.responseType?this.ajax.response:this.ajax.responseText,this.ajax):this.callback(null,this.ajax)}},e.request=function(t,e,s){this.ajax.open(e?"POST":"GET",t,!0),this.responseType&&(this.ajax.responseType=this.responseType),(s=s||{})["X-Moto-Ajax"]=i;for(let t in s)this.ajax.setRequestHeader(t,s[t]);e?this.ajax.send(e):this.ajax.send()}}();