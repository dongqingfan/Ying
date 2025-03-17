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
			<text style="font-size: 40rpx; font-weight: bold;display: none;">{{ currentCity }}</text>
			<text class="icon iconfont icon-search" style="font-size: 40rpx;"></text>
		</view>
		
		<!-- 今日/本周切换标签 -->
		<view class="tab-bar">
			<view class="tab" :class="{ active: activeTab === 'today' }" @tap="switchTab('today')">今日</view>
			<view class="tab" :class="{ active: activeTab === 'week' }" @tap="switchTab('week')">本周</view>
		</view>
		
		<view class="content">
			<!-- 今日日程视图 -->
			<view v-if="activeTab === 'today'" class="schedule-view">
				<view v-if="todaySchedules.length === 0" class="empty-tip">
					<text>今日暂无日程安排</text>
				</view>
				<view v-else>
					<view v-for="(schedule, index) in todaySchedules" :key="index" class="schedule-item" @tap="goToDetail(schedule.id)">
						<view class="schedule-time">{{ formatTime(schedule.startTime) }}</view>
						<view class="schedule-content">
							<view class="schedule-title">{{ schedule.title }}</view>
							<view class="schedule-location" v-if="schedule.location">
								<text class="icon iconfont icon-location"></text> {{ schedule.location }}
							</view>
							<view class="alert" v-if="schedule.weatherAlert">
								<text class="icon iconfont icon-warning"></text>
								<text>{{ schedule.weatherAlert }}</text>
							</view>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 本周日程视图 -->
			<view v-if="activeTab === 'week'" class="schedule-view">
				<view v-if="weekSchedules.length === 0" class="empty-tip">
					<text>本周暂无日程安排</text>
				</view>
				<view v-else>
					<view v-for="(schedule, index) in weekSchedules" :key="index" class="schedule-item" @tap="goToDetail(schedule.id)">
						<view class="schedule-time">
							{{ formatWeekDay(schedule.date) }}<br>{{ formatDate(schedule.date) }}
						</view>
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
		
		<!-- 添加日程按钮 -->
		<view class="fab-btn" @tap="goToAddSchedule">
			<text class="icon iconfont icon-add"></text>
		</view>
	</view>
</template>

<script>
	import { mapGetters, mapActions } from 'vuex'
	
	export default {
		data() {
			return {
				title: 'AI日程管理小助理',
				activeTab: 'today',
				currentCity: '加载中...'
			}
		},
		computed: {
			...mapGetters(['todaySchedules', 'weekSchedules'])
		},
		onLoad() {
			// 从本地存储加载日程数据
			this.loadSchedules()
			
			// 获取当前城市
			this.getCurrentCity()
		},
		onShow() {
			// 页面显示时刷新数据
			this.loadSchedules()
			
			// 每次显示页面时刷新城市信息
			this.getCurrentCity()
		},
		methods: {
			...mapActions(['loadSchedules']),
			
			// 切换标签
			switchTab(tab) {
				this.activeTab = tab
			},
			
			// 跳转到添加日程页面
			goToAddSchedule() {
				uni.navigateTo({
					url: '/pages/add-schedule/add-schedule'
				})
			},
			
			// 跳转到日程详情页面
			goToDetail(id) {
				uni.navigateTo({
					url: `/pages/schedule-detail/schedule-detail?id=${id}`
				})
			},
			
			// 格式化时间 (24小时制，如 14:30)
			formatTime(time) {
				return time
			},
			
			// 格式化日期 (如 10/16)
			formatDate(dateString) {
				const date = new Date(dateString)
				return `${date.getMonth() + 1}/${date.getDate()}`
			},
			
			// 格式化星期几
			formatWeekDay(dateString) {
				const date = new Date(dateString)
				const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
				return weekDays[date.getDay()]
			},
			
			// 获取当前城市
			getCurrentCity() {
				// 从本地存储获取用户城市
				const userCity = uni.getStorageSync('userCity')
				
				// 检查设置中是否开启了定位
				const settings = uni.getStorageSync('settings')
				let enableLocation = false
				
				if (settings) {
					try {
						const settingsObj = JSON.parse(settings)
						enableLocation = settingsObj.enableLocation
					} catch (e) {
						console.error('解析设置信息失败', e)
					}
				}
				
				if (enableLocation && userCity) {
					// 如果已开启定位并且有保存的城市信息
					this.currentCity = userCity
				} else {
					// 如果未启用定位或没有城市信息，则使用默认值
					this.currentCity = '北京市'
					
					// 检查是否需要请求定位
					if (enableLocation && !userCity) {
						this.requestLocationInfo()
					}
				}
			},
			
			// 请求定位信息
			requestLocationInfo() {
				uni.getLocation({
					type: 'gcj02',
					success: (res) => {
						// 保存位置信息
						uni.setStorageSync('userLocation', {
							latitude: res.latitude,
							longitude: res.longitude,
							timestamp: Date.now()
						})
						
						// 获取城市名称
						this.getLocationCity(res.latitude, res.longitude)
					},
					fail: () => {
						// 定位失败时不显示错误，使用默认城市
						this.currentCity = '北京市'
					}
				})
			},
			
			// 根据经纬度获取城市名称
			getLocationCity(latitude, longitude) {
				// 由于原生插件需要在manifest中配置，这里使用模拟方式获取城市
				// 实际项目中可以使用uniCloud的geolocation或第三方Web API如高德、腾讯位置服务
				
				// 模拟根据经纬度范围确定城市（非精确，仅用于演示）
				let cityName = '北京市'; // 默认城市
				
				// 简单判断经纬度范围来模拟城市
				if (latitude > 39 && latitude < 41 && longitude > 116 && longitude < 117) {
					cityName = '北京市';
				} else if (latitude > 30 && latitude < 32 && longitude > 121 && longitude < 122) {
					cityName = '上海市';
				} else if (latitude > 22 && latitude < 24 && longitude > 113 && longitude < 114) {
					cityName = '广州市';
				} else if (latitude > 22 && latitude < 23 && longitude > 113 && longitude < 115) {
					cityName = '深圳市';
				} else if (latitude > 29 && latitude < 31 && longitude > 119 && longitude < 121) {
					cityName = '杭州市';
				} else {
					// 如果不在预设范围内，随机选择一个城市
					const cities = ['北京市', '上海市', '广州市', '深圳市', '杭州市', '南京市', '武汉市', '成都市'];
					cityName = cities[Math.floor(Math.random() * cities.length)];
				}
				
				// 更新UI和存储城市名称
				this.currentCity = cityName;
				uni.setStorageSync('userCity', cityName);
			}
		}
	}
</script>

<style>
	.container {
		position: relative;
		min-height: 100vh;
		background-color: var(--bg-color);
	}
	
	.empty-tip {
		text-align: center;
		padding: 40rpx 0;
		color: var(--light-text);
	}
	
	/* 引入字体图标 (可替换为实际的iconfont) */
	@font-face {
		font-family: 'iconfont';
		src: url('https://at.alicdn.com/t/font_2211295_iu6ju9j65x.ttf') format('truetype');
	}
	
	.icon {
		font-family: 'iconfont';
		font-style: normal;
	}
	
	.icon-wifi:before {
		content: '\e6cf';
	}
	
	.icon-signal:before {
		content: '\e6c5';
	}
	
	.icon-battery-full:before {
		content: '\e60d';
	}
	
	.icon-search:before {
		content: '\e623';
	}
	
	.icon-location:before {
		content: '\e650';
	}
	
	.icon-warning:before {
		content: '\e64e';
	}
	
	.icon-add:before {
		content: '\e61a';
	}
</style>
