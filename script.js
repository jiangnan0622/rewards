// 系统变量
let currentPoints = 0;      // 积分/探索值
let totalSpend = 0;        // 总消费
let currentLayer = 0;      // 当前矿洞层数
const POINTS_PER_LAYER = 10; // 每10积分=1层
const LOTTERY_THRESHOLD = 200; // 抽奖门槛

// 奖励配置
const REWARD_LEVELS = [
    { 
        points: 100, 
        reward: '优惠券礼包', 
        description: '满100减10、满200减20等优惠券',
        image: 'coupon.jpg',
        layer: 10
    },
    { 
        points: 400, 
        reward: '摩洛哥盲石', 
        description: '中型摩洛哥盲石(8-10cm)',
        image: 'morocco.jpg',
        layer: 40
    },
    { 
        points: 800, 
        reward: '超大晶洞组合', 
        description: '摩洛哥+墨西哥晶洞套装',
        image: 'crystal-combo.jpg',
        layer: 80
    },
    { 
        points: 1200, 
        reward: '星露谷主题礼盒', 
        description: '限量版收藏珍品',
        image: 'stardew-box.jpg',
        layer: 120
    }
];

// 抽奖奖品配置
const LOTTERY_PRIZES = [
    { id: 1, name: '摩洛哥盲石(5-8cm)', probability: 5, image: 'A.png' },
    { id: 2, name: '能量疗愈原石(随机)', probability: 25, image: 'B.jpg' },
    { id: 3, name: '5$优惠券', probability: 70, image: 'C.png' }
];

// 矿层配置
const LAYERS = {
    soil: { start: 1, end: 39, name: '棕色地层' },
    ice: { start: 40, end: 79, name: '永冻冰层' },
    magma: { start: 80, end: 120, name: '岩浆暗域' }
};

// 获取DOM元素
const progressElement = document.getElementById("progress");
const currentLayerElement = document.getElementById("current-layer");

// 修改抽奖次数限制变量
let remainingDraws = 1; // 每天1次抽奖机会
const MAX_DRAWS_PER_DAY = 1;
let lastResetDate = new Date().toDateString();

// 重置抽奖次数函数
function resetDraws() {
    const today = new Date().toDateString();
    if (today !== lastResetDate) {
        remainingDraws = MAX_DRAWS_PER_DAY;
        lastResetDate = today;
        localStorage.setItem('lastResetDate', lastResetDate);
        localStorage.setItem('remainingDraws', remainingDraws);
    }
}

// 更新抽奖按钮状态
function updateLotteryButton() {
    const lotteryBtn = document.getElementById('openLottery');
    if (remainingDraws <= 0) {
        lotteryBtn.disabled = true;
        lotteryBtn.textContent = '今日已抽奖';
    } else {
        lotteryBtn.disabled = false;
        lotteryBtn.textContent = '立即抽奖';
    }
}

// 更新进度条
function updateProgress() {
  const progressWidth = (currentLayer / 120) * 100; // 假设总层数为120
  progressElement.style.width = `${progressWidth}%`;
  currentLayerElement.textContent = currentLayer;
}

// 更新系统状态
function updateSystem(amount) {
    // 更新消费金额和积分 (1:1)
    totalSpend += amount;
    currentPoints += amount;
    
    // 更新矿洞层数
    currentLayer = Math.floor(currentPoints / POINTS_PER_LAYER);
    
    // 更新显示
    updateProgressDisplay();
    updateLotteryProgress();
    updateMineMap();
    checkRewards();
    updateCartReminder();
}

// 更新矿洞地图显示
function updateMineMap() {
    const mineMap = document.getElementById('mine-map');
    if (!mineMap) return;

    // 更新当前层数显示
    const currentLayerDisplay = document.getElementById('current-layer');
    if (currentLayerDisplay) {
        currentLayerDisplay.textContent = currentLayer;
    }

    // 更新进度条
    const layerProgress = document.getElementById('layer-progress');
    if (layerProgress) {
        const nextReward = REWARD_LEVELS.find(level => level.layer > currentLayer);
        if (nextReward) {
            const progress = (currentLayer / nextReward.layer) * 100;
            layerProgress.style.width = `${progress}%`;
        }
    }

    // 更新区域状态
    updateZoneStatus();
}

// 更新区域状态
function updateZoneStatus() {
    const zones = {
        soil: { max: 39 },
        ice: { max: 79 },
        magma: { max: 120 }
    };

    Object.entries(zones).forEach(([zone, data]) => {
        const zoneElement = document.querySelector(`.zone-${zone}`);
        if (zoneElement) {
            if (currentLayer > data.max) {
                zoneElement.classList.add('completed');
            } else if (currentLayer >= data.max - 39) {
                zoneElement.classList.add('active');
            }
        }
    });
}

// 更新购物车提醒
function updateCartReminder() {
    const cartReminder = document.getElementById('cart-reminder');
    if (!cartReminder) return;

    const nextReward = REWARD_LEVELS.find(level => level.layer > currentLayer);
    if (nextReward) {
        const layersNeeded = nextReward.layer - currentLayer;
        const amountNeeded = layersNeeded * POINTS_PER_LAYER;
        cartReminder.innerHTML = `
            <div class="reminder-content">
                <p>再深入<span class="highlight">${layersNeeded}</span>层，即可获得：</p>
                <div class="next-reward">
                    <img src="images/${nextReward.image}" alt="${nextReward.reward}">
                    <p>${nextReward.reward}</p>
                </div>
                <p class="amount-needed">还需消费: $${amountNeeded}</p>
            </div>
        `;
    }
}

// 显示积分账户信息
function showPointsAccount() {
    const accountModal = document.createElement('div');
    accountModal.className = 'account-modal';
    accountModal.innerHTML = `
        <div class="account-content">
            <h2>我的矿洞探索</h2>
            <div class="points-info">
                <p class="current-points">当前积分：${currentPoints}</p>
                <p class="current-layer">当前层数：${currentLayer}</p>
            </div>
            <div class="rewards-list">
                <h3>可兑换奖励</h3>
                ${generateRewardsList()}
            </div>
            <button onclick="this.parentElement.parentElement.remove()">关闭</button>
        </div>
    `;
    document.body.appendChild(accountModal);
}

// 生成奖励列表
function generateRewardsList() {
    return REWARD_LEVELS.map(reward => `
        <div class="reward-item ${currentPoints >= reward.points ? 'available' : ''}">
            <img src="images/${reward.image}" alt="${reward.reward}">
            <div class="reward-info">
                <p class="reward-name">${reward.reward}</p>
                <p class="reward-desc">${reward.description}</p>
                <p class="points-required">需要积分：${reward.points}</p>
            </div>
            <button ${currentPoints >= reward.points ? '' : 'disabled'}>
                ${currentPoints >= reward.points ? '立即兑换' : '积分不足'}
            </button>
        </div>
    `).join('');
}

// 更新层数
function updateLayer(increment) {
    currentLayer = Math.min(currentLayer + increment, MAX_LAYER);
    const layerElement = document.getElementById('current-layer');
    if (layerElement) {
        layerElement.textContent = currentLayer;
    }
    
    // 检查并更新当前区域
    updateCurrentZone();
}

// 更新当前区域
function updateCurrentZone() {
    const zones = document.querySelectorAll('.layer-section');
    zones.forEach(zone => {
        zone.classList.remove('active');
    });
    
    let currentZone;
    if (currentLayer <= LAYERS.soil.end) {
        currentZone = 'soil';
    } else if (currentLayer <= LAYERS.ice.end) {
        currentZone = 'ice';
    } else {
        currentZone = 'magma';
    }
    
    document.querySelector(`.layer-section.${currentZone}`).classList.add('active');
}

// 更新积分显示
function updateProgressDisplay() {
    const progressElement = document.getElementById('progress');
    const currentPointsElement = document.getElementById('current-points');
    const pointsNeededElement = document.getElementById('points-needed');
    
    // 更新积分显示
    currentPointsElement.textContent = currentPoints;
    
    // 计算下一个奖励等级
    let nextReward = REWARD_LEVELS.find(level => level.points > currentPoints);
    if (!nextReward) {
        nextReward = REWARD_LEVELS[REWARD_LEVELS.length - 1];
    }
    
    // 计算并显示进度
    const progressPercentage = (currentPoints / nextReward.points) * 100;
    progressElement.style.width = `${Math.min(progressPercentage, 100)}%`;
    
    // 更新还需积分数
    const pointsNeeded = nextReward.points - currentPoints;
    pointsNeededElement.textContent = pointsNeeded;
    
    // 更新奖励描述
    updateRewardDescription(nextReward);
}

// 更新奖励描述
function updateRewardDescription(nextReward) {
    const rewardDescElement = document.getElementById('next-reward-desc');
    if (rewardDescElement) {
        rewardDescElement.textContent = `下一个奖励: ${nextReward.reward} (${nextReward.description})`;
    }
}

// 检查奖励
function checkRewards() {
    REWARD_LEVELS.forEach((level, index) => {
        if (currentPoints >= level.points) {
            const rewardItem = document.querySelector(`.reward-item:nth-child(${index + 1})`);
            if (rewardItem && !rewardItem.classList.contains('achieved')) {
                rewardItem.classList.add('achieved');
                showRewardNotification(level);
            }
        }
    });
}

// 显示奖励通知
function showRewardNotification(reward) {
    const notification = document.createElement('div');
    notification.className = 'reward-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <h3>🎉 恭喜解锁新奖励!</h3>
            <img src="images/${reward.image}" alt="${reward.reward}">
            <p>${reward.reward}</p>
            <p class="description">${reward.description}</p>
            <button onclick="this.parentElement.parentElement.remove()">确定</button>
        </div>
    `;
    document.body.appendChild(notification);
}

// 抽奖算法
function drawPrize() {
    const random = Math.random() * 100;
    let probabilitySum = 0;
    
    for (const prize of LOTTERY_PRIZES) {
        probabilitySum += prize.probability;
        if (random < probabilitySum) {
            return prize;
        }
    }
    return LOTTERY_PRIZES[LOTTERY_PRIZES.length - 1];
}

// 修改抽奖按钮事件监听
document.getElementById('openLottery').addEventListener('click', function() {
    // 抽奖动画
    const lotteryItems = document.querySelectorAll('.lottery-item');
    let currentIndex = 0;
    let rounds = 0;
    const totalRounds = 5;
    
    const prize = drawPrize();
    this.disabled = true;
    
    const animate = () => {
        lotteryItems.forEach(item => item.classList.remove('active'));
        lotteryItems[currentIndex].classList.add('active');
        
        currentIndex++;
        if (currentIndex >= lotteryItems.length) {
            currentIndex = 0;
            rounds++;
        }
        
        if (rounds < totalRounds) {
            setTimeout(animate, 100);
        } else {
            const finalIndex = LOTTERY_PRIZES.findIndex(p => p.id === prize.id);
            lotteryItems.forEach(item => item.classList.remove('active'));
            lotteryItems[finalIndex].classList.add('active');
            
            setTimeout(() => {
                showResult(prize);
                this.disabled = false;
            }, 500);
        }
    };
    
    animate();
});

// 修改中奖结果显示函数
function showResult(prize) {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'lottery-result';
    resultDiv.innerHTML = `
        <div class="result-content">
            <h3>🎉 恭喜获得</h3>
            <img src="${prize.image}" alt="${prize.name}">
            <p class="prize-name">${prize.name}</p>
            <p class="result-tip">请截图联系客服领取奖励</p>
            <button onclick="this.parentElement.parentElement.remove()">确定</button>
        </div>
    `;
    document.body.appendChild(resultDiv);
}

// 更新消费进度显示函数
function updateSpendProgress() {
    const progress = Math.min((totalSpend / LOTTERY_THRESHOLD) * 100, 100);
    
    document.getElementById('totalSpend').textContent = totalSpend;
    document.getElementById('spendNeeded').textContent = 
        Math.max(LOTTERY_THRESHOLD - totalSpend, 0);
    document.getElementById('spendProgress').style.width = `${progress}%`;
    
    // 更新抽奖按钮状态
    const startBtn = document.getElementById('startLottery');
    if (startBtn) {
        if (totalSpend >= LOTTERY_THRESHOLD) {
            startBtn.disabled = false;
            startBtn.textContent = '开始抽矿';
        } else {
            startBtn.disabled = true;
            startBtn.textContent = `消费满200$可抽矿`;
        }
    }
}

// 测试功能
document.addEventListener('keypress', function(e) {
    if (e.key === 't') {
        updateSystem(50); // 测试：每次消费50$
    }
});

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 从localStorage读取上次重置时间和剩余次数
    const savedResetDate = localStorage.getItem('lastResetDate');
    const savedDraws = localStorage.getItem('remainingDraws');
    
    if (savedResetDate) {
        lastResetDate = savedResetDate;
    }
    
    if (savedDraws !== null) {
        remainingDraws = parseInt(savedDraws);
    }
    
    resetDraws(); // 检查是否需要重置
    updateLotteryButton(); // 更新按钮状态
});