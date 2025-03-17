<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
			// 初始化日程数据存储
			if (!uni.getStorageSync('schedules')) {
				uni.setStorageSync('schedules', [])
			}
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
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
</style>
