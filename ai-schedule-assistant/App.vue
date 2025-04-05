<script>
	import { mapActions } from 'vuex'
	
	export default {
		onLaunch: function() {
			console.log('App Launch')
			
			// 初始化应用
			this.initApp()
			
			// 初始化UniPush
			// #ifdef APP-PLUS
			this.initUniPush()
			// #endif
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		},
		methods: {
			...mapActions(['initApp']),
			
			// 初始化UniPush
			initUniPush() {
				// 监听点击推送消息事件
				plus.push.addEventListener('click', (msg) => {
					// 处理点击通知的逻辑
					console.log('点击通知: ', JSON.stringify(msg))
					
					try {
						// 解析payload获取scheduleId
						const payload = msg.payload || "{}"
						const payloadObj = JSON.parse(payload)
						
						if (payloadObj.type === 'schedule_reminder' && payloadObj.scheduleId) {
							// 跳转到日程详情页
							uni.navigateTo({
								url: `/pages/schedule-detail/schedule-detail?id=${payloadObj.scheduleId}`
							})
						}
					} catch (e) {
						console.error('处理推送点击事件异常', e)
					}
				})
				
				// 监听接收推送消息事件
				plus.push.addEventListener('receive', (msg) => {
					// 处理接收通知的逻辑
					console.log('收到通知: ', JSON.stringify(msg))
				})
				
				// 获取客户端推送标识
				uni.getPushClientId({
					success: (res) => {
						console.log('获取推送标识clientId成功：' + res.cid)
						// 保存clientId到本地存储
						uni.setStorageSync('push_client_id', res.cid)
						console.log('设置 push_client_id:', res.cid)
						// 上传clientId到云端
						this.uploadPushClientId(res.cid)
					},
					fail: (err) => {
						console.error('获取推送标识clientId失败：' + JSON.stringify(err))
					}
				})
			},
			
			// 上传clientId到云端
			uploadPushClientId(clientId) {
				// 创建updateClientId云函数来保存clientId
				uniCloud.callFunction({
					name: 'updateClientId',
					data: {
						clientId: clientId
					}
				}).then(res => {
					console.log('推送标识上传成功');
				}).catch(err => {
					console.error('推送标识上传失败', err);
				})
			}
		}
	}
</script>

<style>
	/*每个页面公共css */
	/* 颜色变量 */
	:root {
		--primary-color: #4169E1;
		--secondary-color: #e8f0fe;
		--success-color: #52c41a;
		--warning-color: #faad14;
		--error-color: #f5222d;
		--border-color: #e0e0e0;
		--text-color: #333333;
		--light-text: #999999;
		--bg-color: #f9f9f9;
	}
	
	/* 基础样式 */
	page {
		background-color: var(--bg-color);
		color: var(--text-color);
		font-size: 32rpx;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
	}
	
	/* 状态栏 */
	.status-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 30rpx;
		height: 80rpx;
		background-color: #ffffff;
	}
	
	/* 页面头部 */
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx;
		background-color: #ffffff;
	}
	
	.header h1 {
		font-size: 40rpx;
		font-weight: 600;
		margin: 0;
	}
	
	.back-button {
		color: var(--text-color);
		font-size: 40rpx;
	}
	
	/* 底部导航 */
	.nav-bar {
		display: flex;
		justify-content: space-around;
		align-items: center;
		padding: 20rpx 0;
		background-color: #ffffff;
		border-top: 2rpx solid var(--border-color);
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 100;
	}
	
	.nav-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		color: var(--light-text);
		font-size: 24rpx;
	}
	
	.nav-item.active {
		color: var(--primary-color);
	}
	
	/* 页面内容区 */
	.content {
		padding: 30rpx;
		padding-bottom: 150rpx;
	}
	
	/* 浮动按钮 */
	.fab-btn {
		position: fixed;
		right: 30rpx;
		bottom: 150rpx;
		width: 100rpx;
		height: 100rpx;
		border-radius: 50%;
		background-color: var(--primary-color);
		color: #ffffff;
		display: flex;
		justify-content: center;
		align-items: center;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
		z-index: 99;
	}
	
	/* 表单样式 */
	.form-group {
		margin-bottom: 30rpx;
	}
	
	.form-label {
		display: block;
		margin-bottom: 10rpx;
		font-weight: 500;
	}
	
	.form-input {
		width: 100%;
		padding: 20rpx;
		border: 2rpx solid var(--border-color);
		border-radius: 8rpx;
		background-color: #ffffff;
		font-size: 32rpx;
	}
	
	/* 按钮样式 */
	.btn {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 20rpx 30rpx;
		background-color: var(--primary-color);
		color: #ffffff;
		border-radius: 8rpx;
		font-size: 32rpx;
		font-weight: 500;
		border: none;
		cursor: pointer;
	}
	
	/* 卡片样式 */
	.card {
		background-color: #ffffff;
		border-radius: 12rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
		padding: 30rpx;
		margin-bottom: 30rpx;
	}
	
	/* 日程列表 */
	.schedule-item {
		display: flex;
		padding: 30rpx;
		background-color: #ffffff;
		border-radius: 12rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
	}
	
	.schedule-time {
		width: 120rpx;
		font-weight: 500;
		color: var(--primary-color);
	}
	
	.schedule-content {
		flex: 1;
	}
	
	.schedule-title {
		font-weight: 500;
		margin-bottom: 10rpx;
	}
	
	.schedule-location {
		color: var(--light-text);
		font-size: 28rpx;
		margin-bottom: 10rpx;
	}
	
	.alert {
		display: flex;
		align-items: center;
		padding: 10rpx;
		background-color: rgba(250, 173, 20, 0.1);
		border-radius: 6rpx;
		color: var(--warning-color);
		font-size: 24rpx;
		margin-top: 10rpx;
	}
	
	/* 标签页 */
	.tab-bar {
		display: flex;
		background-color: #ffffff;
		border-bottom: 2rpx solid var(--border-color);
		margin-bottom: 20rpx;
	}
	
	.tab {
		flex: 1;
		text-align: center;
		padding: 20rpx 0;
		color: var(--light-text);
		font-weight: 500;
	}
	
	.tab.active {
		color: var(--primary-color);
		border-bottom: 4rpx solid var(--primary-color);
	}
	
	/* 加载状态 */
	.loading-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(255, 255, 255, 0.7);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 999;
	}
	
	.loading-content {
		background-color: rgba(0, 0, 0, 0.6);
		padding: 30rpx;
		border-radius: 10rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	
	.loading-text {
		color: #ffffff;
		margin-top: 20rpx;
		font-size: 28rpx;
	}
</style>
