"use strict";let gs_kiri_scrap=exports;!function(){if(self.kiri||(self.kiri={}),self.kiri.Scrap)return;let t=self.kiri,e=t.driver,i=self.base,o=(i.config,i.debug),s=i.util,r=(i.polygons,Math.sqrt),n=d.prototype,l=s.time,a=0,c=[];function h(t,e){return new d(t,e)}t.Scrap=d,t.newScrap=h;let u=d.Groups={forid:function(t){for(let e=0;e<c.length;e++)if(c[e].id===t)return c[e];let e=[];return e.id=t,c.push(e),e},remove:function(t){c.slice().forEach(e=>{let i=e.indexOf(t);i>=0&&e.splice(i,1),0===e.length&&(i=c.indexOf(e),c.splice(i,1))})},blocks:function(){return c.map(t=>({w:t[0].track.box.w,h:t[0].track.box.h,move:(e,i,o,s)=>{t.forEach(t=>{t.mesh.material.visible=!0,t._move(e,i,o,s)})}}))},loadDone:function(){c.forEach(t=>{t.centered||(t[0].center(),t.centered=!0)})},bounds:function(t){let e=null;return t.forEach(t=>{let i=t.mesh.getBoundingBox(!0);e=e?e.union(i):i}),e}};function d(t,e){this.id=t||(new Date).getTime().toString(36)+a++,this.group=e||[],this.group.push(this),this.group.id||(this.group.id=this.id),c.indexOf(this.group)<0&&c.push(this.group),this.mesh=null,this.points=null,this.bounds=null,this.wire=null,this.topo=null,this.slices=null,this.settings=null,this.modified=!0,this.track={box:{w:0,h:0,d:0},scale:{x:1,y:1,z:1},rot:{x:0,y:0,z:0},pos:{x:0,y:0,z:0},mirror:!1},this.stats={slice_time:0,load_time:0,progress:0},this.saved=!1,this.support=!1}d.loadFromCatalog=function(e,i){t.catalog.getFile(e,function(t){i(h().loadVertices(t))})},d.loadFromState=function(e,i,o){t.odb.get("ws-save-"+e,function(t){if(t){let s=t.geo||t,r=t.track||void 0,n=t.group||e,a=h(e,u.forid(n));a.saved=l(),i(a.loadVertices(s)),o&&r&&r.pos&&(a.track=r,a.move(r.pos.x,r.pos.y,r.pos.z,!0))}else i(null)})},d.deleteFromState=function(e,i){t.odb.remove("ws-save-"+e,i)},d.verticesToPoints=function(t,e){let s,n,a=new Array(t.length/3),c=0,h=0,u=l(),d={},f=0,m=0,p=a.length;for(;c<t.length;){let e=i.newPoint(t[c++],t[c++],t[c++]),o=e.key,s=d[o];s||(s=e,d[o]=e,f++),a[h++]=s}for(;a.length>i.config.decimate_threshold&&e&&i.config.precision_decimate>0;){let t,e=[],o=0;for(c=0;c<p;){let t=a[c++],i=a[c++],o=a[c++];e.push({p1:t,p2:i,d:r(t.distToSq3D(i))}),e.push({p1:t,p2:o,d:r(t.distToSq3D(o))}),e.push({p1:i,p2:o,d:r(i.distToSq3D(o))})}for(e.sort(function(t,e){return t.d-e.d}),c=0;c<e.length&&!((t=e[c]).d>=i.config.precision_decimate);c++)t.p1.op||t.p2.op||(t.p1.op=t.p2.op=t.p1.midPointTo3D(t.p2),o++);if(0===o)break;for(m++,s=new Array(p),n=0,c=0;c<p;){let t=a[c++],e=a[c++],i=a[c++];t.op&&t.op===e.op||(t.op&&t.op===i.op||e.op&&e.op===i.op||(s[n++]=t.op||t,s[n++]=e.op||e,s[n++]=i.op||i))}a=s.slice(0,n),p=n}return m&&o.log({before:t.length/3,after:a.length,unique:f,decimations:m,time:l()-u}),a},d.pointsToVertices=function(t){let e=new Float32Array(3*t.length),i=0,o=0;for(;i<t.length;)e[o++]=t[i].x,e[o++]=t[i].y,e[o++]=t[i++].z;return e},n.saveToCatalog=function(e){let i=this,o=s.time();return t.catalog.putFile(e,this.getGeoVertices(),function(t){t&&t.length&&(console.log("saving decimated mesh ["+t.length+"] time ["+(s.time()-o)+"]"),i.loadVertices(t))}),this},n.saveState=function(e){let i=this;t.odb.put("ws-save-"+this.id,{geo:i.getGeoVertices(),track:i.track,group:this.group.id},function(t){i.saved=l(),e&&e()})},n.loadVertices=function(t){if(this.mesh)return this.mesh.geometry.setAttribute("position",new THREE.BufferAttribute(t,3)),this.mesh.geometry.computeFaceNormals(),this.mesh.geometry.computeVertexNormals(),this.points=null,this;{let e=new THREE.BufferGeometry;return e.setAttribute("position",new THREE.BufferAttribute(t,3)),this.loadGeometry(e)}},n.loadGeometry=function(t){let e=new THREE.Mesh(t,new THREE.MeshPhongMaterial({color:16776960,specular:1579032,shininess:100,transparent:!0,opacity:1}));return t.computeFaceNormals(),t.computeVertexNormals(),e.material.side=THREE.DoubleSide,e.castShadow=!0,e.receiveShadow=!0,e.scrap=this,this.mesh=e,this.center(!0),this},n.groupBounds=function(){return u.bounds(this.group)},n.setPoints=function(t){return this.points=t||null,this},n.clearSlices=function(){let t=this.slices,e=this.mesh;t&&(t.forEach(function(t){e.remove(t.view)}),this.slices=null)},n.setColor=function(t,e){Array.isArray(t)&&(t=t[this.getExtruder(e)%t.length]),this.mesh.material.color.set(t)},n.setOpacity=function(t){let e=this.mesh;t<=0?(e.material.transparent=!1,e.material.opacity=1,e.material.visible=!1):s.inRange(t,0,1)&&(e.material.transparent=t<1,e.material.opacity=t,e.material.visible=!0)},n.center=function(t){let e=t?this.mesh.getBoundingBox(!0):this.groupBounds(),i=e.min.clone(),o=e.max.clone().sub(i).multiplyScalar(.5),s=i.x+o.x,r=i.y+o.y,n=i.z;t||this.group.forEach(t=>{t.moveMesh(s,r,n)})},n.moveMesh=function(t,e,i){let o=this.mesh.geometry.attributes.position,s=o.array;for(let o=0;o<s.length;o+=3)s[o]-=t,s[o+1]-=e,s[o+2]-=i;o.needsUpdate=!0;let r=this.groupBounds();this.track.box={w:r.max.x-r.min.x,h:r.max.y-r.min.y,d:r.max.z-r.min.z},this.points=null,this.modified=!0},n.setTopZ=function(t){let e=this.mesh,i=this.track.pos;t?(i.z=e.getBoundingBox().max.z-t,e.position.z=-i.z-.01):(i.z=0,e.position.z=0),this.modified=!0},n.move=function(t,e,i,o){this.group.forEach(s=>{s._move(t,e,i,o)})},n._move=function(e,i,o,s){let r=this.mesh,n=this.track.pos;r.material.visible&&(s?(r.position.set(e,i,o),n.x=e||0,n.y=i||0,n.z=o||0):(r.position.x+=e||0,r.position.y+=i||0,r.position.z+=-o||0,n.x+=e||0,n.y+=i||0,n.z+=o||0),(e||i||o)&&(this.modified=!0,t.api.event.emit("scrap.move",{scrap:this,pos:n})))},n.scale=function(t,e,i){this.group.forEach(o=>{o._scale(t,e,i)}),this.center()},n._scale=function(t,e,i){let o=this.mesh,s=this.track.scale;this.bounds=null,this.setWireframe(!1),this.clearSlices(),o.geometry.applyMatrix4((new THREE.Matrix4).makeScale(t,e,i)),s.x*=t||1,s.y*=e||1,s.z*=i||1},n.rotate=function(t,e,i){this.group.forEach(o=>{o._rotate(t,e,i,!1)}),this.center()},n._rotate=function(t,e,i,o){o||(this.bounds=null,this.setWireframe(!1),this.clearSlices());let s=new THREE.Matrix4,r="number"==typeof t;if(s=r?s.makeRotationFromEuler(new THREE.Euler(t||0,e||0,i||0)):s.makeRotationFromQuaternion(t),this.mesh.geometry.applyMatrix4(s),!o&&r){let o=this.track.rot;o.x+=t||0,o.y+=e||0,o.z+=i||0}},n.mirror=function(){this.group.forEach(t=>{t._mirror()}),this.center()},n._mirror=function(){this.setWireframe(!1),this.clearSlices();let t,e=this.track,i=this.mesh.geometry,o=i.attributes,s=o.position.array,r=o.normal.array;for(t=0;t<s.length;t+=3)s[t]=-s[t],r[t]=-r[t];i.computeFaceNormals(),i.computeVertexNormals(),e.mirror=!e.mirror},n.getGeoVertices=function(){return this.mesh.geometry.getAttribute("position").array},n.getPoints=function(){return this.points||(this.points=d.verticesToPoints(this.getGeoVertices())),this.points},n.getBoundingBox=function(t){return this.bounds&&!t||(this.bounds=new THREE.Box3,this.bounds.setFromPoints(this.getPoints())),this.bounds},n.isModified=function(){return this.modified},n.getExtruder=function(t){if(t&&t.scrap){let e=t.scrap[this.id];return e&&e.extruder>=0?e.extruder:0}return 0},n.slice=function(i,r,n,l){let a=this,c=s.time();if(a.settings=i,a.clearSlices(),n(1e-4,"slicing"),l)a.slices=[],t.work.slice(i,this,function(e){e.update&&n(e.update,e.updateStatus),e.send_start&&(a.xfer={start:e.send_start}),e.topo&&(a.topo=e.topo),e.stats&&(a.stats=e.stats),e.send_end&&(a.stats.load_time=a.xfer.start-e.send_end),e.slice&&a.slices.push(t.codec.decode(e.slice,{mesh:a.mesh})),e.polish&&(a.polish=t.codec.decode(e.polish)),e.error&&r(!1,e.error),e.done&&(a.modified=!1,r(!0))});else{let t=function(t){if(t)return r(t);n(1,"transferring"),a.stats.slice_time=s.time()-c,a.modified=!1,r()},l=function(t,e){n(t,e)},h=e[i.mode.toUpperCase()];h?h.slice(i,a,l,t):(o.log("invalid mode: "+i.mode),r("invalid mode: "+i.mode))}},n.getCamBounds=function(t){let e=this.getBoundingBox().clone();return e.max.z+=t.process.camZTopOffset,e},n.render=function(t,i){let o=this.slices;if(!o)return;let s=this.settings,r=e[s.mode.toUpperCase()];if(r.sliceRender)return r.sliceRender(this);let n=this.getExtruder(s);o.forEach(function(e){e.renderOutline(t,n)}),o.forEach(function(e){e.renderShells(t)}),i||o.forEach(function(t){t.renderDiff()}),o.forEach(function(t){t.renderSolidFill()}),i||o.forEach(function(t){t.renderSolidOutlines()}),i||o.forEach(function(t){t.renderSparseFill()}),i||o.forEach(function(t){t.renderSupport()})},n.hideSlices=function(){let t=!1;return this.slices&&this.slices.forEach(function(e){t=t||e.view.visible,e.view.visible=!1}),t},n.toggleWireframe=function(t,e){this.setWireframe(!this.wire,t,e)},n.setWireframe=function(t,e,i){let o=this.mesh,s=this;this.wire&&(o.remove(this.wire),this.wire=null,this.setOpacity(1),this.hideSlices()),t&&(s.wire=base.render.wireframe(o,this.getPoints(),e),s.setOpacity(i))}}();