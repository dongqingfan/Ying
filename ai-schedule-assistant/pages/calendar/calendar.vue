<template>
	<view class="container">
		<view class="status-bar">
			<view style="visibility: hidden;">时间占位</view>
			<view>
				<text class="icon iconfont icon-wifi"></text>
				<text class="icon iconfont icon-signal"></text>
				<text class="icon iconfont icon-battery-full"></text>
			</view>
		</view>
		
		<view class="header">
			<text style="font-size: 40rpx; font-weight: bold;">日历</text>
			<text class="icon iconfont icon-search" style="font-size: 40rpx;"></text>
		</view>
		
		<view class="content">
			<!-- 月历视图 -->
			<view class="calendar-view">
				<view class="calendar-header">
					<text class="icon iconfont icon-left" @tap="prevMonth"></text>
					<!-- 修改年月选择方式，使用内联选择器 -->
					<view class="year-month-inline-selector">
						<picker mode="date" fields="month" :value="currentYearMonth" @change="onYearMonthChange" class="year-month-picker">
							<text class="year-month-selector">{{ currentYear }}年{{ currentMonth + 1 }}月</text>
						</picker>
					</view>
					<text class="icon iconfont icon-right" @tap="nextMonth"></text>
				</view>
				
				<view class="calendar-weekdays">
					<view v-for="(day, index) in weekDays" :key="index">{{ day }}</view>
				</view>
				
				<view class="calendar-grid">
					<!-- 上个月的日期 -->
					<view v-for="(day, index) in prevMonthDays" :key="'prev-' + index" class="calendar-date prev-month">
						{{ day }}
					</view>
					
					<!-- 当月的日期 -->
					<view v-for="day in daysInMonth" :key="day" 
						class="calendar-date" 
						:class="{ 
							'today': isToday(day), 
							'selected': isSelected(day),
							'has-event': hasEvent(day)
						}"
						@tap="selectDate(day)">
						{{ day }}
					</view>
					
					<!-- 下个月的日期 -->
					<view v-for="(day, index) in nextMonthDays" :key="'next-' + index" class="calendar-date next-month">
						{{ day }}
					</view>
				</view>
				
				<view class="selected-date-schedules">
					<view class="selected-date-title">{{ formattedSelectedDate }}日程</view>
					
					<view v-if="selectedDateSchedules.length === 0" class="empty-schedule">
						<view class="empty-schedule-content">
							<!-- <view class="empty-icon">
								<text class="icon iconfont icon-calendar"></text>
							</view> -->
							<text class="empty-text">当日无日程安排</text>
							<text class="empty-tip">点击右下角"+"添加日程</text>
						</view>
					</view>
					
					<view v-else>
						<view v-for="(schedule, index) in selectedDateSchedules" :key="index" 
							class="schedule-item" @tap="goToDetail(schedule.id)">
							<view class="schedule-time">{{ formatTime(schedule.startTime) }}</view>
							<view class="schedule-content">
								<view class="schedule-title">{{ schedule.title }}</view>
								<view class="schedule-location" v-if="schedule.location">
									<text class="icon iconfont icon-location"></text> {{ schedule.location }}
								</view>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 添加日程按钮 -->
		<view class="fab-btn" @tap="goToAddSchedule">
			<text class="icon iconfont icon-add"></text>
		</view>
	</view>
</template>

<script>
	import { mapGetters, mapActions, mapMutations } from 'vuex'
	
	export default {
		data() {
			const now = new Date()
			return {
				weekDays: ['日', '一', '二', '三', '四', '五', '六'],
				currentYear: now.getFullYear(),
				currentMonth: now.getMonth(),
				selectedDay: now.getDate(),
				prevMonthDays: [],
				nextMonthDays: [],
				daysInMonth: 0
			}
		},
		computed: {
			...mapGetters(['schedulesByDate']),
			
			// 当前年月格式化为YYYY-MM，用于日期选择器
			currentYearMonth() {
				return `${this.currentYear}-${(this.currentMonth + 1).toString().padStart(2, '0')}`
			},
			
			// 选中日期的日程
			selectedDateSchedules() {
				const selectedDate = new Date(this.currentYear, this.currentMonth, this.selectedDay)
				const dateString = this.formatDateToLocalString(selectedDate)
				return this.schedulesByDate(dateString)
			},
			
			// 格式化选中的日期
			formattedSelectedDate() {
				return `${this.currentMonth + 1}月${this.selectedDay}日`
			}
		},
		onLoad() {
			// 从本地存储加载日程数据
			this.loadSchedules()
			
			// 初始化日历
			this.initCalendar()
		},
		onShow() {
			// 页面显示时刷新数据
			this.loadSchedules()
			
			// 重新初始化日历
			this.initCalendar()
		},
		methods: {
			...mapActions(['loadSchedules']),
			...mapMutations(['setCurrentDate']),
			
			// 初始化日历
			initCalendar() {
				// 获取当月天数
				this.daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate()
				
				// 获取当月第一天是星期几
				const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay()
				
				// 获取上个月的天数
				const prevMonthDays = new Date(this.currentYear, this.currentMonth, 0).getDate()
				
				// 填充上个月的日期
				this.prevMonthDays = []
				for (let i = firstDay - 1; i >= 0; i--) {
					this.prevMonthDays.push(prevMonthDays - i)
				}
				
				// 填充下个月的日期
				const totalDays = firstDay + this.daysInMonth
				const nextMonthDaysCount = 7 - (totalDays % 7 || 7)
				
				this.nextMonthDays = []
				for (let i = 1; i <= nextMonthDaysCount; i++) {
					this.nextMonthDays.push(i)
				}
				
				// 更新vuex中的当前日期
				this.setCurrentDate(new Date(this.currentYear, this.currentMonth, this.selectedDay))
			},
			
			// 切换到上个月
			prevMonth() {
				if (this.currentMonth === 0) {
					this.currentYear--
					this.currentMonth = 11
				} else {
					this.currentMonth--
				}
				
				// 更新选中的日期
				const daysInNewMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate()
				if (this.selectedDay > daysInNewMonth) {
					this.selectedDay = daysInNewMonth
				}
				
				this.initCalendar()
			},
			
			// 切换到下个月
			nextMonth() {
				if (this.currentMonth === 11) {
					this.currentYear++
					this.currentMonth = 0
				} else {
					this.currentMonth++
				}
				
				// 更新选中的日期
				const daysInNewMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate()
				if (this.selectedDay > daysInNewMonth) {
					this.selectedDay = daysInNewMonth
				}
				
				this.initCalendar()
			},
			
			// 年月选择器变化事件处理
			onYearMonthChange(e) {
				const dateStr = e.detail.value
				const [year, month] = dateStr.split('-').map(Number)
				
				this.currentYear = year
				this.currentMonth = month - 1
				
				// 更新选中的日期
				const daysInNewMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate()
				if (this.selectedDay > daysInNewMonth) {
					this.selectedDay = daysInNewMonth
				}
				
				this.initCalendar()
			},
			
			// 选择日期
			selectDate(day) {
				this.selectedDay = day
				// 更新vuex中的当前日期
				this.setCurrentDate(new Date(this.currentYear, this.currentMonth, this.selectedDay))
			},
			
			// 判断是否是今天
			isToday(day) {
				const now = new Date()
				return now.getFullYear() === this.currentYear && 
					  now.getMonth() === this.currentMonth && 
					  now.getDate() === day
			},
			
			// 判断是否是选中的日期
			isSelected(day) {
				return this.selectedDay === day
			},
			
			// 判断日期是否有日程安排
			hasEvent(day) {
				const date = new Date(this.currentYear, this.currentMonth, day)
				const dateString = this.formatDateToLocalString(date)
				return this.schedulesByDate(dateString).length > 0
			},
			
			// 格式化日期为本地日期字符串 (YYYY-MM-DD)，避免时区问题
			formatDateToLocalString(date) {
				const year = date.getFullYear()
				const month = (date.getMonth() + 1).toString().padStart(2, '0')
				const day = date.getDate().toString().padStart(2, '0')
				return `${year}-${month}-${day}`
			},
			
			// 跳转到添加日程页面
			goToAddSchedule() {
				// 传递当前选中的日期
				const selectedDate = new Date(this.currentYear, this.currentMonth, this.selectedDay)
				const dateString = this.formatDateToLocalString(selectedDate)
				
				uni.navigateTo({
					url: `/pages/add-schedule/add-schedule?date=${dateString}`
				})
			},
			
			// 跳转到日程详情页面
			goToDetail(id) {
				uni.navigateTo({
					url: `/pages/schedule-detail/schedule-detail?id=${id}`
				})
			},
			
			// 格式化时间
			formatTime(time) {
				return time
			}
		}
	}
</script>

<style>
	.calendar-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 30rpx;
		font-size: 32rpx;
	}
	
	.year-month-selector {
		font-weight: bold;
		font-size: 34rpx;
	}
	
	/* 新增内联年月选择器样式 */
	.year-month-inline-selector {
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.year-month-picker {
		text-align: center;
	}
	
	.calendar-weekdays {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		text-align: center;
		padding: 20rpx 0;
		border-bottom: 2rpx solid var(--border-color);
		font-weight: 500;
	}
	
	.calendar-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		padding: 10rpx 0;
	}
	
	.calendar-date {
		text-align: center;
		padding: 20rpx 0;
		position: relative;
	}
	
	.calendar-date.prev-month,
	.calendar-date.next-month {
		color: var(--light-text);
		opacity: 0.6;
	}
	
	.calendar-date.today {
		color: var(--primary-color);
		font-weight: bold;
	}
	
	.calendar-date.selected {
		background-color: var(--primary-color);
		color: #ffffff;
		border-radius: 8rpx;
	}
	
	.calendar-date.has-event::after {
		content: '';
		display: block;
		position: absolute;
		bottom: 10rpx;
		left: 50%;
		transform: translateX(-50%);
		width: 8rpx;
		height: 8rpx;
		border-radius: 50%;
		background-color: var(--primary-color);
	}
	
	.selected-date-schedules {
		margin-top: 30rpx;
	}
	
	.selected-date-title {
		font-size: 34rpx;
		font-weight: 500;
		margin-bottom: 20rpx;
	}
	
	/* 优化空日程视图样式 */
	.empty-schedule {
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #ffffff;
		border-radius: 12rpx;
		margin: 20rpx 0;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
		height: 320rpx; /* 设置固定高度 */
	}
	
	.empty-schedule-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	
	.empty-icon {
		font-size: 80rpx;
		color: var(--light-text);
		margin-bottom: 20rpx;
	}
	
	.empty-text {
		font-size: 32rpx;
		color: var(--text-color);
		margin-bottom: 10rpx;
	}
	
	.empty-tip {
		font-size: 28rpx;
		color: var(--light-text);
	}
	
	/* 图标样式 */
	.icon-left:before {
		content: '\e6c9';
	}
	
	.icon-right:before {
		content: '\e6cb';
	}
	
	.icon-calendar:before {
		content: '\e6cf';
	}
</style> 