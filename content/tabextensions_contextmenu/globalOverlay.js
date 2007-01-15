var TabbrowserServiceContextMenu = { 
	
	activated : false,

	kPREF_ORDER    : 'browser.tabs.extensions.contextmenu.order',
	kPREF_ORIGINAL : 'browser.tabs.extensions.contextmenu.original',
	kPREF_LABEL    : 'browser.tabs.extensions.contextmenu.label',
 
	get service() 
	{
		return window.TabbrowserService;
	},
 
	init : function() 
	{
		if (!this.service) {
			this.activated = true;
			return;
		}

		if (!this.service.activated || !this.service.initialized) {
			window.setTimeout('TabbrowserServiceContextMenu.init();', 10);
			return;
		}

		if (this.activated) return;
		this.activated = true;

		if (this.service.browser) {
			var ids = this.service.getPref(this.kPREF_ORDER);
			if (
				!this.service.getPref(this.kPREF_ORIGINAL) ||
				!this.service.getPref(this.kPREF_LABEL) ||
				!ids ||
				ids.split('|').length != this.service.browser.mTabContainer.previousSibling.childNodes.length
				)
				this.initOrderInfo();

			var b = this.service.browsers;
			if (b) {
				for (var i = 0; i < b.length; b++)
				{
					this.initContextMenu(b[i]);
					b[i].showHideTabPopupMenuItems = this.showHideTabPopupMenuItems;
					if ('showHideMenuSeparator' in b[i])
						b[i].showHideMenuSeparator = this.showHideMenuSeparator;
				}
			}

			this.service.addPrefListener(gTSContextMenuOrderPrefListener);
		}
	},
	
	showHideTabPopupMenuItems : function(aPopup, aUsePrefs) 
	{
		var i;
		var items;

		var browser = aPopup.parentNode;
		while (browser.parentNode && browser.localName != 'tabbrowser')
			browser = browser.parentNode;

		var TSCM  = TabbrowserServiceContextMenu;
		var ids = TSCM.service.getPref(TSCM.kPREF_ORDER);
		if (browser && browser.localName == 'tabbrowser' &&
			ids != TSCM.service.getPref(TSCM.kPREF_ORIGINAL)) {
			ids = ids.split('|');
			items = [];
			for (i = 0; i < ids.length; i++)
				items.push(aPopup.getElementsByAttribute('tabid', ids[i])[0]);
		}
		else
			items = aPopup.childNodes;

		aPopup.rearrangedMenuItems = items;


		var id,
			name,
			shown;
		for (i = 0; i < items.length; i++)
		{
			id   = items[i].getAttribute('tabid');
			if (id.indexOf('-') < 0 ||
				id.split('-')[1] != 'item') continue;

			name  = id.split('-')[2];
			shown = true;
			try {
				if (aUsePrefs)
					shown = this.mPrefs.getBoolPref('browser.tabs.extensions.show_item.'+name);
			}
			catch(e) {
			}
			if (shown && items[i].getAttribute('menuitem-hidden') != 'true')
				items[i].removeAttribute('hidden');
			else
				items[i].setAttribute('hidden', true);
		}

		if (!('showHideMenuSeparator' in this))
			TSCM.showHideMenuSeparator(aPopup);
	},
	showHideMenuSeparator : function(aPopup)
	{
		var nodes       = aPopup.rearrangedMenuItems;
		var lastVisible = null;
		for (var i = 0; i < nodes.length; i++)
		{
			if (
				nodes[i].localName == 'menuseparator' &&
				(!lastVisible || lastVisible.localName == 'menuseparator')
				)
				nodes[i].setAttribute('hidden', true);
			else if (nodes[i].localName == 'menuseparator')
				nodes[i].removeAttribute('hidden');

			if (nodes[i].getAttribute('hidden') != 'true')
				lastVisible = nodes[i];
		}

		if (lastVisible && lastVisible.localName == 'menuseparator')
			lastVisible.setAttribute('hidden', true);
	},
  
	destruct : function() 
	{
		if (!this.activated) return;
		this.activated = false;
		this.service.removePrefListener(gTSContextMenuOrderPrefListener);
	},
 
	initOrderInfo : function() 
	{
		var mpopup = this.service.browser.mTabContainer.previousSibling;
		var items  = mpopup.childNodes,
			ids    = [],
			labels = [];

		for (var i = 0; i < items.length; i++)
		{
			ids.push(items[i].getAttribute('tabid'));
			labels.push(escape(items[i].getAttribute('label')));
		}

		this.service.setPref(this.kPREF_ORIGINAL, ids.join('|'));
		this.service.setPref(this.kPREF_LABEL, labels.join('|'));

		if (!this.service.getPref(this.kPREF_ORDER))
			this.service.setPref(this.kPREF_ORDER, ids.join('|'));
	},
 
	initContextMenu : function(aBrowser) 
	{
		if (!('mTabContainer' in aBrowser) || !aBrowser.mTabContainer)
			return;

		var mpopup = aBrowser.mTabContainer.previousSibling;
		var ids    = this.service.getPref(this.kPREF_ORDER).split('|');

		var nodes;
		for (var i in ids)
		{
			nodes = mpopup.getElementsByAttribute('tabid', ids[i]);
			if (nodes.length && nodes[0])
				nodes[0].setAttribute('ordinal', i);
		}
	}
  
}; 
 
var gTSContextMenuOrderPrefListener = 
{
	domain  : TabbrowserServiceContextMenu.kPREF_ORDER,
	observe : function(aSubject, aTopic, aPrefName)
	{
		if (aTopic != 'nsPref:changed') return;

		var TSCM = TabbrowserServiceContextMenu;
		var b = TSCM.service.browsers;
		for (var i = 0; i < b.length; i++)
			TSCM.initContextMenu(b[i]);
	}
};
 
window.addEventListener('unload', function() 
{
	if (!TabbrowserServiceContextMenu.activated) return;

	TabbrowserServiceContextMenu.destruct();
},
false);
window.addEventListener('unload', function()
{
	if (!TabbrowserServiceContextMenu.activated) return;

	TabbrowserServiceContextMenu.destruct();
},
false);
window.addEventListener('load', function()
{
	if (TabbrowserServiceContextMenu.activated) return;

	TabbrowserServiceContextMenu.init();
},
false);
window.addEventListener('load', function()
{
	if (TabbrowserServiceContextMenu.activated) return;

	TabbrowserServiceContextMenu.init();
},
false);
 
