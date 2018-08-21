/**
 * Add additional functionality to the OmniUpdate interface via API calls.
 * This library facilitates adding functionality to the OmniUpdate interface via GET and POST requests
 * to certain API endpoints and is enhanced by PHP code executed on a remote Server.
 * Although PHP can be used here, any programming language can be used, as long as it responds to 
 * HTTP Requests.
 *
 *
 */
var OUC = class{
	constructor( p ){
		this.apihost = location.protocol + '//' + location.host;
		this.data = "";
		this.json = [];
		for( let ky in p ) 
			if( p.hasOwnProperty(ky) ) 
				this[ky] = p[ky];
		if(this.version && this.skin && this.account && this.site)
			this.url = `${this.apihost}/${this.version}/${this.skin}/${this.account}/${this.site}`;
		return this;
	}
	
	get (prop) {
		return this[prop];
	}
	
	set ( prop, val ){
		this[ prop ] = val;
		return this;
	}
	
	/**
	* Synchronous path creation function
	* Will synchronously create a path within an OmniUpdate Site based on the intended_path parameter
	*
	* @param intended_path // String - path to create.  Will create the path if it does not exist.
	* @return "undefined"
	*/
	create_path( intended_path ){
		const pathInfo = this.getJson(this.apihost + "/files/list", {site: this.site, path: intended_path });
		const existing_path = pathInfo.staging_path;
		const cpath = intended_path.replace(existing_path, "");
		let full = "";
		
		cpath.split("/").forEach(seg => {
			if(seg){
				let res = this.requestSync("POST", this.apihost + "/files/new_folder", {
					name: seg,
					path: existing_path + full,
					site: this.site
				});	
				full +=  "/" + seg;
			}
		});
	}
	
	/**
	* Return true if a directory exists and false if it does not.
	*
	* @param d // String - root-relative path to check
	* @return Boolean // true or false
	*/
	dirExists( d ){
		const dir = "/" + d.split("/").filter(a => a).join("/"); // dir
		const resp = this.getJson(this.apihost + "/files/list", {site: this.site, path: dir});
		return dir === resp.staging_path ? true : false;
	}
	
	/**
	* Return true if a file exists and false if it does not.
	*
	* @param f // String - root-relative file path to check
	* @return Boolean // true or false
	*/
	fileExists( f ){
		const p = "/" + f.split("/").filter(a => a).join("/"); // filename
		const resp = this.getJson(this.apihost + "/files/list", {site: this.site, path: p});
		for( let file of resp.entries )
			if(file.staging_path == f) 
				return true;
		return false;
	}
	
	/**
	* Return file information about an existing file or an exception with a JSON error if file does not exist.
	*
	* @param file // String - root-relative path to check
	* @return JSON object // either the file info or an exception containing the error.
	*/
	file_info ( file ) {
		this.request("GET", this.apihost + '/files/info', {	site : this.site, path : file }).then( resp => { 
			console.log(JSON.parse(resp)); 
		});
	}
	
	/**
	* URL encode a JSON object
	*/
	encode(obj) {
		return typeof obj == 'string' ? obj : Object.keys(obj).map( k => { return encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]) } ).join('&');
	}
	
	extend(obj, src) {
		for (let key in src) {
			if (src.hasOwnProperty(key)) obj[key] = src[key];
		}
		return obj;
	}
	
	merge (o1, o2){
		Array.prototype.push.apply(o1, o2);
		return o1;
	}
	
	/**
	* Parse a full URL and return the parts as a JSON object
	*/
	parse_url ( url ){
		var a = url.split("/").filter(b => b),
			p = a.shift(),
			h = a.shift(),
			t = a.join("/").split("?");

		return {
			protocol : p, host : h, port : h.split(":")[1] || null, path : t[0],
			query : t[1] ? t[1].split("#")[0] : null,
			hash : (t[1] ? t[1].split("#")[1] : null) || null
		};
	}
	
	/**
	* Parse a root-relative URL and return as string with beginning slash
	*/
	parse_path( d ){
		return "/" + d.split("/").filter( a => a ).join("/");
	}
	
	/**
	* Execute more than one Ajax request at a time and return the requests in an Array
	*/
	when(){
		return arguments.length ? Promise.all(arguments) : false;
	}
	
	request(type, url, data = "", response_type="json", async=true) {
		var send_data = "";
		
		if(type == "POST")
			send_data = this.encode(data);
		else
			url += (data) ? "?" + this.encode(data) : "";
		
		return new Promise((resolve, reject) => {
			let xhr = new XMLHttpRequest();
			xhr.responseType = response_type;
			xhr.open(type, url, async);
				
			//if(type == "POST")
			xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
			
			if (data.headers){
				Object.keys(data.headers).forEach(key => {
					xhr.setRequestHeader(key, data.headers[key]);
				});
				xhr.withCredentials = true;
			}
			
			xhr.onload = () => {
				if (xhr.status >= 200 && xhr.status < 300)
					resolve(xhr.response);
				else
					reject(xhr.statusText);
			};
			xhr.onerror = () => reject(xhr.statusText);
			xhr.send(send_data);
		});
	}
	
	requestSync(type, url, data = "", response_type="text", async=false) {
		var send_data = "";
		
		if(type == "POST")
			send_data = this.encode(data);
		else
			url += data ? "?" + this.encode(data) : "";
		
		let xhr = new XMLHttpRequest();
		xhr.open(type, url, async);
		xhr.responseType
		if (data.headers)
			Object.keys(data.headers).forEach(key => {
				xhr.setRequestHeader(key, data.headers[key]);
			});
		if(type == "POST"){
			xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
			xhr.setRequestHeader("Accept", "application/json, text/javascript, */*; q=0.01");
		}
		xhr.send(send_data);
		return (xhr.status === 200) ? JSON.parse(xhr.responseText) : { "error" : xhr.statusText };
	}
	
	include(filename){ 
		const xhr = new XMLHttpRequest();
		xhr.open("GET", filename, false);  // false makes this a Synchronous request
		xhr.send(null);
		return (xhr.status === 200) ? xhr.responseText : xhr.statusText;
	}
	
	/**
	* Does a get request and returns the response as a JSON object
	*/
	getJson(url, data=""){
		url += (data) ? "?" + this.encode(data) : "";
		const xhr = new XMLHttpRequest();
		//xhr.responseType = 'json';
		xhr.overrideMimeType("application/json");
		xhr.open("GET", url, false); // false makes this a Synchronous request
		xhr.send(null);
		return (xhr.status === 200) ? JSON.parse(xhr.responseText) : {};
	}
	
	
	postJson(url, data=""){
		if(data) send_data = this.encode(data);
		
		let xhr = new XMLHttpRequest();
		xhr.responseType = 'json';
		xhr.overrideMimeType("application/json");
		xhr.open(type, url, false); // false makes this a Synchronous request
		if (data.headers)
			Object.keys(data.headers).forEach(key => { xhr.setRequestHeader(key, data.headers[key]) });

		xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
		xhr.setRequestHeader("Accept", "application/json, text/javascript, */*; q=0.01");
		
		xhr.onload  = () => { return xhr.status === 200 ? xhr.responseText : xhr.statusText };
		xhr.onerror = () => { return xhr.statusText };
		xhr.send(send_data);
	}
	
	// Changes XML to JSON
	// Modified version from here: http://davidwalsh.name/convert-xml-json
	xml2json( xml ) {
		// Create the return object
		let obj = {};

		if (xml.nodeType === 1) { // element
			// do attributes
			if (xml.attributes.length > 0) {
				obj['@attributes'] = {};
				for (let j = 0; j < xml.attributes.length; j += 1) {
					const attribute = xml.attributes.item(j);
					obj['@attributes'][attribute.nodeName] = attribute.nodeValue;
				}
			}
		} else if (xml.nodeType === 3) { // text
			obj = xml.nodeValue;
		}

		// do children
		// If just one text node inside
		if (xml.hasChildNodes() && xml.childNodes.length === 1 && xml.childNodes[0].nodeType === 3) {
			obj = xml.childNodes[0].nodeValue;
		} else if (xml.hasChildNodes()) {
			for (let i = 0; i < xml.childNodes.length; i += 1) {
				const item = xml.childNodes.item(i);
				const nodeName = item.nodeName;
				if (typeof (obj[nodeName]) === 'undefined') {
					obj[nodeName] = this.xml2json(item);
				} else {
					if (typeof (obj[nodeName].push) === 'undefined') {
						const old = obj[nodeName];
						obj[nodeName] = [];
						obj[nodeName].push(old);
					}
					obj[nodeName].push(this.xml2json(item));
				}
			}
		}
		return obj;
	}
};

var ouc = new OUC({ protocol : location.protocol,  version : location.pathname.replace(/\//gi, ''), skin : location.hash.split("/")[0], account : location.hash.split("/")[1], site: location.hash.split("/")[2] });
console.log("ouc ready:\nouc=", ouc);
