/**
* Get Accounts managed under Omniupdate
**/
class OUC {
	constructor( p ){
		this.apihost = location.protocol + '//' + location.host;
		this.data = "";
		this.json = [];
		
		for( let ky in p ) 
			if( p.hasOwnProperty(ky) ) 
				this[ky] = p[ky];
				
		return this;
	}
	
	get (prop) {
		return this[prop];
	}
	
	set ( prop, val ){
		this[ prop ] = val;
		return this;
	}
	
	file_info ( file ) {
		this.request("GET", this.apihost + '/files/info', {	site : this.site, path : file }).then( resp => { 
			console.log(JSON.parse(resp)); 
		});
	}

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
	
	request(type, url, data = "") {
		var send_data = "";
		
		if(type == "POST")
			send_data = this.encode(data);
		else
			url += (data) ? "?" + this.encode(data) : "";
		
		return new Promise((resolve, reject) => {
			let xhr = new XMLHttpRequest();
			
			xhr.open(type, url);
			if (data.headers)
				Object.keys(data.headers).forEach(key => {
					xhr.setRequestHeader(key, data.headers[key]);
				});
				
			if(type == "POST"){
				xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
				xhr.setRequestHeader("Accept", "application/json, text/javascript, */*; q=0.01");
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
};

/**
* Get Accounts managed under Omniupdate
**/
class Admin extends OUC{
	constructor( p ){
		super(p);
		this.account = super.get("account");
		this.site = super.get("site");
		return this;
	}
	
	_add_site ( site, account ){
		this.request("GET", location.protocol + '//' + location.host + '/sites/view', {site: site.site, account: account.account}).then( site_info => {
			var info = JSON.parse(site_info);
			var obj = {
				site : info.name,
				address : info.address.substring(2),
				username : info.username,
				password : info.password
			};
			var str = "### Site : " + info.name + "\nURL : " + info.address.substring(2) + "\nUsername : " + info.username + "\nPassword : " + info.password + "\n";
			
			account.sites.push(info);
		}).catch(error => {
			console.log(error);
		});
	}
	
	_add_sites ( account ){
		this.request("GET", this.apihost + '/sites/list', { account : account.account } ).then( sites_data => {	
			if(!account.hidden){
				var sitedata = JSON.parse(sites_data);
				var str = "\n- Account : " + account.account + "\n  Institution : " + account.institution + "\n  Date Created : " + account.created_format + "\n  Sites: \n";
				
				account.sites = [];
				this.json.push(account);
				
				for(var site of sitedata)
					this._add_site ( site, account );
			}
		});
	}
	
	get pass(){
		return {
			gen : ( len = 16) => {
				var charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
				var special = "*!@.#";
				var retVal = "";

				for (var i = 0, n = charset.length; i < len; ++i)
					retVal += charset.charAt(Math.floor(Math.random() * n));
				retVal += special.charAt(Math.floor(Math.random() * special.length));
				
				this.data = retVal;
				console.log(retVal);		

				return retVal;
			},
			get : ( s = "" ) => {
				var site = (!s) ? this.site : s;
				this.request("GET", location.protocol + '//' + location.host + '/sites/view', {site: site, account: this.account}).then(data =>{ 
					var json = JSON.parse(data);
					this.data = json.password;
					console.log("Site : " + site + "\nPassword : " + json.password);
				}).catch(error => {
					console.log(error);
				});
			},

			/** Command Line change a site's password **/
			set : ( s , p ) => {
				this.request("POST", location.protocol + '//' + location.host + '/sites/save', { site : s, password : p } ).then(response => {
					this.data = response;
					console.log(response);
				}).catch(error => {
					console.log(error);
				});
			}	
		};
	}
	
	get info(){
		return {
			account : () => {
				var account = this.get("account");
				this.request("GET", this.apihost + '/accounts/view', { account : account }).then( data => {
					var json = JSON.parse(data);
					this.json = json;
					this.data = "## Account Info\n" + "- Name : " + json.name + "\n- Description : " + json.institution + "\n- CAS Login : " + json.sso_url + "\n";
				}).catch(error => {
					console.log(error);
				});	
			},
			accounts : () => {
				this.request("GET", this.apihost + '/accounts/list').then( account_data => {
					var accountdata = JSON.parse(account_data);
					for(var account of accountdata)
						this._add_sites ( account );
				}).catch(error => {
					console.log(error);
				});

			},
			ldp : ( s="", a="" ) => {
				var account = (!a) ? this.account : a;
				var site = (!s) ? this.site : s;
		
				this.request("GET", location.protocol + '//' + location.host + '/servlet/OX/ldpregfile', { user : account, site : site }).then(ldp => {
					this.data = ldp;
					console.log(ldp);
				}).catch(error => {
					console.log(error);
				});
			},
			site : () => {
				var site = this.get("site");
				var account = this.get("account");
				this.request("GET", location.protocol + '//' + location.host + '/sites/view', {site: site, account: account}).then(data => {
					var info = JSON.parse(data); 
					var obj = {
						site : info.name,
						address : info.address.substring(2),
						username : info.username,
						password : info.password
					};
					this.json = obj;
					this.data = "## Account " + account + " Information\n### Site : " + info.name + "\nURL : " + info.address.substring(2) + "\nUsername : " + info.username + "\nPassword : " + info.password + "\n";
					console.log(this.data, obj);
				}).catch(error => {
					console.log(error);
				});
			},
			sites : () => {
				var account = this.get("account");
				this.data = "";
				this.json = [];
				this.request("GET", this.apihost + '/sites/list', { account : account } ).then( data => {
					for (var site of JSON.parse(data))
						this.request("GET", this.apihost + '/sites/view', {site: site.site, account: this.account}).then( data2 => {
							var info = JSON.parse(data2);
							this.request("GET", this.apihost + '/servlet/OX/ldpregfile', { user : this.account, site : info.name }).then( ldp => {
								var obj = {
									site : info.name,
									address : info.address.substring(2),
									username : info.username,
									password : info.password,
									ldp : ldp
								};
								this.json.push(obj);
								this.data += "Site : " + info.name + "\nURL : " + info.address.substring(2) + "\nUsername : " + info.username + "\nPassword : " + info.password + "\nLDP : " + ldp + "\n";
							}).catch(error => {
								console.log(error);
							});
						});
				});
			}
		};
	}
	
	/** Command Line get LDP for a site **/
	get ldp (){
		var site = this.get("site");
		
		this.request("GET", location.protocol + '//' + location.host + '/servlet/OX/ldpregfile', { user : this.account, site : site }).then(ldp => {
			this.data = ldp;
			console.log(ldp);
		}).catch(error => {
			console.log(error);
		});
	}
	
	get printURLs(){
		var data = "Omniupdate Website URLS by Account\n----------------------------------\n";
		if(this.json.length){
			for(var account of this.json){
				data += account.account + " - " + account.institution + "\n";
				for(var site of account.sites){
					data += site.http_root + "\n";
				}
			}
			console.log(data);
		} else {
			console.log("Get account data first");
		}
	}
	
	get printURLsAsJSON(){
		var data = [];
		if(this.json.length){
			data.accounts = [];
			for(var i in this.json){
				data[i] = {};
				data[i].account = this.json[i].account;
				data[i].sites = [];
				for(var j in this.json[i].sites)
					data[i].sites.push({"http_root": this.json[i].sites[j].http_root});
				
			}
			console.log(data);
		} else {
			console.log("Get account data first");
		}
		return data;
	}
	
	print ( accounts ){
		var str = "# University of Georgia :: OmniUpdate Accounts";
		
		this.data = str;
		console.log(str);
		for(var i in accounts){
			str = "\n## Account : " + accounts[i].account + "\nDescription : " + accounts[i].institution + "\nDate Created : " + accounts[i].created_format + "\nSite Count : " + accounts[i].sites.length + "\n";
			this.data += str;
			console.log(str);
			for( var j in accounts[i].sites){
				str = "- Site : " + accounts[i].sites[j].name + "\n  IP : " + accounts[i].sites[j].address.substring(2) + "\n  Username : " + accounts[i].sites[j].username + "\n  Password : " + accounts[i].sites[j].password + "\n  URL : " + accounts[i].sites[j].http_root + "\n  Last Saved : " + accounts[i].sites[j].last_saved + "\n";
				this.data += str;
				console.log(str);
			}
		}
	}
};

class Snippets extends OUC{
	constructor( p ){
		super(p);
		this.account = super.get("account");
		this.site = super.get("site");
		this.categories = ["Bootstrap", "Table Transformations", "Images"];
		this.snippets = [
			{name : "Jumbotron", category : "Bootstrap", path : "/_resources/snippets/jumbotron.html"},
			{name : "3x3 Section Grid", category : "Table Transformations", path : "/_resources/snippets/section-link-table-3x3.html"},
			{name : "Accordion Menu", category : "Bootstrap", path : "/_resources/snippets/ouaccordion-table.html"},
			{name : "Arrow Tabs", category : "Table Transformations", path : "/_resources/snippets/arrow-tabs.html"},
			{name : "Image with Caption", category : "Images", path : "/_resources/snippets/caption-image.html"}
		];
		return this;
	}
	
	add_snippets () {
		var site = this.get("site");
		
		for (var s of this.snippets)
			this.request("POST", this.apihost + '/snippets/addsnippet', {
				site : site,
				name : s.name,
				category : s.category,
				path : s.path,
				description : "",
				snippet : s.name
			}).then( resp => {
				console.log(resp);
			}).catch(error => {
				console.log(error);
			});
	}
	
	/** 
	* Have to create Categories one at a time
	*/
	add_categories () {
		var site = this.get("site");
		
		for (var c of this.categories)
			this.request("POST", this.apihost + '/snippets/addcategory', { category : c, site : site }).then(resp => {
				console.log(resp);
			}).catch(error => {
				console.log(error);
			});
	};
};

class Assets extends OUC {
	constructor( p ){
		super(p);
		
		this.assets = [{ 
				name : "News - Homepage", 
				content : "<rss-feed feed=\"/_resources/rss/news.xml\" \n\tdescription=\"false\"\n\tdates=\"true\"\n\tdateFormat=\"D F j, Y\"\n\tlimit=\"10\"\n\tpagination=\"true\"/>",
				description : "",
				site: this.site,
				type : 1,				
				site_locked : true,
				group : "Everyone",
				readers : "Everyone",
				syntax: "php",
				theme: "default",
				"line-number": "",
				query: "",
				replaceText : "",
				isRegex : false,
				matchCase : false,
				tags : ""
			},
			{
				name : "Calendar",
				content : "<calendar feed=\"/_resources/rss/events.xml\" maxEvents=\"5\" eventNumberOfDays=\"12\" />",
				description : "",
				site: this.site,
				type : 1,				
				site_locked : true,
				group : "Everyone",
				readers : "Everyone",
				syntax: "php",
				theme: "default",
				"line-number": "",
				query: "",
				replaceText : "",
				isRegex : false,
				matchCase : false,
				tags : ""
			},
			{
				name : "Auto Publish Menus",
				content : "",
				type : "",
				description: "",
				site_locked:true,
				group : "Everyone",
				readers : "Everyone",
				site: this.site,
				type:0,
				tags: ""	
			},
			{
				name : "News",
				content : "<rss-feed \n\tfeed=\"/_resources/rss/news.xml\" \n\tdescription=\"true\"\n\tdates=\"true\"\n\tdateFormat=\"Y-m-d\"\n\tstyle=\"list-unstyled\"/>",
				description : "",
				site: this.site,
				type : 1,				
				site_locked : true,
				group : "Everyone",
				readers : "Everyone",
				syntax: "php",
				theme: "default",
				"line-number": "",
				query: "",
				replaceText : "",
				isRegex : false,
				matchCase : false,
				tags : ""
			}];
		return this;
	}
	
	add ( s = "") {
		if(s) this.set("site", s);
			
		for(var i in this.assets)
			this.request("POST", this.apihost + '/assets/new', this.assets[i]).then(resp => {
				console.log(resp);
			});
	}
};

class RSS extends OUC {
	constructor( p ){
		super(p);
		this.formats = {		
			default : {
				tcf_value_0 : "title", // title
				tcf_value_1 : "description", // description
				tcf_value_2 : "author", // author
				tcf_value_3 : "image/img", // image
				tcf_value_4 : "image/thm", // thumbnail
				tcf_value_5 : "link", // filename
				tcf_value_7 : "*inherit*", // access group	
			},
			demos : {
				tcf_value_0 : "title",
				tcf_value_1 : "description",
				tcf_value_2 : "author",
				tcf_value_3 : "image/img",
				tcf_value_4 : "image/thm",
				tcf_value_5 : "category",
				tcf_value_6 : "link",
				tcf_value_7 : "false",
				tcf_value_8 : "two-column",
				tcf_value_9 : "pretty",
				tcf_value_10 : "none",
				tcf_value_12 : "*inherit*"	
			}
		};
	}
	
	get usage(){
		return `
# RSS Class Usage:
## FUNCTIONS
- create(format="")
- add_feed()
- get_feed(feed, opts)
`;
	}
	create(format = ""){
		if(!format) format = this.formats.default;
		
		let a = document.createElement("a");
		for(let obj of this.json){
			// get relative-root file path from <link>
			a.setAttribute("href", obj.link);
			let items = Object.entries(format);
			let nparam = {
				site : this.site,
				path : a.pathname.substring(0, a.pathname.lastIndexOf("/")),
				template : format.template || "rss-article.tcf",
				submit : "Create"
			};
			for(let i = 0, lent = items.length; i < lent; i++){
				if(!typeof items[i][1] == "string") return "Argument values must only be strings";
				
				let alt = (items[i][1].indexOf("/") < 0) 
					? obj[items[i][1]] 
					: obj[ items[i][1].split("/")[0] ][ items[i][1].split("/")[1] ] || "";
				
				if( items[i][1] == "link" )
					alt = obj[items[i][1]].substring( obj[items[i][1]].lastIndexOf("/") + 1 ).replace(".html", "");
				
				if( items[i][1] == "category" ){
					let ar = Object.values(obj.category);
					alt = ar.join(", ");
				}

				nparam[items[i][0]] = alt;
			}
			
			this.request("POST", "/templates/new", nparam).then(response => {
				console.log(response);
			}).catch(error => {
				console.log(error);
			});

		}
	}
	
	add_feed(){
		return false;
	}
	
	get_feed( feed, opts = {}) {
		opts.feed = feed;
		if(!opts.sort) opts.sort = "asc";
		this.request("GET", "https://eits.uga.edu/_resources/admin/get_feed.php", opts).then( response => {
			this.json = JSON.parse(response);
		}).catch(error => {
			console.log(error);
		});
	}
	
	get_safe_html( url ){
		let opts = { url : url };
		this.request("GET", "https://eits.uga.edu/_resources/admin/get_safe_html.php", opts).then( response => {
			this.data = response;
		}).catch(error => {
			console.log(error);
		});
	}
}

class PCF extends OUC {
	constructor( p ){
		super(p);
		this.ouc = "http://omniupdate.com/XSL/Variables";
		this.ns_resolver = prefix => {
			let ns = {	'ouc' : this.ouc };
			return ns[prefix] || null;
		};
	}
	get usage(){
		return `
# PCF Class Usage
## FUNCTIONS:
- _escapeXML(s)
  an internal function for escaping HTML for XML usage.
- source ( path )
  Query OU site for the path and save its contents into the pcf.json variable.
  Run this function first to load the XML.
- getHTMLByDivLabel( divlabel )	
- getHTMLByXPath( tagname )
- insertHTMLByDivLabel( divlabel, html )
- _xmlToString( xml )
- save(path, text)
`;
	}
	_escapeXML(s){
		return s.replace(/\&([a-zA-z]+;)/gi, ( a, b ) => { return "&amp;" + b});
	}
	
	source ( path ){
		let fields = {
			site : this.site,
			path : path,
			brokentags : true
		}
		if(path.endsWith(".pcf")){
			this.request("GET", this.apihost + "/files/source", fields).then( response => {
				this.json = JSON.parse(response);
			}).catch(error => {
				console.log(error);
			});	
		} else {
			return "only PCF files. Sorry.";
		}	
	}
	
	getHTMLByDivLabel( divlabel ){
		// Get the DOM as specified by the divlabel (usually 'maincontent')
		let esc = this._escapeXML(this.json.source);
		let parser = new DOMParser();
		let xml = parser.parseFromString(esc, "application/xml");
		let xpath = document.evaluate("//ouc:div[@label='" + divlabel + "']", xml, this.ns_resolver, XPathResult.ANY_TYPE, null);
		let dom = xpath.iterateNext();
		// So we have the dom.  Now to return the HTML.
		return this._xmlToString(dom);
	}
	
	getHTMLByXPath( tagname ){
		// Get the DOM as specified by the divlabel (usually 'maincontent')
		let esc = this._escapeXML(this.json.source);
		let parser = new DOMParser();
		let xml = parser.parseFromString(esc, "application/xml");
		let xpath = document.evaluate("//" + tagname, xml, this.ns_resolver, XPathResult.ANY_TYPE, null);
		let dom = xpath.iterateNext();
		// So we have the dom.  Now to return the HTML.
		return this._xmlToString(dom);
	}
	
	insertHTMLByDivLabel( divlabel, html ){
		// Get the DOM as specified by the divlabel (usually 'maincontent')
		let esc = this._escapeXML(this.json.source);
		let parser = new DOMParser();
		let xml = parser.parseFromString(esc, "application/xml");
		let divs = xml.getElementsByTagNameNS(this.ouc, "div");
	}
	
	_xmlToString( xml ){
		let serializer = new XMLSerializer();
		return serializer.serializeToString(xml).replace("&amp;", "&");
	}
	
	save(path, text){
		let fields = {
			site : this.site,
			path : encodeURI(path),
			text : encodeURI(text)
		};
		
		this.request("POST", this.apihost + "/files/save", fields).then( response => {
			console.log(response);
		}).catch(error => {
			console.log(error);
		});
	}
}

class XSL extends OUC {
	constructor( p ){
		super(p);
		this.ouc = "http://omniupdate.com/XSL/Variables";
		this.ns_resolver = prefix => {
			let ns = {	'ouc' : this.ouc };
			return ns[prefix] || null;
		};
	}
	get usage(){
		return `
# XSL Class Usage
## FUNCTIONS:
`;
	}
	
	get_safe_html( url ){
		let opts = { url : url };
		this.request("GET", "https://eits.uga.edu/_resources/admin/get_safe_html.php", opts).then( response => {
			this.data = response;
		}).catch(error => {
			console.log(error);
		});
	}
	
	save( path ){
		const header = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE xsl:stylesheet>
<!-- comments go here -->
<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:ou="http://omniupdate.com/XSL/Variables" xmlns:fn="http://omniupdate.com/XSL/Functions" xmlns:ouc="http://omniupdate.com/XSL/Variables" exclude-result-prefixes="xsl xs ou fn ouc">

	<xsl:import href="_shared/template-matches.xsl"/>
	<xsl:import href="_shared/ouvariables.xsl"/>
	<xsl:import href="_shared/functions.xsl"/>
	<xsl:import href="_shared/tag-management.xsl"/>
	<xsl:import href="_shared/ouforms.xsl"/>
	<xsl:import href="_shared/breadcrumb.xsl"/>
	<xsl:import href="_shared/ougalleries.xsl"/>

	<!-- Default: for HTML5 use below output declaration -->
	<!-- <xsl:output method="html" version="5.0" indent="yes" encoding="UTF-8" include-content-type="no"/> -->
	<xsl:output method="html" indent="yes" encoding="UTF-8" include-content-type="no" />
	<xsl:strip-space elements="*"/>
	<xsl:template match="/document">
`;
const footer = `</xsl:template>
</xsl:stylesheet>
`;
		let fields = {
			site : this.site,
			path : encodeURI(path),
			text : encodeURI(text)
		};
		
		this.request("POST", this.apihost + "/files/save", fields).then( response => {
			console.log(response);
		}).catch(error => {
			console.log(error);
		});
	}
}

if (location.protocol == "https:"){
	var account = location.hash.split("/")[1], site = location.hash.split("/")[2], 
		init = (account != "#uga") ? {account : account, site: site } : null,
		ouc = new OUC(init),
		pcf = new PCF(init),
		admin = new Admin(init),
		snip = new Snippets(init),
		assets = new Assets(init),
		rss = new RSS(init);
	console.log("ouc ready:\nouc, admin, snip, assets, rss, pcf=", ouc, admin, snip, assets, rss, pcf);
} else console.log("Must be using HTTPS!");
