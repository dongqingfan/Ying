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
			<text class="icon iconfont icon-back" @tap="goBack"></text>
			<text style="font-size: 40rpx; font-weight: bold;">日程详情</text>
			<text class="icon iconfont icon-edit" @tap="editSchedule"></text>
		</view>
		
		<view class="content" v-if="schedule">
			<!-- 日程标题和时间 -->
			<view class="detail-card">
				<text class="schedule-detail-title">{{ schedule.title }}</text>
				<view class="time-location">
					<view class="detail-time">
						<text class="icon iconfont icon-time"></text>
						<text>{{ formatDate(schedule.date) }} {{ schedule.startTime }} - {{ schedule.endTime }}</text>
					</view>
					<view class="detail-location" v-if="schedule.location">
						<text class="icon iconfont icon-location"></text>
						<text>{{ schedule.location }}</text>
					</view>
				</view>
			</view>
			
			<!-- 参与人信息 -->
			<view class="detail-card" v-if="schedule.participants">
				<view class="detail-section-title">参与人</view>
				<view class="detail-content">{{ schedule.participants }}</view>
			</view>
			
			<!-- 备注信息 -->
			<view class="detail-card" v-if="schedule.notes">
				<view class="detail-section-title">备注</view>
				<view class="detail-content">{{ schedule.notes }}</view>
			</view>
			
			<!-- 天气信息 -->
			<view class="detail-card" v-if="schedule.weatherAnalysis && weatherInfo">
				<view class="detail-section-title">天气信息</view>
				<view class="weather-info">
					<view class="weather-main">
						<text class="weather-icon" :class="getWeatherIconClass()"></text>
						<view class="weather-temp">
							<text>{{ weatherInfo.temperature }}°C</text>
							<text class="weather-desc">{{ weatherInfo.description }}</text>
						</view>
					</view>
					<view class="weather-details">
						<view class="weather-item">
							<text class="icon iconfont icon-wind"></text>
							<text>{{ weatherInfo.wind }}</text>
						</view>
						<view class="weather-item">
							<text class="icon iconfont icon-humidity"></text>
							<text>湿度 {{ weatherInfo.humidity }}%</text>
						</view>
					</view>
					<view v-if="weatherInfo.alert" class="alert" style="margin-top: 20rpx;">
						<text class="icon iconfont icon-warning"></text>
						<text>{{ weatherInfo.alert }}</text>
					</view>
				</view>
			</view>
			
			<view class="button-group">
				<button class="btn btn-primary" @tap="editSchedule" style="width: 48%;">
					<text class="icon iconfont icon-edit"></text> 编辑日程
				</button>
				<button class="btn btn-danger" @tap="showDeleteConfirm" style="width: 48%;">
					<text class="icon iconfont icon-delete"></text> 删除日程
				</button>
			</view>
		</view>
		
		<!-- 自定义确认删除对话框 -->
		<view v-if="showDeletePopup" class="custom-popup-mask">
			<view class="custom-popup-dialog">
				<view class="custom-popup-title">确认删除</view>
				<view class="custom-popup-content">确定要删除此日程吗？此操作不可撤销。</view>
				<view class="custom-popup-buttons">
					<button class="custom-popup-button cancel" @tap="closeDeleteDialog">取消</button>
					<button class="custom-popup-button confirm" @tap="deleteSchedule">删除</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { mapGetters, mapActions } from 'vuex'
	
	export default {
		data() {
			return {
				scheduleId: '',
				weatherInfo: null,
				showDeletePopup: false
			}
		},
		computed: {
			...mapGetters(['scheduleById']),
			
			schedule() {
				return this.scheduleId ? this.scheduleById(this.scheduleId) : null
			}
		},
		onLoad(options) {
			if (options.id) {
				this.scheduleId = options.id
				
				// 加载天气信息（实际应用中应该调用天气API）
				this.loadWeatherInfo()
			} else {
				uni.showToast({
					title: '未找到日程信息',
					icon: 'none'
				})
				setTimeout(() => {
					uni.navigateBack()
				}, 1500)
			}
		},
		methods: {
			...mapActions(['removeSchedule']),
			
			// 返回上一页
			goBack() {
				uni.navigateBack()
			},
			
			// 编辑日程
			editSchedule() {
				if (this.schedule) {
					// 跳转到编辑页面
					uni.navigateTo({
						url: `/pages/add-schedule/add-schedule?id=${this.scheduleId}&edit=true`
					})
				}
			},
			
			// 显示删除确认对话框
			showDeleteConfirm() {
				this.showDeletePopup = true
			},
			
			// 关闭删除确认对话框
			closeDeleteDialog() {
				this.showDeletePopup = false
			},
			
			// 删除日程
			deleteSchedule() {
				try {
					this.closeDeleteDialog();
					// 调用 vuex action 删除日程
					if (this.scheduleId) {
						this.removeSchedule(this.scheduleId)
						
						// 提示删除成功
						uni.showToast({
							title: '日程已删除',
							icon: 'success',
							duration: 2000,
							success: () => {
								// 延迟返回，让用户看到提示
								setTimeout(() => {
									uni.navigateBack()
								}, 2000)
							}
						})
					}
				} catch (error) {
					console.error('删除日程出错:', error)
					uni.showToast({
						title: '删除失败，请重试',
						icon: 'none'
					})
				}
			},
			
			// 格式化日期显示 (YYYY年MM月DD日)
			formatDate(dateString) {
				if (!dateString) return ''
				
				const date = new Date(dateString)
				const year = date.getFullYear()
				const month = date.getMonth() + 1
				const day = date.getDate()
				return `${year}年${month}月${day}日`
			},
			
			// 根据天气状况获取对应图标类名
			getWeatherIconClass() {
				if (!this.weatherInfo) return 'icon-sunny'
				
				const weatherType = this.weatherInfo.type
				switch (weatherType) {
					case 'sunny':
						return 'icon-sunny'
					case 'cloudy':
						return 'icon-cloudy'
					case 'rainy':
						return 'icon-rainy'
					case 'snowy':
						return 'icon-snowy'
					default:
						return 'icon-sunny'
				}
			},
			
			// 加载天气信息（模拟数据，实际应用中应该调用天气API）
			loadWeatherInfo() {
				// 模拟加载延迟
				setTimeout(() => {
					// 随机生成天气信息（实际应用中应该根据日程地点调用天气API）
					const weatherTypes = ['sunny', 'cloudy', 'rainy', 'snowy']
					const weatherDescs = ['晴', '多云', '小雨', '小雪']
					const randomIndex = Math.floor(Math.random() * weatherTypes.length)
					
					this.weatherInfo = {
						type: weatherTypes[randomIndex],
						description: weatherDescs[randomIndex],
						temperature: Math.floor(Math.random() * 25) + 5, // 5-30度
						humidity: Math.floor(Math.random() * 50) + 30, // 30-80%
						wind: `${Math.floor(Math.random() * 5) + 1}级`,
						alert: randomIndex > 1 ? '出行建议携带雨伞/防雪装备' : null // 下雨/雪时提醒
					}
				}, 500)
			}
		}
	}
</script>

<style>
	.detail-card {
		background-color: #ffffff;
		padding: 30rpx;
		border-radius: 12rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
	}
	
	.schedule-detail-title {
		font-size: 40rpx;
		font-weight: 600;
		margin-bottom: 20rpx;
		display: block;
	}
	
	.time-location {
		color: var(--light-text);
	}
	
	.detail-time, .detail-location {
		display: flex;
		align-items: center;
		margin-bottom: 10rpx;
	}
	
	.detail-time .icon, .detail-location .icon {
		margin-right: 10rpx;
		color: var(--primary-color);
	}
	
	.detail-section-title {
		font-weight: 500;
		font-size: 32rpx;
		margin-bottom: 10rpx;
		color: var(--text-color);
	}
	
	.detail-content {
		color: var(--text-color);
		line-height: 1.5;
	}
	
	.weather-info {
		padding: 10rpx 0;
	}
	
	.weather-main {
		display: flex;
		align-items: center;
		margin-bottom: 20rpx;
	}
	
	.weather-icon {
		font-size: 80rpx;
		margin-right: 30rpx;
		color: var(--primary-color);
	}
	
	.weather-temp {
		display: flex;
		flex-direction: column;
	}
	
	.weather-desc {
		font-size: 28rpx;
		color: var(--light-text);
		margin-top: 5rpx;
	}
	
	.weather-details {
		display: flex;
		justify-content: space-between;
	}
	
	.weather-item {
		display: flex;
		align-items: center;
	}
	
	.weather-item .icon {
		margin-right: 10rpx;
		color: var(--primary-color);
	}
	
	.button-group {
		display: flex;
		justify-content: space-between;
		margin-top: 40rpx;
	}
	
	.btn-primary {
		background-color: var(--primary-color);
	}
	
	.btn-danger {
		background-color: var(--error-color);
	}
	
	/* 自定义弹窗样式 */
	.custom-popup-mask {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 999;
	}
	
	.custom-popup-dialog {
		width: 75%;
		background-color: #ffffff;
		border-radius: 12rpx;
		overflow: hidden;
	}
	
	.custom-popup-title {
		padding: 30rpx;
		font-size: 36rpx;
		font-weight: 500;
		text-align: center;
		border-bottom: 1rpx solid #eee;
	}
	
	.custom-popup-content {
		padding: 40rpx 30rpx;
		text-align: center;
		color: #666;
	}
	
	.custom-popup-buttons {
		display: flex;
		border-top: 1rpx solid #eee;
	}
	
	.custom-popup-button {
		flex: 1;
		height: 90rpx;
		line-height: 90rpx;
		text-align: center;
		font-size: 32rpx;
		background-color: #ffffff;
		border: none;
	}
	
	.custom-popup-button.cancel {
		border-right: 1rpx solid #eee;
		color: #999;
	}
	
	.custom-popup-button.confirm {
		color: var(--error-color);
		font-weight: 500;
	}
	
	/* 图标样式 */
	.icon-back:before {
		content: '\e6c8';
	}
	
	.icon-edit:before {
		content: '\e6c0';
	}
	
	.icon-delete:before {
		content: '\e6c4';
	}
	
	.icon-time:before {
		content: '\e6ce';
	}
	
	.icon-location:before {
		content: '\e650';
	}
	
	.icon-wind:before {
		content: '\e6a7';
	}
	
	.icon-humidity:before {
		content: '\e6a8';
	}
	
	.icon-warning:before {
		content: '\e64e';
	}
	
	.icon-sunny:before {
		content: '\e6a9';
	}
	
	.icon-cloudy:before {
		content: '\e6aa';
	}
	
	.icon-rainy:before {
		content: '\e6ab';
	}
	
	.icon-snowy:before {
		content: '\e6ac';
	}
</style> 