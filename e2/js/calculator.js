let energyChart = null;
let batteryChart = null;
let lightingChart = null;
function calculateSolarEnergy() {
    const peakSunHours = parseFloat(document.getElementById('peakSunHours').value);
    const panelWattage = parseFloat(document.getElementById('panelWattage').value);
    const panelCount = parseInt(document.getElementById('panelCount').value);
    if (isNaN(peakSunHours) || isNaN(panelWattage) || isNaN(panelCount)) {
        document.getElementById('solarResult').textContent = 'Please enter valid numbers';
        return;
    }
    const dailyEnergy = peakSunHours * panelWattage * panelCount;
    document.getElementById('solarResult').textContent = `Daily Energy: ${dailyEnergy.toFixed(2)} Wh`;
}
function calculateBatteryCapacity() {
    const batteryVoltage = parseFloat(document.getElementById('batteryVoltage').value);
    const batteryCapacity = parseFloat(document.getElementById('batteryCapacity').value);
    const batteryCount = parseInt(document.getElementById('batteryCount').value);
    if (isNaN(batteryVoltage) || isNaN(batteryCapacity) || isNaN(batteryCount)) {
        document.getElementById('batteryResult').textContent = 'Please enter valid numbers';
        return;
    }
    const totalCapacity = batteryVoltage * batteryCapacity * batteryCount;
    document.getElementById('batteryResult').textContent = `Total Battery Capacity: ${totalCapacity.toFixed(2)} Wh`;
}
function calculateLuminaireEnergy() {
    const luminaireWattage = parseFloat(document.getElementById('luminaireWattage').value);
    const luminaireCount = parseInt(document.getElementById('luminaireCount').value);
    const duration = parseFloat(document.getElementById('lightingDuration').value);
    const dimEnabled = document.getElementById('dimMode').checked;
    const initialFullBrightness = parseFloat(document.getElementById('initialFullBrightness').value);
    const dimBrightness = parseFloat(document.getElementById('dimBrightness').value) / 100;
    const preDawnBrightness = parseFloat(document.getElementById('preDawnBrightness').value);
    
    if (isNaN(luminaireWattage) || isNaN(luminaireCount) || isNaN(duration)) {
        document.getElementById('luminaireResult').textContent = 'Please enter valid numbers';
        return;
    }
    
    let nightEnergy;
    let calculationDetails = '';
    
    if (dimEnabled) {
        const totalFullBrightnessHours = initialFullBrightness + preDawnBrightness;
        const dimHours = duration - totalFullBrightnessHours;
        
        if (dimHours > 0) {
            nightEnergy = luminaireWattage * luminaireCount * (totalFullBrightnessHours + dimHours * dimBrightness);
            calculationDetails = ` (DIM: ${initialFullBrightness}h@100%, ${dimHours.toFixed(1)}h@${(dimBrightness*100).toFixed(0)}%, ${preDawnBrightness}h@100%)`;
        } else {
            nightEnergy = luminaireWattage * luminaireCount * duration;
            calculationDetails = ` (Full brightness: ${duration}h)`;
        }
    } else {
        nightEnergy = luminaireWattage * luminaireCount * duration;
    }
    
    document.getElementById('luminaireResult').textContent = `Night Energy Consumption: ${nightEnergy.toFixed(2)} Wh${calculationDetails}`;
}
let currentDOD = 0.7;

function updateEnergyTable() {
    const tableBody = document.getElementById('energyTableBody');
    const resultsDiv = document.getElementById('calculationResults');
    
    const luminaireText = document.getElementById('luminaireResult').textContent;
    const nightEnergyMatch = luminaireText.match(/Night Energy Consumption: ([\d.]+)/);
    
    if (!nightEnergyMatch || luminaireText.includes('Click Confirm')) {
        tableBody.innerHTML = '<tr><td colspan="12" style="text-align: center; padding: 20px;">Please click Confirm in the Luminaire Energy calculator first</td></tr>';
        if (resultsDiv) {
            resultsDiv.style.display = 'none';
            resultsDiv.classList.remove('visible');
            resultsDiv.classList.add('collapsed');
            var confirmationDisplay = document.getElementById('confirmationDisplay');
            var resetAllBtn = document.querySelector('.reset-all-btn');
            if (confirmationDisplay && confirmationDisplay.classList.contains('visible')) {
                confirmationDisplay.style.display = 'block';
            }
            if (resetAllBtn) {
                resetAllBtn.style.display = 'block';
            }
        }
        return;
    }
    
    const dailyEnergy = parseFloat(document.getElementById('solarResult').textContent.split(':')[1]);
    
    if (resultsDiv) {
        resultsDiv.style.display = 'block';
        resultsDiv.classList.add('visible');
        resultsDiv.classList.remove('collapsed');
        var confirmationDisplay = document.getElementById('confirmationDisplay');
        var resetAllBtn = document.querySelector('.reset-all-btn');
        if (confirmationDisplay && confirmationDisplay.classList.contains('visible')) {
            confirmationDisplay.style.display = 'none';
        }
        if (resetAllBtn) {
            resetAllBtn.style.display = 'none';
        }
    }
    
    tableBody.innerHTML = '';
    
    const nightEnergyConsumption = parseFloat(nightEnergyMatch[1]);
    const batteryCapacity = parseFloat(document.getElementById('batteryResult').textContent.split(':')[1]);
    const luminaireWattage = parseFloat(document.getElementById('luminaireWattage').value);
    const luminaireCount = parseInt(document.getElementById('luminaireCount').value);
    const lightingDuration = parseFloat(document.getElementById('lightingDuration').value);

    let batteryRemaining = batteryCapacity * 0.5;
    let batteryBeforeDawn = batteryCapacity * 0.5;

    const minBatteryLevel = batteryCapacity * (1 - currentDOD);

    for (let day = 1; day <= 21; day++) {
        const row = document.createElement('tr');

        const actualCharging = dailyEnergy;
        
        const afterCharging = Math.min(batteryRemaining + actualCharging, batteryCapacity);
        
        const effectiveCharging = afterCharging - batteryRemaining;
        
        const actualAvailable = Math.max(0, afterCharging - minBatteryLevel);
        
        const actualDischarge = Math.min(nightEnergyConsumption, actualAvailable);
        
        const endOfDayRemaining = afterCharging - actualDischarge;
        
        const theoreticalRemaining = afterCharging - nightEnergyConsumption;
        
        const canFullDuration = actualDischarge >= nightEnergyConsumption;
        const displayedDuration = canFullDuration ? lightingDuration : (actualDischarge > 0 ? actualDischarge / (luminaireWattage * luminaireCount) : 0);

        const dodPercent = (currentDOD * 100).toFixed(0);
        const dodReserve = (batteryCapacity * (1 - currentDOD)).toFixed(0);
        
        row.innerHTML = `
            <td>D${day}</td>
            <td>${batteryBeforeDawn.toFixed(0)}</td>
            <td>${effectiveCharging.toFixed(0)}</td>
            <td>${afterCharging.toFixed(0)}</td>
            <td>${nightEnergyConsumption.toFixed(0)}</td>
            <td>${theoreticalRemaining.toFixed(0)}</td>
            <td>${dodPercent}</td>
            <td>${dodReserve}</td>
            <td>${actualAvailable.toFixed(0)}</td>
            <td>${actualDischarge.toFixed(0)}</td>
            <td>${endOfDayRemaining.toFixed(0)}</td>
            <td>${displayedDuration.toFixed(1)}</td>
        `;

        tableBody.appendChild(row);

        batteryBeforeDawn = endOfDayRemaining;
        batteryRemaining = endOfDayRemaining;
    }

    updateChartData();
}
function updateBatteryInfo() {
    const tableBody = document.getElementById('energyTableBody');
    const batteryCapacity = parseFloat(document.getElementById('batteryResult').textContent.split(':')[1]);
    const batteryType = document.getElementById('batteryType').value;
    const batteryCount = parseInt(document.getElementById('batteryCount').value);
    let maxDailyCirculation = 0;

    for (let day = 0; day < 21; day++) {
        const dailyCharging = parseFloat(tableBody.rows[day].cells[2].textContent);
        const actualDischarge = parseFloat(tableBody.rows[day].cells[9].textContent);
        const dailyCirculation = Math.max(dailyCharging, actualDischarge);
        maxDailyCirculation = Math.max(maxDailyCirculation, dailyCirculation);
    }
    const singleBatteryCirculation = maxDailyCirculation / (batteryCapacity * batteryCount);
    const circulationPercentage = (singleBatteryCirculation * 100).toFixed(2);
    let lifecycleDays;
    if (batteryType === 'lead-acid') {
        lifecycleDays = Math.min(Math.round(500 / singleBatteryCirculation), 4380);
    } else {
        lifecycleDays = Math.min(Math.round(2000 / singleBatteryCirculation), 8030);
    }
    const lifecycleYears = (lifecycleDays / 365).toFixed(1);
    document.getElementById('batteryCirculation').textContent = `Average Daily Battery Circulation: ${circulationPercentage}%`;
    document.getElementById('batteryLifecycle').textContent = `Estimated Battery Lifecycle: ${lifecycleYears} years (${lifecycleDays} days)`;
}

function updateChartData() {
    const tableBody = document.getElementById('energyTableBody');
    const chartData = {
        days: [],
        cumulativeCharging: [],
        cumulativeDischarging: [],
        lightingDuration: [],
        batteryRemaining: [],
        dailyNetEnergy: [],
        dailyCharging: [],
        dailyDischarge: []
    };
    let totalCharging = 0;
    let totalDischarging = 0;

    for (let day = 0; day < 21; day++) {
        chartData.days.push(`Day ${day + 1}`);
        const dailyCharging = parseFloat(tableBody.rows[day].cells[2].textContent);
        const actualDischarge = parseFloat(tableBody.rows[day].cells[9].textContent);
        const lightingDuration = parseFloat(tableBody.rows[day].cells[11].textContent);
        const batteryBeforeDawn = parseFloat(tableBody.rows[day].cells[1].textContent);
        
        totalCharging += dailyCharging;
        totalDischarging += actualDischarge;
        
        chartData.cumulativeCharging.push(totalCharging);
        chartData.cumulativeDischarging.push(totalDischarging);
        chartData.lightingDuration.push(lightingDuration);
        chartData.batteryRemaining.push(batteryBeforeDawn);
        chartData.dailyNetEnergy.push(dailyCharging - actualDischarge);
        chartData.dailyCharging.push(dailyCharging);
        chartData.dailyDischarge.push(actualDischarge);
    }

    createChart(chartData);
    createBatteryChart(chartData);
    createLightingChart(chartData);
    updateBatteryInfo();
}
function createChart(data) {
    const ctx = document.getElementById('energyChart');
    if (!ctx) return;
    if (energyChart) {
        energyChart.destroy();
    }
    const chartConfig = {
        type: 'line',
        data: {
            labels: data.days,
            datasets: [
                {
                    label: 'Cumulative Daily Energy Charging',
                    data: data.cumulativeCharging,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    fill: 'origin',
                    yAxisID: 'y',
                    pointRadius: 0,
                },
                {
                    label: 'Cumulative Night Energy Consumption',
                    data: data.cumulativeDischarging,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    fill: 'origin',
                    yAxisID: 'y',
                    pointRadius: 0,
                },
                {
                    label: 'Lighting Duration',
                    data: data.lightingDuration,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    yAxisID: 'y1',
                    pointRadius: 0,
                    borderWidth: 2,
                }
            ]
        },
        options: {
            animation: false,
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            stacked: false,
            scales: {
                x: {
                    ticks: {
                        callback: function(value, index, values) {
                            if (index === 0 || index === 9 || index === 19) {
                                return this.getLabelForValue(index);
                            }
                            return '';
                        }
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Cumulative Energy (Wh)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Lighting Duration (hours)'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            }
        },
    };
    energyChart = new Chart(ctx, chartConfig);
}

function createBatteryChart(data) {
    const ctx = document.getElementById('batteryChart');
    if (!ctx) return;
    
    if (batteryChart) {
        try {
            batteryChart.destroy();
        } catch (e) {
            console.log('Error destroying batteryChart:', e);
        }
        batteryChart = null;
    }
    
    const chartConfig = {
        type: 'bar',
        data: {
            labels: data.days,
            datasets: [
                {
                    label: 'Daily Charging (Wh)',
                    data: data.dailyCharging,
                    type: 'line',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderWidth: 2,
                    fill: false,
                    yAxisID: 'y',
                    pointRadius: 0,
                },
                {
                    label: 'Daily Discharge (Wh)',
                    data: data.dailyDischarge,
                    type: 'line',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderWidth: 2,
                    fill: false,
                    yAxisID: 'y',
                    pointRadius: 0,
                },
                {
                    label: 'Battery Remaining (Wh)',
                    data: data.batteryRemaining,
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    yAxisID: 'y',
                },
                {
                    label: 'Lighting Duration (h)',
                    data: data.lightingDuration,
                    type: 'line',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderWidth: 2,
                    fill: false,
                    yAxisID: 'y1',
                    pointRadius: 0,
                }
            ]
        },
        options: {
            animation: false,
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Energy (Wh)'
                    },
                    max: Math.max(
                        Math.max(...data.dailyCharging) * 1.3,
                        Math.max(...data.dailyDischarge) * 1.3,
                        Math.max(...data.batteryRemaining) * 1.3
                    )
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Duration (h)'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                    max: 24
                }
            }
        },
    };
    
    try {
        batteryChart = new Chart(ctx, chartConfig);
        console.log('Battery chart created successfully');
    } catch (e) {
        console.error('Error creating batteryChart:', e);
    }
}

function createLightingChart(data) {
    const ctx = document.getElementById('lightingChart');
    if (!ctx) return;

    if (lightingChart) {
        try {
            lightingChart.destroy();
        } catch (e) {
            console.log('Error destroying lightingChart:', e);
        }
        lightingChart = null;
    }

    const startHour = 19;
    
    const dimEnabled = document.getElementById('dimMode').checked;
    const initialFullBrightness = parseFloat(document.getElementById('initialFullBrightness').value) || 2;
    const dimBrightness = parseFloat(document.getElementById('dimBrightness').value) / 100 || 0.5;
    const preDawnBrightness = parseFloat(document.getElementById('preDawnBrightness').value) || 2;

    const generateColors = () => {
        const colors = [];
        for (let i = 0; i < 21; i++) {
            const hue = (i * 17) % 360; // 均匀分布的色相
            const color = `hsla(${hue}, 70%, 60%, 0.8)`;
            const borderColor = `hsla(${hue}, 70%, 50%, 1)`;
            colors.push({ backgroundColor: color, borderColor: borderColor });
        }
        return colors;
    };
    
    const dayColors = generateColors();

    const datasets = [];
    
    for (let dayIndex = 0; dayIndex < 21; dayIndex++) {
        const eveningData = [];
        for (let i = 0; i < data.lightingDuration.length; i++) {
            if (i === dayIndex) {
                const duration = data.lightingDuration[dayIndex];
                if (duration > 0) {
                    const endOfDay = Math.min(startHour + duration, 24);
                    eveningData.push([startHour, endOfDay]);
                } else {
                    eveningData.push(null);
                }
            } else {
                eveningData.push(null);
            }
        }
        
        datasets.push({
            label: `Day ${dayIndex + 1} Evening (19:00-24:00)`,
            data: eveningData,
            backgroundColor: dayColors[dayIndex].backgroundColor,
            borderColor: dayColors[dayIndex].borderColor,
            borderWidth: 1,
            barPercentage: 1.0,
            categoryPercentage: 1.0,
        });
    }
    
    for (let dayIndex = 0; dayIndex < 21; dayIndex++) {
        const overnightData = [];
        for (let i = 0; i < data.lightingDuration.length; i++) {
            if (i === dayIndex) {
                const duration = data.lightingDuration[dayIndex];
                if (duration > 0 && startHour + duration > 24) {
                    const nextDayEnd = (startHour + duration) - 24;
                    overnightData.push([24, 24 + nextDayEnd]);
                } else {
                    overnightData.push(null);
                }
            } else {
                overnightData.push(null);
            }
        }
        
        datasets.push({
            label: `Day ${dayIndex + 1} Overnight (00:00-xx:xx)`,
            data: overnightData,
            backgroundColor: dayColors[dayIndex].backgroundColor,
            borderColor: dayColors[dayIndex].borderColor,
            borderWidth: 1,
            barPercentage: 1.0,
            categoryPercentage: 1.0,
        });
    }

    const chartConfig = {
        type: 'bar',
        data: {
            labels: data.days,
            datasets: datasets
        },
        options: {
            animation: false,
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // 隐藏图例
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const val = context.raw;
                            if (!val) return '';
                            const start = Math.floor(val[0]);
                            const startMin = Math.round((val[0] - start) * 60);
                            const end = Math.floor(val[1]);
                            const endMin = Math.round((val[1] - end) * 60);
                            return `${context.dataset.label}: ${start}:${startMin.toString().padStart(2, '0')} - ${end}:${endMin.toString().padStart(2, '0')}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    position: 'top',
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        autoSkip: false,
                        callback: function(value, index, values) {
                            return this.getLabelForValue(index);
                        }
                    }
                },
                x2: {
                    position: 'bottom',
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        autoSkip: false,
                        callback: function(value, index, values) {
                            return this.getLabelForValue(index);
                        }
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Time'
                    },
                    min: 14,  // 下午2点
                    max: 38,  // 第二天下午2点（24+14）
                    reverse: true,  // 反转Y轴，时间上下对调
                    ticks: {
                        stepSize: 1,
                        precision: 0,
                        autoSkip: false,
                        maxTicksLimit: 25,
                        callback: function(value) {
                            const hour = Math.floor(value) % 24;
                            return `${hour.toString().padStart(2, '0')}:00`;
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            }
        }
    };

    try {
        lightingChart = new Chart(ctx, chartConfig);
        console.log('Lighting chart created successfully');
    } catch (e) {
        console.error('Error creating lightingChart:', e);
    }
}

function initializeCalculator() {
    var confirmedData = {};
    document.getElementById('btnDefault').classList.add('active');
    calculateSolarEnergy();
    calculateBatteryCapacity();
    updateEnergyTable();
    updateCalculateTabState();
    
    document.getElementById('peakSunHours').addEventListener('input', calculateSolarEnergy);
    document.getElementById('panelWattage').addEventListener('input', calculateSolarEnergy);
    document.getElementById('panelCount').addEventListener('input', calculateSolarEnergy);
    
    document.getElementById('batteryVoltage').addEventListener('input', calculateBatteryCapacity);
    document.getElementById('batteryCapacity').addEventListener('input', calculateBatteryCapacity);
    document.getElementById('batteryCount').addEventListener('input', calculateBatteryCapacity);
    
    document.getElementById('luminaireWattage').addEventListener('input', calculateLuminaireEnergy);
    document.getElementById('luminaireCount').addEventListener('input', calculateLuminaireEnergy);
    document.getElementById('lightingDuration').addEventListener('change', calculateLuminaireEnergy);
    document.getElementById('dimMode').addEventListener('change', calculateLuminaireEnergy);
    document.getElementById('initialFullBrightness').addEventListener('change', calculateLuminaireEnergy);
    document.getElementById('dimBrightness').addEventListener('change', calculateLuminaireEnergy);
    document.getElementById('preDawnBrightness').addEventListener('change', calculateLuminaireEnergy);
    setTimeout(function() {
        if (energyChart) {
            energyChart.resize();
            energyChart.update();
        }
        if (batteryChart) {
            batteryChart.resize();
            batteryChart.update();
        }
    }, 500);
    
    document.getElementById('calculateButton').addEventListener('click', function() {
        if (!areAllTabsCompleted()) {
            showNotification('Please enter solar, battery, and luminaire information first');
            return;
        }
        
        var calcModal = document.getElementById('calculateConfirmModal');
        calcModal.classList.add('visible');
    });
    
    document.getElementById('calcModalCancelBtn').addEventListener('click', function() {
        var calcModal = document.getElementById('calculateConfirmModal');
        calcModal.classList.remove('visible');
    });
    
    document.getElementById('calcModalConfirmBtn').addEventListener('click', function() {
        var calcModal = document.getElementById('calculateConfirmModal');
        calcModal.classList.remove('visible');
        
        var calculateBtn = document.getElementById('calculateButton');
        
        calculateBtn.disabled = true;
        calculateBtn.innerHTML = '<span class="loading-spinner"></span> 计算中...';
        
        setTimeout(function() {
            calculateSolarEnergy();
            calculateBatteryCapacity();
            calculateLuminaireEnergy();
            var resultsDiv = document.getElementById('calculationResults');
            if (resultsDiv) {
                resultsDiv.style.display = 'block';
                resultsDiv.classList.add('visible');
                resultsDiv.classList.remove('collapsed');
                document.body.classList.add('showing-results');
                var confirmationDisplay = document.getElementById('confirmationDisplay');
                var resetAllBtn = document.querySelector('.reset-all-btn');
                if (confirmationDisplay) {
                    confirmationDisplay.style.display = 'none';
                }
                if (resetAllBtn) {
                    resetAllBtn.style.display = 'none';
                }
            }
            setTimeout(function() {
                updateEnergyTable();
                calculateBtn.disabled = false;
                calculateBtn.innerHTML = '📊 计算';
            }, 50);
        }, 1500); // 1.5秒延迟
    });
    
    document.getElementById('calculateConfirmModal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('visible');
        }
    });

        
            
            

    document.getElementById('resultsTitle').addEventListener('click', function() {
        var resultsDiv = document.getElementById('calculationResults');
        var confirmationDisplay = document.getElementById('confirmationDisplay');
        var resetAllBtn = document.querySelector('.reset-all-btn');
        
        if (resultsDiv.classList.contains('collapsed')) {
            resultsDiv.classList.remove('collapsed');
            resultsDiv.classList.add('visible');
            document.body.classList.add('showing-results');
            
            if (confirmationDisplay) {
                confirmationDisplay.style.display = 'none';
            }
            if (resetAllBtn) {
                resetAllBtn.style.display = 'none';
            }
        } else {
            resultsDiv.classList.add('collapsed');
            resultsDiv.classList.remove('visible');
            document.body.classList.remove('showing-results');
            
            if (confirmationDisplay) {
                confirmationDisplay.style.display = 'block';
            }
            if (resetAllBtn) {
                resetAllBtn.style.display = 'block';
            }
        }
    });

    document.getElementById('closeResultsBtn').addEventListener('click', function() {
        var resultsDiv = document.getElementById('calculationResults');
        var confirmationDisplay = document.getElementById('confirmationDisplay');
        var resetAllBtn = document.querySelector('.reset-all-btn');
        
        resultsDiv.classList.add('collapsed');
        resultsDiv.classList.remove('visible');
        document.body.classList.remove('showing-results');
        
        if (confirmationDisplay) {
            confirmationDisplay.style.display = 'block';
        }
        if (resetAllBtn) {
            resetAllBtn.style.display = 'block';
        }
    });

    var confirmationDiv = document.getElementById('confirmationDisplay');
    var minimizeConfirmationBtn = document.getElementById('minimizeConfirmation');
    
    console.log('confirmationDiv:', confirmationDiv);
    console.log('minimizeConfirmationBtn:', minimizeConfirmationBtn);
    
    if (minimizeConfirmationBtn) {
        minimizeConfirmationBtn.addEventListener('click', function(event) {
            event.stopPropagation(); // 阻止事件冒泡
            console.log('Minimize button clicked!');
            if (confirmationDiv.classList.contains('collapsed')) {
                confirmationDiv.classList.remove('collapsed');
                minimizeConfirmationBtn.textContent = '−';
            } else {
                confirmationDiv.classList.add('collapsed');
                minimizeConfirmationBtn.textContent = '+';
            }
        });
    } else {
        console.log('minimizeConfirmationBtn not found!');
    }
    
    if (confirmationDiv) {
        confirmationDiv.addEventListener('click', function() {
            if (confirmationDiv.classList.contains('collapsed')) {
                confirmationDiv.classList.remove('collapsed');
                if (minimizeConfirmationBtn) {
                    minimizeConfirmationBtn.textContent = '−';
                }
            }
        });
    }

    document.addEventListener('click', function(event) {
        var resultsDiv = document.getElementById('calculationResults');
        var calculateBtn = document.getElementById('calculateButton');
        
        var isClickOnModal = event.target.closest('.modal-overlay') || event.target.closest('.modal-content');
        var isClickOnResultsTab = event.target.closest('.results-tab-btn');
        
        if (resultsDiv && resultsDiv.classList.contains('visible') && !resultsDiv.classList.contains('collapsed')) {
            var isClickInside = resultsDiv.contains(event.target);
            var isClickOnCalculate = calculateBtn && calculateBtn.contains(event.target);
            
            if (!isClickInside && !isClickOnCalculate && !isClickOnModal && !isClickOnResultsTab) {
                resultsDiv.classList.add('collapsed');
                resultsDiv.classList.remove('visible');
                var confirmationDisplay = document.getElementById('confirmationDisplay');
                var resetAllBtn = document.querySelector('.reset-all-btn');
                if (confirmationDisplay && confirmationDisplay.classList.contains('visible')) {
                    confirmationDisplay.style.display = 'block';
                }
                if (resetAllBtn) {
                    resetAllBtn.style.display = 'block';
                }
            }
        }
    });

    let pendingDODAction = null;
    
    function showDODConfirmModal(message, action) {
        pendingDODAction = action;
        document.getElementById('dodModalMessage').textContent = message;
        document.getElementById('dodConfirmModal').classList.add('visible');
    }
    
    document.getElementById('dodModalCancelBtn').addEventListener('click', function() {
        document.getElementById('dodConfirmModal').classList.remove('visible');
        pendingDODAction = null;
    });
    
    document.getElementById('dodModalConfirmBtn').addEventListener('click', function() {
        document.getElementById('dodConfirmModal').classList.remove('visible');
        if (pendingDODAction) {
            pendingDODAction();
            pendingDODAction = null;
        }
    });
    
    document.getElementById('dodConfirmModal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('visible');
            pendingDODAction = null;
        }
    });

    document.getElementById('btnDefault').addEventListener('click', function() {
        showDODConfirmModal('Switch to Default DOD (70%)?', function() {
            currentDOD = 0.7;
            document.getElementById('btnDefault').classList.add('active');
            document.getElementById('btnLeadAcid').classList.remove('active');
            document.getElementById('btnLithium').classList.remove('active');
            document.querySelector('.custom-dod-wrapper').classList.remove('active');
            updateEnergyTable();
        });
    });

    document.getElementById('btnLeadAcid').addEventListener('click', function() {
        showDODConfirmModal('Switch to Lead Acid Battery DOD (60%)?', function() {
            currentDOD = 0.6;
            document.getElementById('btnLeadAcid').classList.add('active');
            document.getElementById('btnLithium').classList.remove('active');
            document.getElementById('btnDefault').classList.remove('active');
            document.querySelector('.custom-dod-wrapper').classList.remove('active');
            document.getElementById('batteryType').value = 'lead-acid';
            updateEnergyTable();
        });
    });

    document.getElementById('btnLithium').addEventListener('click', function() {
        showDODConfirmModal('Switch to Lithium Battery DOD (90%)?', function() {
            currentDOD = 0.9;
            document.getElementById('btnLithium').classList.add('active');
            document.getElementById('btnLeadAcid').classList.remove('active');
            document.getElementById('btnDefault').classList.remove('active');
            document.querySelector('.custom-dod-wrapper').classList.remove('active');
            document.getElementById('batteryType').value = 'lithium';
            updateEnergyTable();
        });
    });

    document.getElementById('btnCustomDOD').addEventListener('click', function() {
        const customDOD = parseFloat(document.getElementById('customDODInput').value);
        if (!isNaN(customDOD) && customDOD >= 1 && customDOD <= 100) {
            showDODConfirmModal('Set custom DOD to ' + customDOD + '%?', function() {
                currentDOD = customDOD / 100;
                document.getElementById('btnDefault').classList.remove('active');
                document.getElementById('btnLeadAcid').classList.remove('active');
                document.getElementById('btnLithium').classList.remove('active');
                document.querySelector('.custom-dod-wrapper').classList.add('active');
                updateEnergyTable();
            });
        } else {
            showNotification('请输入有效的DOD值 (1-100)');
        }
    });

    document.getElementById('batteryType').addEventListener('change', updateBatteryInfo);

    document.getElementById('dimMode').addEventListener('change', function() {
        const dimFields = document.getElementById('dimModeFields');
        if (this.checked) {
            dimFields.style.display = 'table-row-group';
        } else {
            dimFields.style.display = 'none';
        }
    });

    var resultsTabBtns = document.querySelectorAll('.results-tab-btn');
    resultsTabBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var targetPanel = btn.dataset.tab;
            
            resultsTabBtns.forEach(function(b) { b.classList.remove('active'); });
            document.querySelectorAll('.results-tab-panel').forEach(function(p) { p.classList.remove('active'); });
            
            btn.classList.add('active');
            var panel = document.getElementById(targetPanel);
            panel.classList.add('active');
            
            setTimeout(function() {
                if (targetPanel === 'panel-battery-chart') {
                    const tableBody = document.getElementById('energyTableBody');
                    if (tableBody && tableBody.rows.length > 0) {
                        updateChartData();
                    }
                }
                if (targetPanel === 'panel-energy-chart') {
                    const tableBody = document.getElementById('energyTableBody');
                    if (tableBody && tableBody.rows.length > 0) {
                        updateChartData();
                    }
                }
                if (targetPanel === 'panel-lighting') {
                    const tableBody = document.getElementById('energyTableBody');
                    if (tableBody && tableBody.rows.length > 0) {
                        updateChartData();
                    }
                }
            }, 200);
        });
    });

    var calculators = document.querySelectorAll('.calculator');
    
    function closeAllCalculators() {
        calculators.forEach(function(calc) {
            calc.classList.remove('expanded');
        });
        var confirmationDisplay = document.getElementById('confirmationDisplay');
        var resetAllBtn = document.querySelector('.reset-all-btn');
        if (confirmationDisplay && confirmationDisplay.classList.contains('visible')) {
            confirmationDisplay.style.display = 'block';
        }
        if (resetAllBtn) {
            resetAllBtn.style.display = 'block';
        }
    }
    
    /*
    calculators.forEach(function(calc) {
        var header = calc.querySelector('h3');
        if (header) {
            header.addEventListener('click', function(event) {
                event.stopPropagation();
                var isExpanded = calc.classList.contains('expanded');
                closeAllCalculators();
                if (!isExpanded) {
                    calc.classList.add('expanded');
                }
            });
        }
    });
    */
    
    document.addEventListener('click', function(event) {
        var isClickInsideCalculator = event.target.closest('.calculator');
        if (!isClickInsideCalculator) {
            closeAllCalculators();
        }
    });

    var bottomTabs = document.querySelectorAll('.tab-item');
    bottomTabs.forEach(function(tab) {
        tab.addEventListener('click', function(event) {
            event.stopPropagation();
            
            if (event.target.classList.contains('tab-reset-btn')) {
                return;
            }
            
            var tabId = tab.dataset.tab;
            var targetCalculator;
            
            switch(tabId) {
                case 'step1':
                    targetCalculator = document.querySelector('.calculator:nth-child(1)');
                    break;
                case 'step2':
                    targetCalculator = document.querySelector('.calculator:nth-child(2)');
                    break;
                case 'step3':
                    targetCalculator = document.querySelector('.calculator:nth-child(3)');
                    break;
                case 'calculate':
                    if (!areAllTabsCompleted()) {
                        showNotification('Please enter solar, battery, and luminaire information first');
                        return;
                    }
                    var calculateButton = document.getElementById('calculateButton');
                    if (calculateButton) {
                        closeAllCalculators();
                        calculateButton.click();
                    }
                    return;
                default:
                    return;
            }
            
            if (targetCalculator) {
                var isExpanded = targetCalculator.classList.contains('expanded');
                closeAllCalculators();
                if (!isExpanded) {
                    targetCalculator.classList.add('expanded');
                    var confirmationDisplay = document.getElementById('confirmationDisplay');
                    var resetAllBtn = document.querySelector('.reset-all-btn');
                    if (confirmationDisplay && confirmationDisplay.classList.contains('visible')) {
                        confirmationDisplay.style.display = 'none';
                    }
                    if (resetAllBtn) {
                        resetAllBtn.style.display = 'none';
                    }
                }
            }
        });
    });
    
    var confirmButtons = document.querySelectorAll('.confirm-btn');
    var confirmationDisplay = document.getElementById('confirmationDisplay');
    var confirmationContent = document.getElementById('confirmationContent');
    
    confirmButtons.forEach(function(btn) {
        btn.addEventListener('click', function(event) {
            event.stopPropagation();
            var calculatorType = btn.dataset.calculator;
            confirmCalculator(calculatorType);
            closeAllCalculators();
        });
    });

    var closeButtons = document.querySelectorAll('.close-calculator-btn');
    closeButtons.forEach(function(btn) {
        btn.addEventListener('click', function(event) {
            event.stopPropagation();
            var calculatorType = btn.dataset.calculator;
            var calculator = btn.closest('.calculator');
            if (calculator) {
                calculator.classList.remove('expanded');
            }
        });
    });

    var currentResetType = null;
    
    var resetButtons = document.querySelectorAll('.reset-btn');
    resetButtons.forEach(function(btn) {
        btn.addEventListener('click', function(event) {
            event.stopPropagation();
            var resetType = btn.dataset.reset;
            showResetConfirmModal(resetType);
        });
    });

    var tabResetButtons = document.querySelectorAll('.tab-reset-btn');
    tabResetButtons.forEach(function(btn) {
        btn.addEventListener('click', function(event) {
            event.stopPropagation();
            var resetType = btn.dataset.reset;
            showResetConfirmModal(resetType);
        });
    });

    var resetAllBtn = document.getElementById('resetAllBtn');
    if (resetAllBtn) {
        resetAllBtn.addEventListener('click', function(event) {
            event.stopPropagation();
            showResetConfirmModal('all');
        });
    }
    
    function showResetConfirmModal(resetType) {
        currentResetType = resetType;
        var modal = document.getElementById('resetConfirmModal');
        var message = document.querySelector('.modal-message');
        
        switch(resetType) {
            case 'solar':
                message.textContent = 'Reset the solar calculator data?';
                break;
            case 'battery':
                message.textContent = 'Reset the battery calculator data?';
                break;
            case 'luminaire':
                message.textContent = 'Reset the luminaire calculator data?';
                break;
            case 'all':
                message.textContent = 'Reset all calculator data?';
                break;
            default:
                message.textContent = 'Reset this calculator data?';
        }
        
        modal.classList.add('visible');
    }
    
    function hideResetConfirmModal() {
        var modal = document.getElementById('resetConfirmModal');
        modal.classList.remove('visible');
        currentResetType = null;
    }
    
    function confirmReset() {
        if (currentResetType === 'all') {
            resetAllCalculators();
        } else {
            resetCalculator(currentResetType);
        }
        hideResetConfirmModal();
    }
    
    var modalCancelBtn = document.getElementById('modalCancelBtn');
    var modalConfirmBtn = document.getElementById('modalConfirmBtn');
    
    if (modalCancelBtn) {
        modalCancelBtn.addEventListener('click', function() {
            hideResetConfirmModal();
        });
    }
    
    if (modalConfirmBtn) {
        modalConfirmBtn.addEventListener('click', function() {
            confirmReset();
        });
    }

    function resetCalculator(type) {
        var calculatorIndex = 0;
        var tabId = '';
        
        switch(type) {
            case 'solar':
                calculatorIndex = 1;
                tabId = 'step1';
                document.getElementById('peakSunHours').value = 5;
                document.getElementById('panelWattage').value = 100;
                document.getElementById('panelCount').value = 1;
                document.getElementById('solarResult').textContent = 'Daily Energy: 0 Wh';
                break;
            case 'battery':
                calculatorIndex = 2;
                tabId = 'step2';
                document.getElementById('batteryVoltage').value = 12;
                document.getElementById('batteryCapacity').value = 100;
                document.getElementById('batteryCount').value = 1;
                document.getElementById('batteryResult').textContent = 'Total Battery Capacity: 0 Wh';
                break;
            case 'luminaire':
                calculatorIndex = 3;
                tabId = 'step3';
                document.getElementById('luminaireWattage').value = 20;
                document.getElementById('luminaireCount').value = 1;
                document.getElementById('lightingDuration').selectedIndex = 0;
                document.getElementById('dimMode').checked = false;
                document.getElementById('dimModeFields').style.display = 'none';
                document.getElementById('luminaireResult').textContent = 'Night Energy Consumption: Click Confirm to calculate';
                break;
        }
        
        var calculator = document.querySelector('.calculator:nth-child(' + calculatorIndex + ')');
        if (calculator) {
            calculator.classList.remove('completed');
        }
        
        var tabItem = document.querySelector('.tab-item[data-tab="' + tabId + '"]');
        if (tabItem) {
            tabItem.classList.remove('completed');
        }
        
        delete confirmedData[type];
        updateConfirmationDisplay();
        updateCalculateTabState();
    }

    function resetAllCalculators() {
        resetCalculator('solar');
        resetCalculator('battery');
        resetCalculator('luminaire');
        
        var resultsDiv = document.getElementById('calculationResults');
        if (resultsDiv) {
            resultsDiv.style.display = 'none';
            resultsDiv.classList.remove('visible');
            resultsDiv.classList.add('collapsed');
            var confirmationDisplay = document.getElementById('confirmationDisplay');
            var resetAllBtn = document.querySelector('.reset-all-btn');
            if (confirmationDisplay && confirmationDisplay.classList.contains('visible')) {
                confirmationDisplay.style.display = 'block';
            }
            if (resetAllBtn) {
                resetAllBtn.style.display = 'block';
            }
        }
    }
    
    function confirmCalculator(type) {
        var data = {};
        var calculatorIndex = 0;
        var tabId = '';
        
        switch(type) {
            case 'solar':
                calculatorIndex = 1;
                tabId = 'step1';
                data = {
                    title: 'Solar Energy',
                    peakSunHours: document.getElementById('peakSunHours').value,
                    panelWattage: document.getElementById('panelWattage').value,
                    panelCount: document.getElementById('panelCount').value,
                    result: document.getElementById('solarResult').textContent
                };
                break;
            case 'battery':
                calculatorIndex = 2;
                tabId = 'step2';
                data = {
                    title: 'Battery Capacity',
                    batteryVoltage: document.getElementById('batteryVoltage').value,
                    batteryCapacity: document.getElementById('batteryCapacity').value,
                    batteryCount: document.getElementById('batteryCount').value,
                    result: document.getElementById('batteryResult').textContent
                };
                break;
            case 'luminaire':
                calculatorIndex = 3;
                tabId = 'step3';
                calculateLuminaireEnergy();
                data = {
                    title: 'Luminaire Energy',
                    luminaireWattage: document.getElementById('luminaireWattage').value,
                    luminaireCount: document.getElementById('luminaireCount').value,
                    lightingDuration: document.getElementById('lightingDuration').options[document.getElementById('lightingDuration').selectedIndex].text,
                    result: document.getElementById('luminaireResult').textContent
                };
                break;
        }
        
        confirmedData[type] = data;
        updateConfirmationDisplay();
        updateCalculateTabState();
        
        var calculator = document.querySelector('.calculator:nth-child(' + calculatorIndex + ')');
        if (calculator) {
            calculator.classList.add('completed');
        }
        
        var tabItem = document.querySelector('.tab-item[data-tab="' + tabId + '"]');
        if (tabItem) {
            tabItem.classList.add('completed');
        }
        
        closeAllCalculators();
    }
    
    function updateConfirmationDisplay() {
        var html = '';
        var hasData = false;
        
        Object.keys(confirmedData).forEach(function(key) {
            var data = confirmedData[key];
            hasData = true;
            html += '<div class="confirmation-content-item">';
            html += '<div class="title">' + data.title + '</div>';
            
            if (data.title === 'Solar Energy') {
                html += '<div class="params">';
                html += '<div>Peak Sun Hours: ' + data.peakSunHours + ' hours</div>';
                html += '<div>Solar Panel Wattage: ' + data.panelWattage + ' W</div>';
                html += '<div>Number of Panels: ' + data.panelCount + '</div>';
                html += '</div>';
            } else if (data.title === 'Battery Capacity') {
                html += '<div class="params">';
                html += '<div>Battery Voltage: ' + data.batteryVoltage + ' V</div>';
                html += '<div>Battery Capacity: ' + data.batteryCapacity + ' Ah</div>';
                html += '<div>Number of Batteries: ' + data.batteryCount + '</div>';
                html += '</div>';
            } else if (data.title === 'Luminaire Energy') {
                html += '<div class="params">';
                html += '<div>Luminaire Wattage: ' + data.luminaireWattage + ' W</div>';
                html += '<div>Number of Luminaires: ' + data.luminaireCount + '</div>';
                html += '<div>Lighting Duration: ' + data.lightingDuration + '</div>';
                html += '</div>';
            }
            
            html += '<div class="result">' + data.result + '</div>';
            html += '</div>';
        });
        
        if (hasData) {
            confirmationContent.innerHTML = html;
            confirmationDisplay.classList.add('visible');
        } else {
            confirmationDisplay.classList.remove('visible');
        }
    }
    
    function areAllTabsCompleted() {
        return confirmedData.hasOwnProperty('solar') && 
               confirmedData.hasOwnProperty('battery') && 
               confirmedData.hasOwnProperty('luminaire');
    }
    
    function showNotification(message) {
        var existing = document.querySelector('.custom-notification');
        if (existing) existing.remove();
        
        var notification = document.createElement('div');
        notification.className = 'custom-notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(function() {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(function() {
            notification.classList.remove('show');
            setTimeout(function() {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    function updateCalculateTabState() {
        var calculateTab = document.querySelector('.tab-item[data-tab="calculate"]');
        if (!calculateTab) return;
        
        if (areAllTabsCompleted()) {
            calculateTab.classList.add('completed');
            calculateTab.classList.remove('disabled');
        } else {
            calculateTab.classList.remove('completed');
            calculateTab.classList.add('disabled');
        }
    }
}

function isHBuilderApp() {
    return typeof plus !== 'undefined' && plus.os && plus.io;
}

/*
const PDF_EXPORT_TIMEOUT = 60000;

async function exportToPDF() {
    const productKey = 'e6_report';
    if (!checkPurchaseStatus(productKey)) {
        console.log('[Report] User not purchased, showing purchase modal');
        showPurchaseModal(productKey);
        return;
    }

    const exportBtn = document.getElementById('exportPdfBtn');
    if (!exportBtn) return;
    const originalText = exportBtn.textContent;
    exportBtn.textContent = '⏳ Generating...';
    exportBtn.disabled = true;

    function restoreButton(text) {
        if (exportBtn) {
            exportBtn.textContent = text;
            exportBtn.disabled = false;
        }
    }
    
    try {
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('PDF_EXPORT_TIMEOUT')), PDF_EXPORT_TIMEOUT)
        );
        
        const exportPromise = (async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { jsPDF } = window.jspdf;
        
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        let y = 20;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        const maxY = pageHeight - 20;
        
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Energy Consumption Calculator Report', pageWidth / 2, y, { align: 'center' });
        y += 12;
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        const date = new Date();
        const dateStr = date.toLocaleString('zh-CN');
        pdf.text(`Generated: ${dateStr}`, pageWidth / 2, y, { align: 'center' });
        y += 15;
        
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.text('1. Solar Panel Information', margin, y);
        y += 8;
        
        const peakSunHours = document.getElementById('peakSunHours')?.value || '-';
        const panelWattage = document.getElementById('panelWattage')?.value || '-';
        const panelCount = document.getElementById('panelCount')?.value || '-';
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Peak Sun Hours: ${peakSunHours} hours/day`, margin, y);
        y += 6;
        pdf.text(`Panel Wattage: ${panelWattage} W`, margin, y);
        y += 6;
        pdf.text(`Number of Panels: ${panelCount}`, margin, y);
        y += 4;
        
        const solarResult = document.getElementById('solarResult')?.textContent || '';
        if (solarResult) {
            pdf.setFont('helvetica', 'bold');
            pdf.text(solarResult, margin, y);
        }
        y += 12;
        
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.text('2. Battery Information', margin, y);
        y += 8;
        
        const batteryVoltage = document.getElementById('batteryVoltage')?.value || '-';
        const batteryCapacity = document.getElementById('batteryCapacity')?.value || '-';
        const batteryCount = document.getElementById('batteryCount')?.value || '-';
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Battery Voltage: ${batteryVoltage} V`, margin, y);
        y += 6;
        pdf.text(`Battery Capacity: ${batteryCapacity} Ah`, margin, y);
        y += 6;
        pdf.text(`Number of Batteries: ${batteryCount}`, margin, y);
        y += 4;
        
        const batteryResult = document.getElementById('batteryResult')?.textContent || '';
        if (batteryResult) {
            pdf.setFont('helvetica', 'bold');
            pdf.text(batteryResult, margin, y);
        }
        y += 12;
        
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.text('3. Luminaire Information', margin, y);
        y += 8;
        
        const luminaireWattage = document.getElementById('luminaireWattage')?.value || '-';
        const luminaireCount = document.getElementById('luminaireCount')?.value || '-';
        const lightingDuration = document.getElementById('lightingDuration')?.value || '-';
        const dimMode = document.getElementById('dimMode')?.checked ? 'Enabled' : 'Disabled';
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Luminaire Wattage: ${luminaireWattage} W`, margin, y);
        y += 6;
        pdf.text(`Number of Luminaires: ${luminaireCount}`, margin, y);
        y += 6;
        pdf.text(`Lighting Duration: ${lightingDuration} hours`, margin, y);
        y += 6;
        pdf.text(`Dimming Mode: ${dimMode}`, margin, y);
        y += 4;
        
        const luminaireResult = document.getElementById('luminaireResult')?.textContent || '';
        if (luminaireResult) {
            pdf.setFont('helvetica', 'bold');
            pdf.text(luminaireResult, margin, y);
        }
        y += 15;
        
        if (y > maxY - 150) {
            pdf.addPage();
            y = 20;
        }
        
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.text('4. Energy Chart', margin, y);
        y += 8;
        
        const energyChartCanvas = document.getElementById('energyChart');
        if (energyChartCanvas) {
            const chartWidth = pageWidth - margin * 2;
            const chartHeight = (chartWidth / 400) * 250;
            
            if (y + chartHeight > maxY) {
                pdf.addPage();
                y = 20;
            }
            
            try {
                const chartDataUrl = await exportCanvasToImage(energyChartCanvas);
                if (chartDataUrl) {
                    pdf.addImage(chartDataUrl, 'PNG', margin, y, chartWidth, chartHeight);
                    y += chartHeight + 12;
                } else {
                    pdf.text('Chart image not available', margin, y);
                    y += 12;
                }
            } catch (e) {
                console.error('Failed to export energy chart:', e);
                pdf.text('Chart export failed', margin, y);
                y += 12;
            }
        } else {
            pdf.text('Chart not available', margin, y);
            y += 12;
        }
        
        if (y > maxY - 150) {
            pdf.addPage();
            y = 20;
        }
        
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.text('5. Battery Info', margin, y);
        y += 8;
        
        const batteryType = document.getElementById('batteryType')?.value || '-';
        const batteryCirculation = document.getElementById('batteryCirculation')?.textContent || '-';
        const batteryLifecycle = document.getElementById('batteryLifecycle')?.textContent || '-';
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Battery Type: ${batteryType === 'lead-acid' ? 'Lead Acid' : 'Lithium'}`, margin, y);
        y += 6;
        pdf.text(batteryCirculation, margin, y);
        y += 6;
        pdf.text(batteryLifecycle, margin, y);
        y += 12;
        
        if (y > maxY - 150) {
            pdf.addPage();
            y = 20;
        }
        
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.text('6. Battery Chart', margin, y);
        y += 8;
        
        const batteryChartCanvas = document.getElementById('batteryChart');
        if (batteryChartCanvas) {
            const chartWidth = pageWidth - margin * 2;
            const chartHeight = (chartWidth / 400) * 250;
            
            if (y + chartHeight > maxY) {
                pdf.addPage();
                y = 20;
            }
            
            try {
                const chartDataUrl = await exportCanvasToImage(batteryChartCanvas);
                if (chartDataUrl) {
                    pdf.addImage(chartDataUrl, 'PNG', margin, y, chartWidth, chartHeight);
                    y += chartHeight + 12;
                } else {
                    pdf.text('Battery chart image not available', margin, y);
                    y += 12;
                }
            } catch (e) {
                console.error('Failed to export battery chart:', e);
                pdf.text('Battery chart export failed', margin, y);
                y += 12;
            }
        } else {
            pdf.text('Battery chart not available', margin, y);
            y += 12;
        }
        
        if (y > maxY - 100) {
            pdf.addPage();
            y = 20;
        }
        
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.text('7. Energy Table', margin, y);
        y += 8;
        
        const energyTable = document.querySelector('.energy-table');
        if (energyTable) {
            const headers = energyTable.querySelectorAll('thead th');
            const rows = energyTable.querySelectorAll('tbody tr');
            
            const headerTexts = Array.from(headers).map(th => {
                const text = th.textContent || th.innerText;
                return text.replace(/<br\s*\/?>/gi, ' ').trim();
            });
            
            const tableData = [];
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                const rowData = Array.from(cells).map(cell => cell.textContent || cell.innerText || '-');
                tableData.push(rowData);
            });
            
            const allColumns = headerTexts.length;
            const cellHeight = 4;
            
            const colWidths = [
                12,  // Day
                18,  // Battery Before Dawn
                18,  // Daily Charging
                18,  // Battery Before Evening
                18,  // Daily Discharging
                18,  // Theoretical Remaining
                14,  // DOD Limit
                16,  // DOD Reserve
                16,  // Actual Available
                16,  // Actual Discharge
                18,  // End-of-Day Remaining
                14   // Lighting Duration
            ];
            
            const totalWidth = colWidths.reduce((a, b) => a + b, 0);
            const availableWidth = pageWidth - margin * 2;
            const scaleFactor = Math.min(1, availableWidth / totalWidth);
            
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(5);
            let x = margin;
            headerTexts.forEach((header, i) => {
                const colWidth = colWidths[i] * scaleFactor;
                pdf.text(header.substring(0, 8), x, y);
                x += colWidth;
            });
            y += cellHeight + 2;
            
            pdf.setLineWidth(0.3);
            pdf.line(margin, y, margin + totalWidth * scaleFactor, y);
            y += 2;
            
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(4.5);
            tableData.forEach((row, idx) => {
                if (y > maxY - 15) {
                    pdf.addPage();
                    y = 20;
                    
                    pdf.setFontSize(13);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text('7. Energy Table (Continued)', margin, y);
                    y += 8;
                    
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(5);
                    x = margin;
                    headerTexts.forEach((header, i) => {
                        const colWidth = colWidths[i] * scaleFactor;
                        pdf.text(header.substring(0, 8), x, y);
                        x += colWidth;
                    });
                    y += cellHeight + 2;
                    pdf.setLineWidth(0.3);
                    pdf.line(margin, y, margin + totalWidth * scaleFactor, y);
                    y += 2;
                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(4.5);
                }
                
                x = margin;
                row.forEach((cell, i) => {
                    const colWidth = colWidths[i] * scaleFactor;
                    pdf.text(cell.substring(0, 8), x, y);
                    x += colWidth;
                });
                y += cellHeight;
            });
        } else {
            pdf.text('Table not available', margin, y);
        }
        
        if (isHBuilderApp()) {
            await savePdfForApp(pdf);
        } else {
            pdf.save('energy-consumption-report.pdf');
        }
        
        })(); // 结束 exportPromise IIFE
        
        await Promise.race([exportPromise, timeoutPromise]);
        
        restoreButton(originalText);
        
    } catch (error) {
        console.error('PDF export error:', error);
        
        if (error.message === 'PDF_EXPORT_TIMEOUT') {
            restoreButton('📄 导出 PDF 报告');
            if (isHBuilderApp()) {
                plus.nativeUI.alert('PDF export timeout, please retry');
            } else {
                alert('PDF export timeout, please retry');
            }
        } else {
            restoreButton('📄 导出 PDF 报告');
            if (isHBuilderApp()) {
                plus.nativeUI.alert('PDF export failed, please retry: ' + (error.message || error));
            } else {
                alert('PDF export failed, please retry: ' + error.message);
            }
        }
    }
}
*/

async function openReport() {
    const productKey = 'e6_report';
    if (!checkPurchaseStatus(productKey)) {
        console.log('[Report] User not purchased, showing purchase modal');
        showPurchaseModal(productKey);
        return;
    }

    const exportBtn = document.getElementById('exportPdfBtn');
    if (!exportBtn) return;
    const originalText = exportBtn.textContent;
    exportBtn.textContent = '⏳ Generating...';
    exportBtn.disabled = true;
    
    function restoreButton() {
        exportBtn.textContent = originalText;
        exportBtn.disabled = false;
    }
    
    function getCanvasData(canvasId) {
        try {
            const canvas = document.getElementById(canvasId);
            if (!canvas || canvas.width === 0 || canvas.height === 0) {
                console.warn(`Canvas ${canvasId} is invalid or has zero dimensions`);
                return '';
            }
            const dataUrl = canvas.toDataURL('image/png', 0.9);
            if (dataUrl && dataUrl.startsWith('data:image/png;base64,')) {
                return dataUrl;
            }
            console.warn(`Failed to get valid data URL for ${canvasId}`);
            return '';
        } catch (e) {
            console.error(`Error getting canvas data for ${canvasId}:`, e);
            return '';
        }
    }
    
    try {
        const energyChartPanel = document.getElementById('panel-energy-chart');
        const batteryChartPanel = document.getElementById('panel-battery-chart');
        
        const activePanel = document.querySelector('.results-tab-panel.active');
        const activePanelId = activePanel ? activePanel.id : '';
        
        if (energyChartPanel && !energyChartPanel.classList.contains('active')) {
            energyChartPanel.classList.add('active');
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (batteryChartPanel && !batteryChartPanel.classList.contains('active')) {
            batteryChartPanel.classList.add('active');
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const lightingChartPanel = document.getElementById('panel-lighting');
        if (lightingChartPanel && !lightingChartPanel.classList.contains('active')) {
            lightingChartPanel.classList.add('active');
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const reportData = {
            peakSunHours: document.getElementById('peakSunHours')?.value || '-',
            panelWattage: document.getElementById('panelWattage')?.value || '-',
            panelCount: document.getElementById('panelCount')?.value || '-',
            solarResult: document.getElementById('solarResult')?.textContent || '',
            
            batteryVoltage: document.getElementById('batteryVoltage')?.value || '-',
            batteryCapacity: document.getElementById('batteryCapacity')?.value || '-',
            batteryCount: document.getElementById('batteryCount')?.value || '-',
            batteryResult: document.getElementById('batteryResult')?.textContent || '',
            
            luminaireWattage: document.getElementById('luminaireWattage')?.value || '-',
            luminaireCount: document.getElementById('luminaireCount')?.value || '-',
            lightingDuration: document.getElementById('lightingDuration')?.value || '-',
            dimMode: document.getElementById('dimMode')?.checked ? 'Enabled' : 'Disabled',
            luminaireResult: document.getElementById('luminaireResult')?.textContent || '',
            
            batteryType: document.getElementById('batteryType')?.value || '-',
            batteryCirculation: document.getElementById('batteryCirculation')?.textContent || '-',
            batteryLifecycle: document.getElementById('batteryLifecycle')?.textContent || '-',
            
            dodValue: Math.round(currentDOD * 100),
            dodType: document.querySelector('.custom-dod-wrapper.active') ? 'custom' :
                     document.getElementById('btnLeadAcid')?.classList.contains('active') ? 'lead-acid' :
                     document.getElementById('btnLithium')?.classList.contains('active') ? 'lithium' : 'default',
            
            generatedDate: new Date().toLocaleString('zh-CN'),
            
            energyChartData: getCanvasData('energyChart'),
            batteryChartData: getCanvasData('batteryChart'),
            lightingChartData: getCanvasData('lightingChart'),
            
            tableData: getTableData()
        };
        
        document.querySelectorAll('.results-tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        if (activePanelId) {
            const originalPanel = document.getElementById(activePanelId);
            if (originalPanel) {
                originalPanel.classList.add('active');
            }
        }
        
        renderReportInModal(reportData);
        
        restoreButton();
        
    } catch (error) {
        console.error('Report generation error:', error);
        restoreButton();
        
        if (isHBuilderApp()) {
            plus.nativeUI.alert('Report generation failed, please retry: ' + (error.message || error));
        } else {
            alert('Report generation failed, please retry: ' + error.message);
        }
    }
}

function renderReportInModal(data) {
    const modalBody = document.getElementById('reportModalBody');
    const modal = document.getElementById('reportModal');
    
    modalBody.innerHTML = '';
    
    const reportHtml = `
        <div class="report-section">
            <div class="report-section-title">1. Solar Panel Information</div>
            <div class="report-info-grid">
                <div class="report-info-item">
                    <div class="report-info-label">Peak Sun Hours</div>
                    <div class="report-info-value">${data.peakSunHours || '-'} hours/day</div>
                </div>
                <div class="report-info-item">
                    <div class="report-info-label">Panel Wattage</div>
                    <div class="report-info-value">${data.panelWattage || '-'} W</div>
                </div>
                <div class="report-info-item">
                    <div class="report-info-label">Number of Panels</div>
                    <div class="report-info-value">${data.panelCount || '-'}</div>
                </div>
            </div>
            <div class="report-result-highlight">${data.solarResult || '-'}</div>
        </div>
        
        <div class="report-section">
            <div class="report-section-title">2. Battery Information</div>
            <div class="report-info-grid">
                <div class="report-info-item">
                    <div class="report-info-label">Battery Voltage</div>
                    <div class="report-info-value">${data.batteryVoltage || '-'} V</div>
                </div>
                <div class="report-info-item">
                    <div class="report-info-label">Battery Capacity</div>
                    <div class="report-info-value">${data.batteryCapacity || '-'} Ah</div>
                </div>
                <div class="report-info-item">
                    <div class="report-info-label">Number of Batteries</div>
                    <div class="report-info-value">${data.batteryCount || '-'}</div>
                </div>
            </div>
            <div class="report-result-highlight">${data.batteryResult || '-'}</div>
        </div>
        
        <div class="report-section">
            <div class="report-section-title">3. Luminaire Information</div>
            <div class="report-info-grid">
                <div class="report-info-item">
                    <div class="report-info-label">Luminaire Wattage</div>
                    <div class="report-info-value">${data.luminaireWattage || '-'} W</div>
                </div>
                <div class="report-info-item">
                    <div class="report-info-label">Number of Luminaires</div>
                    <div class="report-info-value">${data.luminaireCount || '-'}</div>
                </div>
                <div class="report-info-item">
                    <div class="report-info-label">Lighting Duration</div>
                    <div class="report-info-value">${data.lightingDuration || '-'} hours</div>
                </div>
                <div class="report-info-item">
                    <div class="report-info-label">Dimming Mode</div>
                    <div class="report-info-value">${data.dimMode || '-'}</div>
                </div>
            </div>
            <div class="report-result-highlight">${data.luminaireResult || '-'}</div>
        </div>
        
        <div class="report-section">
            <div class="report-section-title">4. Energy Chart</div>
            <div class="report-chart-container">
                ${data.energyChartData && data.energyChartData.startsWith('data:image/') ?
                    `<img src="${data.energyChartData}" alt="Energy Chart">` :
                    '<div class="report-chart-placeholder">Energy chart not available</div>'}
            </div>
        </div>
        
        <div class="report-section">
            <div class="report-section-title">5. Battery Details</div>
            <div class="report-info-grid">
                <div class="report-info-item">
                    <div class="report-info-label">Battery Type</div>
                    <div class="report-info-value">${data.batteryType === 'lead-acid' ? 'Lead Acid' : data.batteryType === 'lithium' ? 'Lithium' : '-'}</div>
                </div>
                <div class="report-info-item">
                    <div class="report-info-label">Circulation</div>
                    <div class="report-info-value">${data.batteryCirculation || '-'}</div>
                </div>
                <div class="report-info-item">
                    <div class="report-info-label">Lifecycle</div>
                    <div class="report-info-value">${data.batteryLifecycle || '-'}</div>
                </div>
            </div>
        </div>

        <div class="report-section">
            <div class="report-section-title">6. DOD Setting</div>
            <div class="report-info-grid">
                <div class="report-info-item">
                    <div class="report-info-label">Depth of Discharge</div>
                    <div class="report-info-value">${data.dodValue || '-'}%</div>
                </div>
                <div class="report-info-item">
                    <div class="report-info-label">Battery Type</div>
                    <div class="report-info-value">${data.dodType === 'custom' ? 'Custom' : data.dodType === 'lead-acid' ? 'Lead Acid' : data.dodType === 'lithium' ? 'Lithium' : 'Default'}</div>
                </div>
            </div>
        </div>
        
        <div class="report-section">
            <div class="report-section-title">7. Battery Chart</div>
            <div class="report-chart-container">
                ${data.batteryChartData && data.batteryChartData.startsWith('data:image/') ?
                    `<img src="${data.batteryChartData}" alt="Battery Chart">` :
                    '<div class="report-chart-placeholder">Battery chart not available</div>'}
            </div>
        </div>
        
        <div class="report-section">
            <div class="report-section-title">8. Lighting Chart</div>
            <div class="report-chart-container">
                ${data.lightingChartData && data.lightingChartData.startsWith('data:image/') ?
                    `<img src="${data.lightingChartData}" alt="Lighting Chart">` :
                    '<div class="report-chart-placeholder">Lighting chart not available</div>'}
            </div>
        </div>
        
        <div class="report-section">
            <div class="report-section-title">9. Energy Table</div>
            <div class="report-table-container">
                ${renderReportTable(data.tableData)}
            </div>
        </div>
        
        <div style="text-align: center; color: #999; font-size: 12px; margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee;">
            Generated: ${data.generatedDate || new Date().toLocaleString('zh-CN')}
        </div>
    `;
    
    modalBody.innerHTML = reportHtml;
    
    modal.classList.add('visible');
    
    setupReportModalClose();
}

function renderReportTable(tableData) {
    if (!tableData || !tableData.headers || !tableData.rows) {
        return '<div class="report-chart-placeholder">Table not available</div>';
    }
    
    let html = '<table class="report-table"><thead><tr>';
    tableData.headers.forEach(header => {
        html += `<th>${header}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    tableData.rows.forEach(row => {
        html += '<tr>';
        row.forEach(cell => {
            html += `<td>${cell}</td>`;
        });
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    return html;
}

function setupReportModalClose() {
    const modal = document.getElementById('reportModal');
    const closeBtn = document.getElementById('closeReportBtn');
    const reportCloseBtn = document.getElementById('reportCloseBtn');
    
    closeBtn?.addEventListener('click', function() {
        modal.classList.remove('visible');
    });
    
    reportCloseBtn?.addEventListener('click', function() {
        modal.classList.remove('visible');
    });
    
    modal?.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('visible');
        }
    });
}

function getTableData() {
    const table = document.querySelector('.energy-table');
    if (!table) return null;
    
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => {
        return th.textContent.trim().replace(/\s+/g, ' ');
    });
    
    const rows = Array.from(table.querySelectorAll('tbody tr')).map(row => {
        return Array.from(row.querySelectorAll('td')).map(cell => cell.textContent.trim());
    });
    
    return { headers, rows };
}


async function savePdfForApp(pdf) {
    return new Promise((resolve, reject) => {
        try {
            const arrayBuffer = pdf.output('arraybuffer');
            const uint8Data = new Uint8Array(arrayBuffer);

            const fileName = 'energy-consumption-report.pdf';

            plus.io.requestFileSystem(plus.io.PRIVATE_DOC, function(fs) {
                fs.root.getFile(fileName, { create: true, exclusive: false }, function(fileEntry) {
                    fileEntry.createWriter(function(writer) {

                        writer.onwriteend = function() {
                            console.log('PDF file written successfully:', fileEntry.fullPath);
                            
                            plus.runtime.openFile(
                                fileEntry.fullPath,           // 文件路径
                                null,                         // options（可选）
                                function(err) {               // 错误回调
                                    console.error('Failed to open PDF preview:', err);
                                    plus.nativeUI.alert('PDF saved, but cannot open preview');
                                }
                            );
                            resolve();
                        };

                        writer.onerror = function(e) {
                            console.error('PDF file write error:', e);
                            plus.nativeUI.alert('PDF file write failed, please retry');
                            reject(new Error('PDF file write failed'));
                        };

                        writer.write(uint8Data);

                    }, function(err) {
                        console.error('Failed to create FileWriter:', err);
                        plus.nativeUI.alert('Failed to create FileWriter, please retry');
                        reject(err);
                    });
                }, function(err) {
                    console.error('Failed to get file entry:', err);
                    plus.nativeUI.alert('Failed to create PDF file, please retry');
                    reject(err);
                });
            }, function(err) {
                console.error('Failed to request file system:', err);
                plus.nativeUI.alert('Failed to access app file system, please retry');
                reject(err);
            });

        } catch (e) {
            console.error('savePdfForApp error:', e);
            plus.nativeUI.alert('PDF export failed: ' + e.message);
            reject(e);
        }
    });
}

function showPdfShareActionSheet(filePath, resolve) {
    plus.nativeUI.actionSheet({
        title: 'PDF 已生成，请选择操作',
        cancel: '取消',
        buttons: [
            { title: '用其他应用打开' },
            { title: '分享到微信' }
        ]
    }, function(result) {
        if (result.index === 1) {
            plus.runtime.openFile({
                filename: filePath
            });
        } else if (result.index === 2) {
            plus.share.getServices(function(services) {
                let wechat = null;
                for (let i = 0; i < services.length; i++) {
                    if (services[i].id === 'weixin') {
                        wechat = services[i];
                        break;
                    }
                }
                if (wechat) {
                    wechat.send({
                        type: 'file',
                        filepath: filePath,
                        title: 'Energy Consumption Report'
                    }, function() {
                        console.log('Shared to WeChat successfully');
                    }, function(err) {
                        console.error('Failed to share to WeChat:', err);
                        plus.nativeUI.alert('Share failed, please try "Open with other apps"');
                    });
                } else {
                    plus.nativeUI.alert('WeChat share service not found, please ensure WeChat is installed');
                }
            }, function(err) {
                console.error('Failed to get share services:', err);
                plus.nativeUI.alert('Failed to get share services');
            });
        }
        if (resolve) resolve();
    });
}

async function exportCanvasToImage(canvas) {
    return new Promise((resolve) => {
        try {
            if (!canvas || canvas.width === 0 || canvas.height === 0) {
                console.warn('Canvas is invalid or has zero dimensions');
                resolve(null);
                return;
            }
            
            let dataUrl = null;
            
            try {
                dataUrl = canvas.toDataURL('image/png', 0.9);
                if (dataUrl && dataUrl.startsWith('data:image/png;base64,')) {
                    const base64Data = dataUrl.split(',')[1];
                    if (base64Data && base64Data.length > 100) {
                        resolve(dataUrl);
                        return;
                    }
                }
            } catch (e) {
                console.warn('PNG export failed, trying JPEG:', e);
            }
            
            try {
                dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                if (dataUrl && dataUrl.startsWith('data:image/jpeg;base64,')) {
                    const base64Data = dataUrl.split(',')[1];
                    if (base64Data && base64Data.length > 100) {
                        resolve(dataUrl);
                        return;
                    }
                }
            } catch (e) {
                console.warn('JPEG export failed:', e);
            }
            
            console.error('Canvas toDataURL() failed on all attempts');
            resolve(null);
            
        } catch (e) {
            console.error('Canvas export error:', e);
            resolve(null);
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeCalculator, 100);
    
    document.addEventListener('plusready', function() {
        setupPaymentQueueListener();
    });
    
    document.getElementById('pdfModalCancelBtn').addEventListener('click', function() {
        document.getElementById('pdfExportConfirmModal').classList.remove('visible');
    });
    
    document.getElementById('pdfModalConfirmBtn').addEventListener('click', function() {
        document.getElementById('pdfExportConfirmModal').classList.remove('visible');
        openReport();
    });
    
    document.getElementById('pdfExportConfirmModal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('visible');
        }
    });
    
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', function() {
            openReport();
        });
    }
});