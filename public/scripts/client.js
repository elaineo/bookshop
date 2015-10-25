//filter by client

var REST_DATA = 'api/favorites';
var KEY_DATA = 'api/keys';
var KEY_ENTER = 13;
var defaultItems = [
    
];

function loadItems(data_url, isHome){
    xhrGet(data_url, function(data){
        
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
            addItem(items[i], isHome, !hasItems);
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

function addItem(item, isHome){

    var row = document.createElement('article');
    row.setAttribute('data-id', item.id);

    var innerHTML = "<section class='head'" 
    if (!isHome){
        innerHTML += " onclick='acceptItem(this)' "
    }
    innerHTML += "><h3>"+item.name+"</h3>";
    innerHTML += "<div class='date'> " + item.value + " - " + item.price + " bits </div>"
    innerHTML += "</section></article>"; 
    row.innerHTML = innerHTML;

    var table = document.getElementById('notes');
    table.lastChild.parentNode.appendChild(row);
    
}

function acceptItem(acceptBtnNode){
    var row = acceptBtnNode.parentNode;
    if(row.getAttribute('data-id'))
    {
        var data = {
            key: "036203ca827668edbadf381bc496a5194962170e0437254c156de528c9f46cf8d9",
            id: row.getAttribute('data-id')
        };          
        xhrPut(KEY_DATA, data, function(stuff){
            console.log(stuff);
            window.location='/bet/' + stuff._id;
            //acceptBtnNode.parentNode.remove();
        }, function(err){
            console.error(err);
        });
    }   
}