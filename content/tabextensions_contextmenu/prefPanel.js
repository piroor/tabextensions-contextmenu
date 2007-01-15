var TSContextMenuPrefService = { 

	service            : TabbrowserService,
	contextMenuService : TabbrowserServiceContextMenu,

	mDraggedItem         : null,
	mCurrentDragOverItem : null,

	DROP_BEFORE : -1,
	DROP_AFTER  : 1,

	items : {},
	
	get listBox() 
	{
		return document.getElementById('contextMenuList');
	},
	get textBox()
	{
		return document.getElementById('contextMenuOrder');
	},
 
	init : function() 
	{
		this.initItemInfo();
		this.makeList();
	},
	
	initItemInfo : function() 
	{
		var original = this.service.getPref(this.contextMenuService.kPREF_ORIGINAL).split('|');
		var label    = this.service.getPref(this.contextMenuService.kPREF_LABEL).split('|');

		this.items = {};
		for (i = 0; i < original.length; i++)
			this.items[original[i]] = {
				label : label[i],
				index : i
			};
	},
  
	reset : function() 
	{
		var range = document.createRange();
		range.selectNodeContents(this.listBox);
		range.deleteContents();
		range.detach();

		if (this.service.browserWindow) {
			this.service.browserWindow.TabbrowserServiceContextMenu.initOrderInfo();
			this.initItemInfo();
		}

		this.textBox.value = this.service.getPref(this.contextMenuService.kPREF_ORIGINAL);
		this.makeList();
	},
 
	moveListItemTo : function(aNode, aIndex) 
	{
		if (!aNode) aNode = this.listBox.selectedItem;
		if (!aNode || aNode.localName != 'listitem') return;

		aIndex = Math.min(Math.max(aIndex, 0), this.listBox.childNodes.length-1);

		var current = this.listBox.getIndexOfItem(aNode);
		if (aIndex == current) return;


		var label = aNode.label;
		var value = aNode.value;

		this.listBox.removeItemAt(current);
		this.listBox.insertItemAt(aIndex, label, value);

		var items = this.listBox.childNodes;
		var ids   = [];
		for (var i = 0; i < items.length; i++)
			ids.push(items[i].value);

		this.textBox.value = ids.join('|');

		this.listBox.selectedIndex = aIndex;
		this.listBox.ensureIndexIsVisible(aIndex);
	},
 
	makeList : function() 
	{
		var order = this.textBox.value;
		if (!order) return;

		order = order.split('|');

		var item;
		for (var i in order)
			this.listBox.appendItem(
				(unescape(this.items[order[i]].label) || '----------'),
				order[i]
			);
	},
 
	// €–Ú‚ÌD&D 
	
	onDragStart : function(aEvent, aTransferData, aDragAction) 
	{
		// in scrollbars
		if (aEvent.originalTarget.localName &&
			aEvent.originalTarget.localName.match(/^(scrollbar(button)?|slider|thumb)$/)) return;

		var item = this.listBox.selectedItem;
		if (!('dragid' in item))
			item.dragId = 'listitem/'+Math.floor(Math.random() * 10000);

		aTransferData.data = new TransferData();
		aTransferData.data.addDataForFlavour(
			'tabextensions/listitem',
			item.dragId
		);

		this.mDraggedItem = item;
	},
 
	onDrop : function(aEvent, aTransferData, aSession) 
	{
		if (aTransferData.flavour.contentType != 'tabextensions/listitem') return;

		// in scrollbars
		if (aEvent.originalTarget.localName &&
			aEvent.originalTarget.localName.match(/^(scrollbar(button)?|slider|thumb)$/)) return;

		var toItem   = aEvent.target,
			fromItem = this.mDraggedItem,
			dragId   = aTransferData.data,
			order    = this.listBox.getIndexOfItem(fromItem);

		// from another window
		if (fromItem.dragId != dragId) return;


		// get the dropped position
		var pos = this.getDropPosition(aEvent);

		var toIndex = this.listBox.getIndexOfItem(toItem);

		if (toIndex > order)
			toIndex += (pos < 0 ? -1 : 0 );
		else if (toIndex < order)
			toIndex += (pos > 0 ? 1 : 0 );

		if (toIndex >= 0 && toIndex < this.listBox.childNodes.length)
			this.moveListItemTo(fromItem, toIndex);

		this.mDraggedItem = null;
	},
 
	onDragOver : function(aEvent, aFlavour, aSession) 
	{
		var XferDataSet = nsTransferable.get(
				this.getSupportedFlavours(),
				nsDragAndDrop.getDragData,
				true
			);
		var XferData = XferDataSet.first.first;
		if (XferData.flavour.contentType != 'tabextensions/listitem') return;



		// auto scroll
		var list    = this.listBox;
		var visible = list.getNumberOfVisibleRows(),
			total   = list.getRowCount();
		if (visible < total) {
			var wait = 800,
				box  = list.listBoxObject;

			var clientPos = aEvent.screenY,
				minPos    = box.screenY
				maxPos    = box.screenY+box.height,
				first     = box.getIndexOfFirstVisibleRow();

			if (clientPos > minPos && clientPos < minPos+20) {
/*
				if (clientPos < 10)
					wait = 100;
				else if (clientPos < 25)
					wait = 400;
*/

//				window.setTimeout(
//					function()
//					{
//						dump('scroll to '+Math.max(first-1, 0)+'\n');
						list.scrollToIndex(Math.max(first-1, 0));
//					},
//					wait
//				);
			}
			else if (clientPos > maxPos-20 && clientPos < maxPos) {
/*
				if (clientPos > maxPos-10)
					wait = 100;
				else if (clientPos > maxPos-25)
					wait = 400;
*/

//				window.setTimeout(
//					function()
//					{
//						dump('scroll to '+Math.min(first+visible+1, total)+'\n');
						list.scrollToIndex(Math.min(first+1, total));
//					},
//					wait
//				);
			}
		}



		this.mCurrentDragOverItem = (aEvent.target.localName == 'listitem') ? aEvent.target : null ;
		if (!this.mCurrentDragOverItem) {
			if (aEvent.target != this.listBox)
				aEvent.target.setAttribute('dragover-at', 'on');
			return;
		}

		var item = this.mCurrentDragOverItem;

		if (this.mDraggedItem == aEvent.target) {
			item.removeAttribute('dragover-at');
			return;
		}

		var pos = this.getDropPosition(aEvent);
		if (pos == this.DROP_BEFORE) {
			item.setAttribute('dragover-at', 'before');
		}
		else { //if (pos == this.DROP_AFTER) {
			item.setAttribute('dragover-at', 'after');
		}
	},
 
	onDragExit : function(aEvent, aSession) 
	{
		aEvent.target.removeAttribute('dragover-at');
	},
 
	getSupportedFlavours : function () 
	{
		var flavours = new FlavourSet();
		flavours.appendFlavour('tabextensions/listitem');
		return flavours;
	},
 
	getDropPosition : function(aEvent) 
	{
		var box = aEvent.target.boxObject;
		var measure          = (box.height / 2),
			coordValue       = box.y,
			clientCoordValue = aEvent.clientY;

		if (clientCoordValue < (coordValue + measure))
			return this.DROP_BEFORE;
		else
			return this.DROP_AFTER;
	}
  
}; 
  
