"use strict";let gs_kiri_slicer=exports;!function(){if(self.kiri||(self.kiri={}),self.kiri.slicer)return;self.kiri.slicer={slice:h,sliceWidget:function(e,t,n,o){h(e.getPoints(),e.getBoundingBox(),t,n,o)},connectLines:p};let e=self.kiri,t=self.base,n=t.config,o=t.util,l=t.polygons,r=o.time,i=e.newSlice,s=t.newOrderedLine;function h(t,h,u,f,g){let a=u.topo,c=u.simple,d=u.swapX||u.swapY,z=u.cam,m=0,w=0;if(d){t=t.slice();let e,n=new THREE.Box3,o={};n.setFromPoints(t),u.swapX&&(m=-n.max.x),u.swapY&&(w=-n.max.y);for(let n,l=0;l<t.length;l++)(e=o[(n=t[l]).key])?t[l]=e:(e=n.clone(),u.swapX?e.swapXZ():u.swapY&&e.swapYZ(),e.rekey(),o[n.key]=e,t[l]=e);n.setFromPoints(t);for(let e,o=0;o<t.length;o++)1!==(e=t[o]).mod&&(e.mod=1,e.z-=n.min.z);n.setFromPoints(t),h=n}let y,k,v,x,M,F=u.zmin||Math.floor(h.min.z),E=u.zmax||Math.ceil(h.max.z),P=u.height,b=u.minHeight,X=u.firstHeight||P,H=P/2,Y=[],S=[],Z=[],_={},O={},T={},D=r(),I=[],L=0,q=[],B=0,A=e.driver.CAM.process;function C(e){e=o.round(e,5),_[e]=(_[e]||0)+1}for(u.add&&(E+=P),k=0;k<t.length;)if(v=t[k++],x=t[k++],M=t[k++],L+=Math.abs(v.z-x.z)+Math.abs(x.z-M.z)+Math.abs(M.z-v.z),(0===P||b)&&(C(v.z),C(x.z),C(M.z)),v.z===x.z&&x.z===M.z&&v.z>h.min.z){let e=v.z.toFixed(5),t=Math.abs(o.area2(v,x,M))/2;O[e]?O[e]+=t:O[e]=t}else{if(v.z===x.z&&v.z>h.min.z){let e=v.z.toFixed(5),t=T[e];T[e]=(t||0)+1}if(x.z===M.z&&x.z>h.min.z){let e=x.z.toFixed(5),t=T[e];T[e]=(t||0)+1}if(M.z===v.z&&M.z>h.min.z){let e=M.z.toFixed(5),t=T[e];T[e]=(t||0)+1}}if(u.trace){let e,t={};Object.entries(T).map(e=>e.map(e=>parseFloat(e))).sort((e,t)=>t[0]-e[0]).forEach((n,o)=>{if(o>0){e[0]-n[0]>.1&&n[1]>100&&(t[n[0].toFixed(5)]=n[1],O[n[0].toFixed(5)]=n[1])}n[1]>10&&(e=n)});T=t}let G=Math.max(1,Math.ceil(E/(L/t.length))-1);if(y=1/(E/G),G>1){for(k=0;k<G+1;k++)q.push([]);for(k=0;k<t.length;){v=t[k++],x=t[k++],M=t[k++];let e=Math.min(v.z,x.z,M.z),n=Math.max(v.z,x.z,M.z),o=Math.floor(e*y),l=Math.ceil(n*y);for(B=o;B<l;B++)q[B].push(v),q[B].push(x),q[B].push(M)}}if(0===P||b){for(let e in _)_.hasOwnProperty(e)&&Z.push(parseFloat(e));Z.sort(function(e,t){return e-t})}if(u.single)S.push(F+P);else if(0===P){let e=Z;for(k=0;k<e.length-1;k++)S.push((e[k]+e[k+1])/2)}else if(z){for(P=(E-F)/(Math.floor(E/P)+1),k=F;k<E;k+=P)S.push(k);for(let e in O)!O.hasOwnProperty(e)||O[e]<10||(e=parseFloat(e),!S.contains(e)&&e>=F&&S.push(e));S.sort(function(e,t){return t-e}),Y=S.slice()}else if(b){let e,t,n,o,l,r=F+X,i=0;for(Y.push(X),S.push(X/2);r<E&&i<Z.length;)if(!(r>=(l=Z[i++])||(e=l-r)<b))for(t=Math.floor(e/b),(n=Math.floor(e/P))&&n<=t?(e%P>.01&&n++,o=e/n):o=e;r<l;)Y.push(o),S.push(r+o/2),r+=o}else for(u.firstHeight&&(S.push(u.firstHeight/2),Y.push(u.firstHeight),F=u.firstHeight),k=F+H;k<E;k+=P)S.push(k),Y.push(P);for(let e=0;e<S.length;e++){let t=S[e].toFixed(5),n=!1,o=!1;O[t]&&(n=!0),T[t]&&(o=!0),(n||o)&&(S[e]+=z?.001:-.001);let l=J(S[e],Y[e],n,o);z&&l&&(l.z=Y[e]),g(e/S.length)}for(z&&I.length>0&&(I[I.length-1].hasFlats=!0),k=1;k<I.length;k++)I[k-1].up=I[k],I[k].down=I[k-1];function N(e,t,o){let l=e.z-t;Math.abs(l)<n.precision_slice_z?o.on.push(e):l<0?o.under.push(e):o.over.push(e)}function j(e,t,n){let o=[];for(let l=0;l<e.length;l++)for(let r=0;r<t.length;r++)o.push(e[l].intersectZ(t[r],n));return o}function R(e,t){let n=e[t.key];return n||(e[t.key]=t,t)}function W(e,t,n,o,l){t=R(e,t),n=R(e,n);let r=s(t,n);return r.coplanar=o||!1,r.edge=l||!1,r}function J(e,n,o,r){let s={},h=[],f=i(e,u.view?u.view.newGroup():null),g=1==G?t:q[Math.floor(e*y)];if(g){o&&z&&(f.hasFlats=!0);for(let t=0;t<g.length;){v=g[t++],x=g[t++],M=g[t++];let n={under:[],over:[],on:[]};if(N(v,e,n),N(x,e,n),N(M,e,n),3===n.under.length||3===n.over.length);else if(2===n.on.length)h.push(W(s,n.on[0],n.on[1],!1,!0));else if(3===n.on.length);else if(0===n.under.length||0===n.over.length);else{let t=j(n.over,n.under,e);t.length<2&&1===n.on.length&&t.push(n.on[0]),2===t.length?h.push(W(s,t[0],t[1])):console.log({msg:"invalid ips",line:t,where:n})}}if(0!=h.length||!u.noEmpty){if(f.height=n,f.index=I.length,f.lines=function(e){let t=[],n=[],o=[],l={};function r(e,t){!function(e){let t=l[e.key];t||(o.push(e),l[e.key]=e)}(e),e.group?e.group.push(t):e.group=[t]}return e.sort(function(e,t){return e.key===t.key?(e.del=!e.edge,t.del=!t.edge,0):e.key<t.key?-1:1}),e.forEach(function(e){e.del||(n.push(e),r(e.p1,e),r(e.p2,e))}),o.forEach(function(e){if(2!=e.group.length)return;let t=e.group[0],o=e.group[1];if(t.isCollinear(o)){t.del=!0,o.del=!0;let l=t.p1!=e?t.p1:t.p2,r=o.p1!=e?o.p1:o.p2,i=base.newOrderedLine(l,r);l.group.remove(t),l.group.remove(o),r.group.remove(t),r.group.remove(o),l.group.push(i),r.group.push(i),i.edge=t.edge||o.edge,n.push(i)}}),n.sort(function(e,t){return e.key===t.key?(e.del=!0,t.del=!t.edge,0):e.key<t.key?-1:1}),n.forEach(function(e){e.del||(t.push(e),e.p1.group=null,e.p2.group=null)}),t}(h),a||c||(f.groups=p(f.lines,I.length),l.nest(f.groups).forEach(function(e){f.addTop(e)})),u.swapX||u.swapY){let e={x:m,y:w,z:0};if(f.camMode=u.swapX?A.FINISH_X:A.FINISH_Y,a){let t,n,o=f.lines,l=o.length;for(t=0;t<l;t++)(n=o[t]).p1=n.p1.clone(),n.p2=n.p2.clone();for(t=0;t<l;t++)n=o[t],u.swapX?(n.p1.swapXZ(),n.p2.swapXZ()):(n.p1.swapYZ(),n.p2.swapYZ()),n.p1.move(e),n.p2.move(e)}else c&&(f.groups=p(f.lines,I.length),f.groups.forEach(t=>{t.swap(u.swapX,u.swapY),t.move(e),t.inner=null}))}return I.push(f),f}}}I.slice_time=r()-D,f(I)}function p(e){let n,o,l=t.debug,r=t.config,i={},s=[],h=[],p=[],u=1,f=1,g=r.bridgeLineGapDistance;function a(e){let t=i[e.key];return t||(s.push(e),i[e.key]=e,e.mod=f++,e.toString=function(){return this.mod},e)}function c(e,t){e.group?e.group.push(t):e.group=[t]}function d(e,t){let n,o=e.length;for(n=0;n<o-1;n++)if(e[n]===t)return e.slice(n);return e}function z(t,n,o,r){let i=[];if(o.length>1e4)l.log("excessive path options @ "+o.length+" #"+e.length);else{for(;;){i.push(t);let e=t,l=t.group;if(n.push(t),t.del=!0,t.pos=u++,1!==n.length){if(l.length>2){l.forEach(function(e){e!==r&&(e.del?o.push(d(n,e)):z(e,n.slice(),o,t))});break}if(t=l[0]===r?l[1]:l[0],r=e,!t){n.open=!0,o.push(n);break}if(t.del){o.push(d(n,t));break}}else r=t,t=l[0]}for(let e=0;e<i.length;e++)i[e].del=!1}}function m(e){(e=e.clean()).length>2&&h.push(e)}function w(e){let n=null,o=0,l=0;e.forEach(function(e){(!n||e.length>n.length)&&(n=e),e.open?l++:o++}),o>1&&0===l?(e.forEach(function(e){e.poly=t.newPolygon().addPoints(e)}),e.sort(function(e,t){return t.poly.length-e.poly.length}),e.forEach(function(e){if(e.length<3)return;let t,n=e.length;for(t=0;t<n;t++)if(e[t].del)return;for(t=0;t<n;t++)e[t].del=!0;m(e.poly),0})):n.open?p.push(n):m(t.newPolygon().addPoints(n))}function y(e,t){return e.distToSq2D(t)<=.01}e.forEach(function(e){n=a(e.p1.round(7)),o=a(e.p2.round(7)),c(n,o),c(o,n)}),s.forEach(function(e){if(0===e.pos&&1===e.group.length){let t=[];z(e,[],t),t.length>0&&w(t)}}),s.forEach(function(e){if(0===e.pos&&2===e.group.length){let t=[];z(e,[],t),t.length>0&&w(t)}});for(let e=0;e<p.length;e++){let n,o,l,r=p[e],i=r[r.length-1];if(g){if(!r.delete)e:for(let s=0;;){let h={dist:1/0};for(l=e+1;l<p.length;l++)(n=p[l]).delete||((o=i.distToSq2D(n[0]))<h.dist&&o<=g&&(h={dist:o,array:n}),(o=i.distToSq2D(n[n.length-1]))<h.dist&&o<=g&&(h={dist:o,array:n,reverse:!0}));if(!(n=h.array)){m(t.newPolygon().addPoints(r));break e}if(h.reverse&&n.reverse(),n.delete=!0,r.appendAll(n),i=r[r.length-1],s++,y(r[0],i)){m(t.newPolygon().addPoints(r));break e}}}else m(t.newPolygon().addPoints(r).setOpen())}return h}}();