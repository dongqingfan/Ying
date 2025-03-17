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
			<text style="font-size: 40rpx; font-weight: bold;">设置</text>
		</view>
		
		<view class="content">
			<view class="settings-section">
				<view class="settings-section-title">通用设置</view>
				
				<view class="settings-item">
					<view class="settings-item-left">
						<text class="icon iconfont icon-theme"></text>
						<text>深色模式</text>
					</view>
					<switch :checked="settings.darkMode" @change="toggleDarkMode" color="var(--primary-color)" />
				</view>
				
				<view class="settings-item">
					<view class="settings-item-left">
						<text class="icon iconfont icon-notification"></text>
						<text>日程提醒</text>
					</view>
					<switch :checked="settings.enableNotification" @change="toggleNotification" color="var(--primary-color)" />
				</view>
				
				<view class="settings-item" v-if="settings.enableNotification">
					<view class="settings-item-left">
						<text class="icon iconfont icon-time"></text>
						<text>提前提醒时间</text>
					</view>
					<picker mode="selector" :range="reminderOptions" :value="settings.reminderTime" @change="onReminderChange">
						<view class="settings-item-right">
							<text>{{ reminderOptions[settings.reminderTime] }}</text>
							<text class="icon iconfont icon-right"></text>
						</view>
					</picker>
				</view>
			</view>
			
			<view class="settings-section">
				<view class="settings-section-title">天气设置</view>
				
				<view class="settings-item">
					<view class="settings-item-left">
						<text class="icon iconfont icon-weather"></text>
						<text>天气分析</text>
					</view>
					<switch :checked="settings.enableWeather" @change="toggleWeather" color="var(--primary-color)" />
				</view>
				
				<view class="settings-item">
					<view class="settings-item-left">
						<text class="icon iconfont icon-location"></text>
						<text>定位服务</text>
					</view>
					<switch :checked="settings.enableLocation" @change="toggleLocation" color="var(--primary-color)" />
				</view>
			</view>
			
			<view class="settings-section">
				<view class="settings-section-title">数据管理</view>
				
				<view class="settings-item" @tap="exportData">
					<view class="settings-item-left">
						<text class="icon iconfont icon-export"></text>
						<text>导出日程数据</text>
					</view>
					<text class="icon iconfont icon-right"></text>
				</view>
				
				<view class="settings-item" @tap="importData">
					<view class="settings-item-left">
						<text class="icon iconfont icon-import"></text>
						<text>导入日程数据</text>
					</view>
					<text class="icon iconfont icon-right"></text>
				</view>
				
				<view class="settings-item danger" @tap="showClearDataConfirm">
					<view class="settings-item-left">
						<text class="icon iconfont icon-delete"></text>
						<text>清除所有日程</text>
					</view>
					<text class="icon iconfont icon-right"></text>
				</view>
			</view>
			
			<view class="settings-section">
				<view class="settings-section-title">关于</view>
				
				<view class="settings-item">
					<view class="settings-item-left">
						<text class="icon iconfont icon-info"></text>
						<text>版本</text>
					</view>
					<text>1.0.0</text>
				</view>
				
				<view class="settings-item" @tap="showFeedback">
					<view class="settings-item-left">
						<text class="icon iconfont icon-feedback"></text>
						<text>意见反馈</text>
					</view>
					<text class="icon iconfont icon-right"></text>
				</view>
			</view>
		</view>
		
		<!-- 确认清除数据对话框 -->
		<uni-popup ref="clearDataConfirm" type="dialog">
			<uni-popup-dialog 
				title="确认清除" 
				content="确定要清除所有日程数据吗？此操作不可撤销。" 
				@confirm="clearAllData" 
				@close="closeClearDataDialog"
				confirmText="清除"
				cancelText="取消">
			</uni-popup-dialog>
		</uni-popup>
	</view>
</template>

<script>
	import { mapGetters, mapActions } from 'vuex'
	
	export default {
		data() {
			return {
				settings: {
					darkMode: false,
					enableNotification: true,
					reminderTime: 1, // 0: 不提醒, 1: 提前15分钟, 2: 提前30分钟, 3: 提前1小时, 4: 提前1天
					enableWeather: true,
					enableLocation: true
				},
				reminderOptions: [
					'不提醒',
					'提前15分钟',
					'提前30分钟',
					'提前1小时',
					'提前1天'
				]
			}
		},
		onLoad() {
			// 加载设置
			this.loadSettings()
		},
		methods: {
			...mapActions(['loadSchedules']),
			
			// 加载设置
			loadSettings() {
				const savedSettings = uni.getStorageSync('settings')
				if (savedSettings) {
					this.settings = JSON.parse(savedSettings)
				}
			},
			
			// 保存设置
			saveSettings() {
				uni.setStorageSync('settings', JSON.stringify(this.settings))
			},
			
			// 切换深色模式
			toggleDarkMode(e) {
				this.settings.darkMode = e.detail.value
				this.saveSettings()
				
				// 实际应用中这里应该应用深色模式样式
				uni.showToast({
					title: this.settings.darkMode ? '已开启深色模式' : '已关闭深色模式',
					icon: 'none'
				})
			},
			
			// 切换通知
			toggleNotification(e) {
				this.settings.enableNotification = e.detail.value
				this.saveSettings()
			},
			
			// 切换天气分析
			toggleWeather(e) {
				this.settings.enableWeather = e.detail.value
				this.saveSettings()
			},
			
			// 切换定位服务
			toggleLocation(e) {
				this.settings.enableLocation = e.detail.value
				this.saveSettings()
				
				if (this.settings.enableLocation) {
					// 请求定位权限并获取位置信息
					uni.getLocation({
						type: 'gcj02',
						success: (res) => {
							// 保存经纬度信息到全局配置
							uni.setStorageSync('userLocation', {
								latitude: res.latitude,
								longitude: res.longitude,
								timestamp: Date.now()
							})
							
							uni.showToast({
								title: '已开启定位服务',
								icon: 'success'
							})
							
							// 获取城市名称
							this.getLocationCity(res.latitude, res.longitude)
						},
						fail: (err) => {
							// 如果获取位置失败，关闭位置开关
							this.settings.enableLocation = false
							this.saveSettings()
							
							uni.showModal({
								title: '定位失败',
								content: '无法获取您的位置信息，请检查是否授予了定位权限。',
								showCancel: false
							})
						}
					})
				} else {
					// 清除位置信息
					uni.removeStorageSync('userLocation')
					uni.removeStorageSync('userCity')
				}
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
				
				// 保存城市名称
				uni.setStorageSync('userCity', cityName);
				
				// 显示提示
				uni.showToast({
					title: `定位城市：${cityName}`,
					icon: 'none',
					duration: 2000
				});
			},
			
			// 提醒时间变化处理
			onReminderChange(e) {
				this.settings.reminderTime = parseInt(e.detail.value)
				this.saveSettings()
			},
			
			// 导出数据
			exportData() {
				const schedules = uni.getStorageSync('schedules') || []
				
				if (schedules.length === 0) {
					uni.showToast({
						title: '暂无日程数据可导出',
						icon: 'none'
					})
					return
				}
				
				// 实际应用中这里应该实现导出功能
				// 例如生成JSON文件并提供下载
				uni.showToast({
					title: '导出功能开发中',
					icon: 'none'
				})
			},
			
			// 导入数据
			importData() {
				// 实际应用中这里应该实现导入功能
				// 例如选择JSON文件并解析
				uni.showToast({
					title: '导入功能开发中',
					icon: 'none'
				})
			},
			
			// 显示清除数据确认对话框
			showClearDataConfirm() {
				this.$refs.clearDataConfirm.open()
			},
			
			// 关闭清除数据确认对话框
			closeClearDataDialog() {
				this.$refs.clearDataConfirm.close()
			},
			
			// 清除所有数据
			clearAllData() {
				// 清除日程数据
				uni.setStorageSync('schedules', [])
				
				// 提示清除成功
				uni.showToast({
					title: '已清除所有日程数据',
					icon: 'success'
				})
				
				// 关闭对话框
				this.closeClearDataDialog()
			},
			
			// 显示反馈
			showFeedback() {
				uni.showToast({
					title: '反馈功能开发中',
					icon: 'none'
				})
			}
		}
	}
</script>

<style>
	.settings-section {
		margin-bottom: 30rpx;
	}
	
	.settings-section-title {
		font-size: 28rpx;
		color: var(--light-text);
		margin-bottom: 10rpx;
		padding: 0 20rpx;
	}
	
	.settings-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx 20rpx;
		background-color: #ffffff;
		border-bottom: 1rpx solid var(--border-color);
	}
	
	.settings-item:last-child {
		border-bottom: none;
	}
	
	.settings-item-left {
		display: flex;
		align-items: center;
	}
	
	.settings-item-left .icon {
		margin-right: 20rpx;
		font-size: 40rpx;
		color: var(--primary-color);
	}
	
	.settings-item-right {
		display: flex;
		align-items: center;
		color: var(--light-text);
	}
	
	.settings-item-right .icon {
		margin-left: 10rpx;
	}
	
	.settings-item.danger .icon {
		color: var(--error-color);
	}
	
	.reminder-option {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx 20rpx;
		border-bottom: 1rpx solid var(--border-color);
	}
	
	.reminder-option:last-child {
		border-bottom: none;
	}
	
	/* 图标样式 */
	.icon-theme:before {
		content: '\e6a0';
	}
	
	.icon-notification:before {
		content: '\e6a1';
	}
	
	.icon-weather:before {
		content: '\e6a2';
	}
	
	.icon-location:before {
		content: '\e650';
	}
	
	.icon-export:before {
		content: '\e6a3';
	}
	
	.icon-import:before {
		content: '\e6a4';
	}
	
	.icon-delete:before {
		content: '\e6c4';
	}
	
	.icon-info:before {
		content: '\e6a5';
	}
	
	.icon-feedback:before {
		content: '\e6a6';
	}
	
	.icon-right:before {
		content: '\e6cb';
	}
	
	.icon-close:before {
		content: '\e6c2';
	}
</style> 