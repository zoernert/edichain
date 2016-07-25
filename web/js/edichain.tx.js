$.jsonRPC.setup({
  endPoint: 'http://'+window.location.hostname+':8000/',
  namespace: 'edichain'
});

edichain = {};
edichain.client = {};
edichain.client.msgcount = -1;
edichain.client.sentcount = -1;

edichain.client.checkBalance = function() {
	$.jsonRPC.request('getBalance',{
	   params:[],   
	  success: function(result) {
		if(result.result<314625637462307939) {
			$('#balancealert').show();
		}		 
	  },
	  error: function(result) {
		console.log("ERROR",result);
	  }
	});

}

edichain.client.ediModal=function(num) {	
	$.jsonRPC.request('getMessageByNumber',{
			params:[num],
			success:function(result) { 	
					console.log(result);
					if(!result.result.content) {
						setTimeout(edichain.client.ediModal(num),2000);
					} else {
						$('#ediPRE').text(result.result.content.edi);
					}
			
			},
			error:function(result) {}
	});
};
edichain.client.ackModal=function(num) {
	$.jsonRPC.request('getSentByNumber',{
			params:[num],
			success:function(result) { 						
					if(!result.result.aperak) {
						setTimeout(edichain.client.ackModal(num),2000);
					} else {
						$('#ediPRE').text(result.result.aperak);
					}
			
			},
			error:function(result) {}
	});
}


$('#sendAperak').on('click',function() {
	$('#actaperk'+$('#aperakModal').attr('data-num')).attr('disabled',true);

	$.jsonRPC.request('ackMessageByAddr',{
	   params:[$('#aperakModal').attr('data-address'),$('#txtAPERAK').val()],   
	  success: function(result) {
		 		 
	  },
	  error: function(result) {
		console.log("ERROR",result);
	  }
	});
});
$('#sendEdi').on('click',function()  {
	var params = [];
	params.push($('#txtNEDI').val());
	if($('#recipientEDI').val().trim().length>10) {
		params.push($('#recipientEDI').val().trim());
	}
	$.jsonRPC.request('sendEdi',{
	  params:params,   
	  success: function(result) {
		 		 
	  },
	  error: function(result) {
		console.log("ERROR",result);
	  }
	});
});

$.jsonRPC.request('chainAccount',{
	   params:[],   
	  success: function(result) {
		 $('#nbAcctDD').text(result.result.substr(0,10)+"...");
		 $('#nbAcctDD').attr('title',result.result);
		$('#chargelink').attr("href","https://microdao.stromhaltig.de/edichain/?act="+result.result);
	  },
	  error: function(result) {
		console.log("ERROR",result);
	  }
});
$('#btnNewEDI').on('click',function() {
	$('#txtNEDI').val('');
	$('#nediModal').modal('show');	
});

var viewTx = function(tx) {
	if($('#txid').html()!=tx) {
		$('.txv').html("");
		$('#txid').html("is loading...");
	}
	$('.txview').show();
	
	$.jsonRPC.request('getTx',{					   
					   params:[tx],   
					   success: function(result) {
					   console.log(result);
						if(result.result.addr) $('#txid').html(result.result.addr);
						if(result.result.msg.from) $('#txfrom').html(result.result.msg.from);
						if(result.result.msg.to) $('#txto').html(result.result.msg.to);
						if(result.result.msg.timestamp_msg) $('#txtimemsg').html(new Date(result.result.msg.timestamp_msg*1000).toLocaleString());
						if(result.result.msg.timestamp_ack>0) $('#txtimeack').html(new Date(result.result.msg.timestamp_ack*1000).toLocaleString());
						if(result.result.mutable) $('#txmute').html("<span style='color:red'>true</span>"); else $('#txmute').html("false");
						if(result.result.msg.content) if(result.result.msg.content.edi) $('#txedi').html("<pre>"+result.result.msg.content.edi+"</pre>");
						if(result.result.msg.aperak) $('#txaperak').html("<pre>"+result.result.msg.aperak+"</pre>");
						if(result.result.mutable) {
								setTimeout(function() {
										if($('#txid').html()==tx) {
											viewTx(tx);	
										}										
								},5000);
						}
					   }
					  });

}
var getMsgs = function() {
		$.jsonRPC.request('getMesssageAddrs',{					   
					   params:[],   
					   success: function(result) {	
							var html="<ul>";
							for(var i=result.result.length-1;i>-1;i--) {
								html+="<li><a href='#' class='viewTx' data='"+result.result[i]+"'>"+result.result[i]+"</a></li>";
							}
							html+="</ul>";
							$('.msgrx').html(html);
							//sconsole.log(result);
							$('.viewTx').on('click',function(e) {
								viewTx($(e.toElement).attr('data'));
							});
					   }
			});
		$.jsonRPC.request('getSentAddrs',{					   
					   params:[],   
					   success: function(result) {	
							var html="<ul>";
							for(var i=result.result.length-1;i>-1;i--) {
								html+="<li><a href='#' class='viewTx' data='"+result.result[i]+"'>"+result.result[i]+"</a></li>";
							}
							html+="</ul>";
							$('.msgsent').html(html);
							$('.viewTx').on('click',function(e) {
								viewTx($(e.toElement).attr('data'));
							});
					   }
			});
}
getMsgs();
setInterval(function() {getMsgs();},15000);