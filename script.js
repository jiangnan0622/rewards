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
        reward: 'Coupon Package', 
        description: 'Coupons like $10 off for every $100 spent, $20 off for every $200 spent, etc.',
        image: 'coupon.jpg',
        layer: 10
    },
    { 
        points: 400, 
        reward: 'Moroccan Geode', 
        description: 'Medium-sized Moroccan geode (8-10cm)',
        image: 'morocco.jpg',
        layer: 40
    },
    { 
        points: 800, 
        reward: 'Large Crystal Geode Combo', 
        description: 'Moroccan + Mexican geode set',
        image: 'crystal-combo.jpg',
        layer: 80
    },
    { 
        points: 1200, 
        reward: 'Stardew Valley Theme Box', 
        description: 'Limited edition collectible',
        image: 'stardew-box.jpg',
        layer: 120
    }
];

// 抽奖奖品配置
const LOTTERY_PRIZES = [
    { id: 1, name: 'Moroccan Blind Stone (5-8 cm)', probability: 5, image: 'A.png' },
    { id: 2, name: 'Energy Healing Stone (random)', probability: 25, image: 'B.jpg' },
    { id: 3, name: '5$ Coupon', probability: 70, image: 'C.png' }
];

// 矿层配置
const LAYERS = {
    soil: { start: 1, end: 39, name: 'Brown Rock Layer' },
    ice: { start: 40, end: 79, name: 'Permafrost Layer' },
    magma: { start: 80, end: 120, name: 'Magma Underworld' }
};

// 获取DOM元素
const progressElement = document.getElementById("progress");
const currentLayerElement = document.getElementById("current-layer");

// 抽奖相关变量
let remainingDraws = 1; // 每天1次抽奖机会
let lastDrawDate = localStorage.getItem('lastDrawDate') || ''; // 获取上次抽奖日期

// 重置抽奖次数函数
function resetDraws() {
    const today = new Date().toDateString();
    if (today !== lastDrawDate) {
        remainingDraws = 1;
        lastDrawDate = today;
        localStorage.setItem('lastDrawDate', lastDrawDate);
    }
}

// 检查是否可以抽奖
function canDraw() {
    const today = new Date().toDateString();
    if (lastDrawDate !== today) {
        // 新的一天，重置抽奖次数
        remainingDraws = 1;
        return true;
    }
    // 如果今天已经抽过奖，则返回false
    return remainingDraws > 0;
}

// 更新抽奖按钮状态
function updateLotteryButton() {
    const lotteryBtn = document.getElementById('openLottery');
    if (!canDraw()) {
        lotteryBtn.disabled = true;
        lotteryBtn.textContent = 'Today is drawn';
    } else {
        lotteryBtn.disabled = false;
        lotteryBtn.textContent = 'Draw Now';
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
                <p class="points-required">Points Required:${reward.points}</p>
            </div>
            <button ${currentPoints >= reward.points ? '' : 'disabled'}>
                ${currentPoints >= reward.points ? 'Redeem now' : 'Insufficient points'}
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
        rewardDescElement.textContent = `Next Reward: ${nextReward.reward} (${nextReward.description})`;
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
            <h3>🎉 Congratulations on unlocking new rewards!</h3>
            <img src="images/${reward.image}" alt="${reward.reward}">
            <p>${reward.reward}</p>
            <p class="description">${reward.description}</p>
            <button onclick="this.parentElement.parentElement.remove()">Are you sure</button>
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

// 抽奖按钮点击事件
document.getElementById('openLottery').addEventListener('click', function() {
    if (!canDraw()) {
        alert('You have drawn today, please come back tomorrow!');
        return;
    }
    
    // 开始抽奖
    const prize = drawPrize();
    this.disabled = true;
    
    // 抽奖动画
    const lotteryItems = document.querySelectorAll('.lottery-item');
    let currentIndex = 0;
    let rounds = 0;
    const totalRounds = 5;
    
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
                // 更新抽奖状态
                remainingDraws = 0;
                lastDrawDate = new Date().toDateString();
                localStorage.setItem('lastDrawDate', lastDrawDate);
                updateLotteryButton();
            }, 500);
        }
    };
    
    animate();
});

// 显示抽奖结果
function showResult(prize) {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'lottery-result';
    resultDiv.innerHTML = `
        <div class="result-content">
            <h3>🎉 Congratulations on winning</h3>
            <img src="${prize.image}" alt="${prize.name}">
            <p class="prize-name">${prize.name}</p>
            <p class="result-tip">Please take a screenshot and contact customer service to receive the reward</p>
            <button onclick="this.parentElement.parentElement.remove()">Confirm</button>
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
            startBtn.textContent = 'Start pumping';
        } else {
            startBtn.disabled = true;
            startBtn.textContent = `Spend $200 or more to draw mines`;
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
    updateLotteryButton();
});