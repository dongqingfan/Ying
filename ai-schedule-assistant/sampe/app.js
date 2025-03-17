// 获取当前时间并更新状态栏
function updateStatusBarTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    
    const timeElements = document.querySelectorAll('.status-bar span');
    timeElements.forEach(element => {
        element.textContent = timeString;
    });
}

// 模拟图片识别功能，提取日程信息
function extractScheduleInfo(imageFile) {
    // 在实际应用中，这里应该调用AI图像识别API
    // 这里我们模拟一个识别结果
    return new Promise((resolve) => {
        setTimeout(() => {
            // 模拟识别结果
            const scheduleInfo = {
                title: "与客户会面讨论项目进展",
                date: "2023-10-20",
                startTime: "14:00",
                endTime: "15:30",
                location: "星巴克咖啡(国贸店)",
                participants: "李总、王经理",
                notes: "准备项目进度报告和演示文稿"
            };
            resolve(scheduleInfo);
        }, 1500); // 模拟1.5秒的处理时间
    });
}

// 填充表单数据
function fillFormWithScheduleInfo(info) {
    document.getElementById('schedule-title').value = info.title || '';
    document.getElementById('schedule-date').value = info.date || '';
    document.getElementById('start-time').value = info.startTime || '';
    document.getElementById('end-time').value = info.endTime || '';
    document.getElementById('location').value = info.location || '';
    document.getElementById('participants').value = info.participants || '';
    document.getElementById('notes').value = info.notes || '';
}

// 切换日历视图
function switchCalendarView(viewType) {
    const views = document.querySelectorAll('.calendar-view');
    views.forEach(view => {
        view.style.display = 'none';
    });
    
    const activeView = document.querySelector(`.${viewType}-view`);
    if (activeView) {
        activeView.style.display = 'block';
    }
}

// 当前日期
let currentDate = new Date();
let selectedDate = new Date();

// 初始化月历
function initCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // 更新标题
    const yearSelector = document.getElementById('year-selector');
    const monthSelector = document.getElementById('month-selector');
    
    if (yearSelector) yearSelector.textContent = year;
    if (monthSelector) monthSelector.textContent = month + 1;
    
    // 获取当月第一天是星期几
    const firstDay = new Date(year, month, 1).getDay();
    
    // 获取当月天数
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // 获取上个月天数
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    // 清空日历网格
    const calendarGrid = document.getElementById('calendar-grid');
    if (!calendarGrid) return;
    
    calendarGrid.innerHTML = '';
    
    // 添加上个月的日期
    for (let i = firstDay - 1; i >= 0; i--) {
        const dateDiv = document.createElement('div');
        dateDiv.className = 'calendar-date prev-month';
        dateDiv.textContent = daysInPrevMonth - i;
        calendarGrid.appendChild(dateDiv);
    }
    
    // 添加当月的日期
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    
    for (let i = 1; i <= daysInMonth; i++) {
        const dateDiv = document.createElement('div');
        dateDiv.className = 'calendar-date';
        dateDiv.textContent = i;
        
        // 如果是今天，添加today类
        if (isCurrentMonth && today.getDate() === i) {
            dateDiv.classList.add('today');
        }
        
        // 如果是选中的日期，添加selected类
        if (selectedDate.getFullYear() === year && 
            selectedDate.getMonth() === month && 
            selectedDate.getDate() === i) {
            dateDiv.classList.add('selected');
        }
        
        // 随机添加一些事件标记（实际应用中应该根据真实数据）
        if (Math.random() > 0.7) {
            dateDiv.classList.add('has-event');
        }
        
        // 添加点击事件
        dateDiv.addEventListener('click', function() {
            // 移除所有日期的选中状态
            document.querySelectorAll('.calendar-date').forEach(d => {
                d.classList.remove('selected');
            });
            
            // 添加选中状态
            this.classList.add('selected');
            
            // 更新选中的日期
            selectedDate = new Date(year, month, i);
            
            // 更新日程列表标题
            updateSelectedDateTitle();
            
            // 更新日程列表（实际应用中应该加载真实数据）
            // 这里只是简单模拟
            const selectedDateSchedules = document.getElementById('selected-date-schedules');
            if (selectedDateSchedules) {
                if (Math.random() > 0.5) {
                    selectedDateSchedules.style.display = 'block';
                } else {
                    selectedDateSchedules.innerHTML = 
                        '<div style="text-align: center; padding: 20px; color: var(--light-text);">当日无日程安排</div>';
                }
            }
        });
        
        calendarGrid.appendChild(dateDiv);
    }
    
    // 添加下个月的日期（填充到7的倍数）
    const totalCells = firstDay + daysInMonth;
    const nextMonthDays = 7 - (totalCells % 7);
    
    if (nextMonthDays < 7) {
        for (let i = 1; i <= nextMonthDays; i++) {
            const dateDiv = document.createElement('div');
            dateDiv.className = 'calendar-date next-month';
            dateDiv.textContent = i;
            calendarGrid.appendChild(dateDiv);
        }
    }
    
    // 更新选中日期的标题
    updateSelectedDateTitle();
}

// 更新选中日期的标题
function updateSelectedDateTitle() {
    const titleElement = document.getElementById('selected-date-title');
    if (!titleElement) return;
    
    const month = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();
    titleElement.textContent = `${month}月${day}日日程`;
}

// 初始化年份选择器
function initYearSelector() {
    const yearGrid = document.getElementById('year-grid');
    if (!yearGrid) return;
    
    yearGrid.innerHTML = '';
    
    const currentYear = new Date().getFullYear();
    
    // 显示当前年份前后5年
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
        const yearItem = document.createElement('div');
        yearItem.className = 'year-item';
        if (i === currentDate.getFullYear()) {
            yearItem.classList.add('selected');
        }
        yearItem.textContent = i;
        
        yearItem.addEventListener('click', function() {
            // 更新选中的年份
            currentDate.setFullYear(i);
            
            // 更新日历
            initCalendar(currentDate);
            
            // 关闭选择器
            const yearSelectorModal = document.getElementById('year-selector-modal');
            if (yearSelectorModal) {
                yearSelectorModal.style.display = 'none';
            }
        });
        
        yearGrid.appendChild(yearItem);
    }
}

// 初始化月份选择器
function initMonthSelector() {
    const monthItems = document.querySelectorAll('.month-item');
    if (monthItems.length === 0) return;
    
    monthItems.forEach((item, index) => {
        // 清除已有的selected类
        item.classList.remove('selected');
        
        // 如果是当前月份，添加selected类
        if (index === currentDate.getMonth()) {
            item.classList.add('selected');
        }
        
        // 添加点击事件
        item.addEventListener('click', function() {
            // 更新选中的月份
            currentDate.setMonth(index);
            
            // 更新日历
            initCalendar(currentDate);
            
            // 关闭选择器
            const monthSelectorModal = document.getElementById('month-selector-modal');
            if (monthSelectorModal) {
                monthSelectorModal.style.display = 'none';
            }
        });
    });
}

// 为标签页添加点击事件
function initTabSwitching() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // 移除所有标签的激活状态
            tabs.forEach(t => t.classList.remove('active'));
            // 添加激活状态到当前点击的标签
            this.classList.add('active');
            
            // 切换视图
            const viewType = this.getAttribute('data-view');
            if (viewType === 'today') {
                document.getElementById('today-view').style.display = 'block';
                document.getElementById('week-view').style.display = 'none';
            } else if (viewType === 'week') {
                document.getElementById('today-view').style.display = 'none';
                document.getElementById('week-view').style.display = 'block';
            }
        });
    });
}

// 初始化滑动手势
function initSwipeGesture(element, onSwipeLeft, onSwipeRight) {
    let startX, startY, endX, endY;
    const minDistance = 50; // 最小滑动距离
    const maxVerticalDistance = 100; // 最大垂直滑动距离
    
    element.addEventListener('touchstart', function(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    });
    
    element.addEventListener('touchend', function(e) {
        endX = e.changedTouches[0].clientX;
        endY = e.changedTouches[0].clientY;
        
        const horizontalDistance = endX - startX;
        const verticalDistance = Math.abs(endY - startY);
        
        // 如果垂直滑动距离太大，不视为水平滑动
        if (verticalDistance > maxVerticalDistance) return;
        
        if (horizontalDistance > minDistance) {
            // 向右滑动
            if (onSwipeRight) onSwipeRight();
        } else if (horizontalDistance < -minDistance) {
            // 向左滑动
            if (onSwipeLeft) onSwipeLeft();
        }
    });
}

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    // 更新状态栏时间
    updateStatusBarTime();
    setInterval(updateStatusBarTime, 60000); // 每分钟更新一次
    
    // 初始化标签切换
    initTabSwitching();
    
    // 初始化月历
    if (document.getElementById('calendar-grid')) {
        initCalendar(currentDate);
    }
    
    // 初始化年份选择器
    initYearSelector();
    
    // 初始化月份选择器
    initMonthSelector();
    
    // 为年份选择器添加点击事件
    const yearSelector = document.getElementById('year-selector');
    const yearSelectorModal = document.getElementById('year-selector-modal');
    const closeYearSelector = document.getElementById('close-year-selector');
    
    if (yearSelector && yearSelectorModal) {
        yearSelector.addEventListener('click', function() {
            yearSelectorModal.style.display = 'flex';
        });
    }
    
    if (closeYearSelector && yearSelectorModal) {
        closeYearSelector.addEventListener('click', function() {
            yearSelectorModal.style.display = 'none';
        });
    }
    
    // 为月份选择器添加点击事件
    const monthSelector = document.getElementById('month-selector');
    const monthSelectorModal = document.getElementById('month-selector-modal');
    const closeMonthSelector = document.getElementById('close-month-selector');
    
    if (monthSelector && monthSelectorModal) {
        monthSelector.addEventListener('click', function() {
            monthSelectorModal.style.display = 'flex';
        });
    }
    
    if (closeMonthSelector && monthSelectorModal) {
        closeMonthSelector.addEventListener('click', function() {
            monthSelectorModal.style.display = 'none';
        });
    }
    
    // 初始化月历滑动手势
    const monthView = document.getElementById('month-view');
    if (monthView) {
        initSwipeGesture(
            monthView,
            function() { // 向左滑动，显示下一月
                const nextMonthDate = new Date(currentDate);
                nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
                currentDate = nextMonthDate;
                initCalendar(currentDate);
            },
            function() { // 向右滑动，显示前一月
                const prevMonthDate = new Date(currentDate);
                prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
                currentDate = prevMonthDate;
                initCalendar(currentDate);
            }
        );
    }
    
    // 月历导航按钮事件
    const prevMonth = document.getElementById('prev-month');
    const nextMonth = document.getElementById('next-month');
    
    if (prevMonth) {
        prevMonth.addEventListener('click', function() {
            const prevMonthDate = new Date(currentDate);
            prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
            currentDate = prevMonthDate;
            initCalendar(currentDate);
        });
    }
    
    if (nextMonth) {
        nextMonth.addEventListener('click', function() {
            const nextMonthDate = new Date(currentDate);
            nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
            currentDate = nextMonthDate;
            initCalendar(currentDate);
        });
    }
    
    // 文本识别按钮点击事件
    const textRecognizeBtn = document.getElementById('text-recognize-btn');
    if (textRecognizeBtn) {
        textRecognizeBtn.addEventListener('click', function() {
            const scheduleText = document.getElementById('schedule-text').value;
            if (!scheduleText) {
                alert('请先粘贴日程信息');
                return;
            }
            
            // 模拟识别过程
            textRecognizeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 识别中...';
            textRecognizeBtn.disabled = true;
            
            setTimeout(() => {
                // 模拟识别结果
                const scheduleInfo = {
                    title: "产品团队周会",
                    date: "2023-10-18",
                    startTime: "09:30",
                    endTime: "11:00",
                    location: "公司会议室A",
                    participants: "产品部全体成员",
                    notes: "讨论新功能开发计划和进度"
                };
                
                // 填充表单
                fillFormWithScheduleInfo(scheduleInfo);
                
                // 恢复按钮状态
                textRecognizeBtn.innerHTML = '<i class="fas fa-magic"></i> 自动识别填写';
                textRecognizeBtn.disabled = false;
                
                // 显示成功提示
                alert('识别成功，已自动填写日程信息');
            }, 1500);
        });
    }
}); 