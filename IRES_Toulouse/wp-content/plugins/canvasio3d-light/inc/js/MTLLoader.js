/**
 * Loads a Wavefront .mtl file specifying materials
 *
 * @author angelxuanchang
 */
THREE.MTLLoader=function(manager){this.manager=(manager!==undefined)?manager:THREE.DefaultLoadingManager};THREE.MTLLoader.prototype={constructor:THREE.MTLLoader,crossOrigin:'anonymous',load:function(url,onLoad,onProgress,onError){var scope=this,path=(this.path===undefined)?THREE.LoaderUtils.extractUrlBase(url):this.path,loader=new THREE.FileLoader(this.manager);loader.setPath(this.path);loader.load(url,function(text){onLoad(scope.parse(text,path))},onProgress,onError)},setPath:function(path){this.path=path;return this},setResourcePath:function(path){this.resourcePath=path;return this},setTexturePath:function(path){console.warn('THREE.MTLLoader: .setTexturePath() has been renamed to .setResourcePath().');return this.setResourcePath(path)},setCrossOrigin:function(value){this.crossOrigin=value;return this},setMaterialOptions:function(value){this.materialOptions=value;return this},parse:function(text,path){var lines=text.split('\n'),info={},delimiter_pattern=/\s+/,materialsInfo={};for(var i=0;i<lines.length;i++){var line=lines[i];line=line.trim();if(line.length===0||line.charAt(0)==='#'){continue}var pos=line.indexOf(' '),key=(pos>=0)?line.substring(0,pos):line;key=key.toLowerCase();var value=(pos>=0)?line.substring(pos+1):'';value=value.trim();if(key==='newmtl'){info={name:value};materialsInfo[value]=info}else{if(key==='ka'||key==='kd'||key==='ks'||key==='ke'){var ss=value.split(delimiter_pattern,3);info[key]=[parseFloat(ss[0]),parseFloat(ss[1]),parseFloat(ss[2])]}else{info[key]=value}}}var materialCreator=new THREE.MTLLoader.MaterialCreator(this.resourcePath||path,this.materialOptions);materialCreator.setCrossOrigin(this.crossOrigin);materialCreator.setManager(this.manager);materialCreator.setMaterials(materialsInfo);return materialCreator}};THREE.MTLLoader.MaterialCreator=function(baseUrl,options){this.baseUrl=baseUrl||'';this.options=options;this.materialsInfo={};this.materials={};this.materialsArray=[];this.nameLookup={};this.side=(this.options&&this.options.side)?this.options.side:THREE.FrontSide;this.wrap=(this.options&&this.options.wrap)?this.options.wrap:THREE.RepeatWrapping};THREE.MTLLoader.MaterialCreator.prototype={constructor:THREE.MTLLoader.MaterialCreator,crossOrigin:'anonymous',setCrossOrigin:function(value){this.crossOrigin=value;return this},setManager:function(value){this.manager=value},setMaterials:function(materialsInfo){this.materialsInfo=this.convert(materialsInfo);this.materials={};this.materialsArray=[];this.nameLookup={}},convert:function(materialsInfo){if(!this.options)return materialsInfo;var converted={};for(var mn in materialsInfo){var mat=materialsInfo[mn],covmat={};converted[mn]=covmat;for(var prop in mat){var save=true,value=mat[prop],lprop=prop.toLowerCase();switch(lprop){case 'kd':case 'ka':case 'ks':if(this.options&&this.options.normalizeRGB){value=[value[0]/255,value[1]/255,value[2]/255]}if(this.options&&this.options.ignoreZeroRGBs){if(value[0]===0&&value[1]===0&&value[2]===0){save=false}}break;default:break}if(save){covmat[lprop]=value}}}return converted},preload:function(){for(var mn in this.materialsInfo){this.create(mn)}},getIndex:function(materialName){return this.nameLookup[materialName]},getAsArray:function(){var index=0;for(var mn in this.materialsInfo){this.materialsArray[index]=this.create(mn);this.nameLookup[mn]=index;index++}return this.materialsArray},create:function(materialName){if(this.materials[materialName]===undefined){this.createMaterial_(materialName)}return this.materials[materialName]},createMaterial_:function(materialName){var scope=this,mat=this.materialsInfo[materialName],params={name:materialName,side:this.side};function resolveURL(baseUrl,url){if(typeof url!=='string'||url==='')return'';if(/^https?:\/\//i.test(url))return url;return baseUrl+url}function setMapForType(mapType,value){if(params[mapType])return;var texParams=scope.getTextureParams(value,params),map=scope.loadTexture(resolveURL(scope.baseUrl,texParams.url));map.repeat.copy(texParams.scale);map.offset.copy(texParams.offset);map.wrapS=scope.wrap;map.wrapT=scope.wrap;params[mapType]=map}for(var prop in mat){var value=mat[prop],n;if(value==='')continue;switch(prop.toLowerCase()){case 'kd':params.color=new THREE.Color().fromArray(value);break;case 'ks':params.specular=new THREE.Color().fromArray(value);break;case 'ke':params.emissive=new THREE.Color().fromArray(value);break;case 'map_kd':setMapForType("map",value);break;case 'map_ks':setMapForType("specularMap",value);break;case 'map_ke':setMapForType("emissiveMap",value);break;case 'norm':setMapForType("normalMap",value);break;case 'map_bump':case 'bump':setMapForType("bumpMap",value);break;case 'map_d':setMapForType("alphaMap",value);params.transparent=true;break;case 'ns':params.metalness=parseFloat(value/750);break;case 'd':n=parseFloat(value);if(n<1){params.opacity=n;params.transparent=true}break;case 'tr':n=parseFloat(value);if(this.options&&this.options.invertTrProperty)n=1-n;if(n>0){params.opacity=1-n;params.transparent=true}break;default:break}}this.materials[materialName]=new THREE.MeshStandardMaterial(params);return this.materials[materialName]},getTextureParams:function(value,matParams){var texParams={scale:new THREE.Vector2(1,1),offset:new THREE.Vector2(0,0)};var items=value.split(/\s+/),pos;pos=items.indexOf('-bm');if(pos>=0){matParams.bumpScale=parseFloat(items[pos+1]);items.splice(pos,2)}pos=items.indexOf('-s');if(pos>=0){texParams.scale.set(parseFloat(items[pos+1]),parseFloat(items[pos+2]));items.splice(pos,4)}pos=items.indexOf('-o');if(pos>=0){texParams.offset.set(parseFloat(items[pos+1]),parseFloat(items[pos+2]));items.splice(pos,4)}texParams.url=items.join(' ').trim();return texParams},loadTexture:function(url,mapping,onLoad,onProgress,onError){var texture,loader=THREE.Loader.Handlers.get(url),manager=(this.manager!==undefined)?this.manager:THREE.DefaultLoadingManager;if(loader===null){loader=new THREE.TextureLoader(manager)}if(loader.setCrossOrigin)loader.setCrossOrigin(this.crossOrigin);texture=loader.load(url,onLoad,onProgress,onError);if(mapping!==undefined)texture.mapping=mapping;return texture}};