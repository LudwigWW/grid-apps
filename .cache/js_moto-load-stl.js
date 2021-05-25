"use strict";!function(){function t(){this.vertices=null,this.normals=null,this.colors=null}var e=t.prototype;self.moto||(self.moto={}),self.moto.STL=t,e.load=function(t,e){var r=this,n=new XMLHttpRequest;n.addEventListener("load",function(t){200===t.target.status||0===t.target.status?(r.parse(t.target.response||t.target.responseText),e&&e(r.vertices)):e&&e(null,t.target.statusText)},!1),n.addEventListener("progress",function(t){},!1),n.addEventListener("error",function(){},!1),n.overrideMimeType&&n.overrideMimeType("text/plain; charset=x-user-defined"),n.open("GET",t,!0),n.responseType="arraybuffer",n.send(null)},e.encode=function(t,e){if(!t||t.length%3!=0)throw"invalid vertices";var r,n=t.length/3,a=new ArrayBuffer(16*n+n*(2/3)+84),o=new DataView(a),s=0,i=0,l=80;function u(t){o.setUint16(l,t,!0),l+=2}function f(t){o.setFloat32(l,t,!0),l+=4}function g(){f(t[s++]),f(t[s++]),f(t[s++])}for(r=n/3,o.setUint32(l,r,!0),l+=4;s<t.length;)f(e?e[i++]:0),f(e?e[i++]:0),f(e?e[i++]:0),g(),g(),g(),u(0);return a},e.parse=function(t){var e,r=this.convertToBinary(t);return 84+50*(e=new DataView(r)).getUint32(80,!0)===e.byteLength?this.parseBinary(r):this.parseASCII(this.convertToString(t))},e.parseBinary=function(t){for(var e,r,n,a,o,s,i=new DataView(t),l=i.getUint32(80,!0),u=!1,f=0;f<70;f++)1129270351==i.getUint32(f,!1)&&82==i.getUint8(f+4)&&61==i.getUint8(f+5)&&(u=!0,p=new Float32Array(3*l*3),a=i.getUint8(f+6)/255,o=i.getUint8(f+7)/255,s=i.getUint8(f+8)/255,i.getUint8(f+9)/255);for(var g=0,c=new Float32Array(3*l*3),h=new Float32Array(3*l*3),p=u?new Uint16Array(3*l*3):null,v=0;v<l;v++){var y=84+50*v,d=i.getFloat32(y,!0),F=i.getFloat32(y+4,!0),w=i.getFloat32(y+8,!0);if(u){var U=i.getUint16(y+48,!0);0==(32768&U)?(e=(31&U)/31,r=(U>>5&31)/31,n=(U>>10&31)/31):(e=a,r=o,n=s)}for(var A,T=1;T<=3;)A=y+12*T++,c[g]=i.getFloat32(A,!0),c[g+1]=i.getFloat32(A+4,!0),c[g+2]=i.getFloat32(A+8,!0),h[g]=d,h[g+1]=F,h[g+2]=w,u&&(p[g]=e,p[g+1]=r,p[g+2]=n),g+=3}return this.vertices=c,this.normals=h,this.colors=p,c},e.parseASCII=function(t){for(var e,r,n,a,o=[],s=[],i=/facet([\s\S]*?)endfacet/g;null!==(e=i.exec(t));){for(r=e[0],n=/normal[\s]+([\-+]?[0-9]+\.?[0-9]*([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+/g,a=/vertex[\s]+([\-+]?[0-9]+\.?[0-9]*([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+/g;null!==(e=n.exec(r));)s.push(parseFloat(e[1])),s.push(parseFloat(e[3])),s.push(parseFloat(e[5]));for(;null!==(e=a.exec(r));)o.push(parseFloat(e[1])),o.push(parseFloat(e[3])),o.push(parseFloat(e[5]))}var l,u=new Float32Array(o.length),f=new Float32Array(s.length);for(l=0;l<o.length;l++)u[l]=o[l];for(l=0;l<s.length;l++)f[l]=s[l];return this.vertices=u,this.normals=f,u},e.convertToString=function(t){if("string"!=typeof t){for(var e=new Uint8Array(t),r="",n=0;n<t.byteLength;n++)r+=String.fromCharCode(e[n]);return r}return t},e.convertToBinary=function(t){if("string"==typeof t){for(var e=new Uint8Array(t.length),r=0;r<t.length;r++)e[r]=255&t.charCodeAt(r);return e.buffer||e}return t}}();