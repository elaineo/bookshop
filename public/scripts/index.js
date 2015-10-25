// index.js

var REST_DATA = 'api/favorites';
var KEY_DATA = 'api/keys';
var KEY_ENTER = 13;
var defaultItems = [
	
];

function loadItems(){
	xhrGet(REST_DATA, function(data){
		
		//stop showing loading message
		stopLoadingMessage();
		
		var receivedItems = data || [];
		var items = [];
		var i;
		// Make sure the received items have correct format
		for(i = 0; i < receivedItems.length; ++i){
			var item = receivedItems[i];
			if(item && 'id' in item){
				items.push(item);
			}
		}
		var hasItems = items.length;
		if(!hasItems){
			items = defaultItems;
		}
		for(i = 0; i < items.length; ++i){
			addItem(items[i], !hasItems);
		}
		if(!hasItems){
			var table = document.getElementById('notes');
			var nodes = [];
			for(i = 0; i < table.rows.length; ++i){
				nodes.push(table.rows[i].firstChild.firstChild);
			}
			function save(){
				if(nodes.length){
					saveChange(nodes.shift(), save);
				}
			}
			save();
		}
	}, function(err){
		console.error(err);
	});
}


function addNewRow(table)
{
	var newRow = document.createElement('tr');
	table.appendChild(newRow);
	return table.lastChild;
}

function setRowContent(item, row)
{
		var innerHTML = "<td class='content'><textarea id='nameText' onkeydown='onKey(event)'>"+item.name+"</textarea></td>";	
		
		var valueTextArea = "<td class='contentPrice'><textarea id='valText' onkeydown='onKey(event)' placeholder=\"Enter a description...\">" + item.value +"</textarea></td>";		
		var priceTextArea = "<input id='priceText' type='number' min='1' step='1' onkeydown='onKey(event)' placeholder=\"100\">";		

		innerHTML+=valueTextArea;
		//innerHTML+="<td class='contentVal'>"+item.value+"</td>";
		if (item.price) 
			innerHTML+="<td class='contentPrice'>"+item.price+"</td>";
		else
			innerHTML+="<td class='contentPrice'>"+priceTextArea+"</td>";
		
		row.innerHTML = innerHTML+"<td class = 'contentAction'><span class='acceptBtn' onclick='acceptItem(this)' title='accept'></span><span class='deleteBtn' onclick='deleteItem(this)' title='delete me'></span><span class='infoBtn' onclick='infoItem(this)'></span></td>";
	
}
function setRowInfo(item, row)
{
		var innerHTML = "<td colspan='3'>Created by: " + item.pubkey0 + "<br>";
		innerHTML += "Accepted By: " + item.pubkey1 + "<br>";
		innerHTML += "Watson's Public Key: " + item.watsonpubkey + "<br>";
		innerHTML += "Watson's Secret Stuff: " + item.watsonprivkey + " <br>" + item.watsonaddress +"<br>"; 
		innerHTML += "Escrow Address: "+ item.escrow + "</td>";	
		
		row.innerHTML = innerHTML;
	
}

function addItem(item, isNew){
	
	var row = document.createElement('tr');
	row.className = "tableRows";
	var id = item && item.id;
	if(id){
		row.setAttribute('data-id', id);
	}
	
	if(item) // if not a new row
	{
		setRowContent(item, row);
		// hidden info
		var infoRow = document.createElement('tr');
		infoRow.className = "infoRows";
		infoRow.setAttribute('data-id', id);
		infoRow.style.display = 'none';
		setRowInfo(item, infoRow);
	}
	else //if new row
	{
		row.innerHTML = "<td class='content'><textarea id='nameText' onkeydown='onKey(event)' placeholder=\"Describe the wager...\"></textarea></td><td class='contentVal'><textarea id='valText'  onkeydown='onKey(event)' placeholder=\"Expiration date...\"></textarea></td><td class='contentPrice'><input id='priceText' type='number' min='1' step='1' onkeydown='onKey(event)' placeholder=\"100\"></td>" +
		    "<td class = 'contentAction'><span class='acceptBtn' onclick='acceptItem(this)' title='accept'></span><span class='deleteBtn' onclick='deleteItem(this)' title='delete me'></span></td>";
	}

	var table = document.getElementById('notes');
	table.lastChild.appendChild(row);
	row.isNew = !item || isNew;
	
	if(row.isNew)
	{
		var textarea = row.firstChild.firstChild;
		textarea.focus();
	} else {
		table.lastChild.appendChild(infoRow);
	}
	
}

function deleteItem(deleteBtnNode){
	var row = deleteBtnNode.parentNode.parentNode;
	if(row.getAttribute('data-id'))
	{
		xhrDelete(REST_DATA + '?id=' + row.getAttribute('data-id'), function(){
			row.remove();
		}, function(err){
			console.error(err);
		});
	}	
}

function infoItem(infoNode){
	var row = infoNode.parentNode.parentNode.nextSibling;
	row.style.display = (row.style.display != 'none' ? 'none' : '' );
}

function acceptItem(acceptBtnNode){
	var row = acceptBtnNode.parentNode.parentNode;
	if(row.getAttribute('data-id'))
	{
		var newRow = document.createElement('tr');
		newRow.className = "pubKeyRow";
		pubKeyHTML = "<tr><td class='content'><input id='pubKey' placeholder=\"Enter your public key\"><span class='acceptBtn' onclick='saveKey(this,\""+row.getAttribute('data-id')+"\")' title='accept'></span></td></tr>";
		newRow.innerHTML = pubKeyHTML;
		var table = document.getElementById('notes');
		row.parentNode.insertBefore(newRow, row.nextSibling);
	}	
}

function saveKey(evt, id) {
	var keyNode = evt.parentNode.firstChild;
	if(keyNode.id=="pubKey") {
		var data = {
			key: keyNode.value,
			id: id
		};			
		xhrPut(KEY_DATA, data, function(stuff){
			console.log('saved key');
			evt.parentNode.parentNode.remove();
		}, function(err){
			console.error(err);
		});
	}
}

function onKey(evt){
	
	if(evt.keyCode == KEY_ENTER && !evt.shiftKey){
		
		evt.stopPropagation();
		evt.preventDefault();
		var nameV, valueV, priceV;
		var row ; 		
		
		if(evt.target.id=="nameText")
		{
			row = evt.target.parentNode.parentNode;
			nameV = evt.target.value;
			valueV = evt.target.parentNode.nextSibling.firstChild.value;
			priceV = evt.target.parentNode.nextSibling.nextSibling.firstChild.value;
			
		}
		else if (evt.target.id=="valText")
		{
			row = evt.target.parentNode.parentNode;
			nameV = evt.target.parentNode.previousSibling.firstChild.value;
			valueV = evt.target.value;
			priceV = evt.target.parentNode.nextSibling.firstChild.value;
		}
		else if (evt.target.id=="priceText")
		{
			row = evt.target.parentNode.parentNode;
			nameV = evt.target.parentNode.previousSibling.previousSibling.firstChild.value;
			valueV = evt.target.parentNode.previousSibling.firstChild.value;
			priceV = evt.target.value;
		}
		// get public key
		var pubkey = document.getElementById('pubKey0').value;

		var data = {
				name: nameV,
				value: valueV,
				price: priceV,
				pubkey: pubkey
			};			
		
			if(row.isNew){
				delete row.isNew;
				xhrPost(REST_DATA, data, function(item){
					row.setAttribute('data-id', item.id);
				}, function(err){
					console.error(err);
				});
			}else{
				data.id = row.getAttribute('data-id');
				xhrPut(REST_DATA, data, function(){
					console.log('updated: ', data);
				}, function(err){
					console.error(err);
				});
			}
		
	
		if(row.nextSibling) {
		if(row.nextSibling.firstChild){
			row.nextSibling.firstChild.focus();
		}
		}else{
			addItem();
		}
	}
}

function saveChange(contentNode, callback){
	var row = contentNode.parentNode.parentNode;
	console.log(row);
	console.log('save');

	
	var data = {
		name: row.firstChild.firstChild.value,
		value:row.firstChild.nextSibling.firstChild.value,	
		price:row.firstChild.nextSibling.nextSibling.firstChild.value		
	};
	
	if(row.isNew){
		delete row.isNew;
		xhrPost(REST_DATA, data, function(item){
			row.setAttribute('data-id', item.id);
			callback && callback();
		}, function(err){
			console.error(err);
		});
	}else{
		data.id = row.getAttribute('data-id');
		xhrPut(REST_DATA, data, function(){
			console.log('updated: ', data);
		}, function(err){
			console.error(err);
		});
	}
}

function toggleServiceInfo(){
	var node = document.getElementById('vcapservices');
	node.style.display = node.style.display == 'none' ? '' : 'none';
}

function toggleAppInfo(){
	var node = document.getElementById('appinfo');
	node.style.display = node.style.display == 'none' ? '' : 'none';
}


function showLoadingMessage()
{
	document.getElementById('loadingImage').innerHTML = "Loading data "+"<img height=\"100\" width=\"100\" src=\"images/loading.gif\"></img>";
}
function stopLoadingMessage()
{
	document.getElementById('loadingImage').innerHTML = "";
}

showLoadingMessage();
//updateServiceInfo();
loadItems();


