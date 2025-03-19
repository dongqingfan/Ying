<template>
	<view class="container">
		<!-- 固定在顶部的状态栏和标题栏 -->
		<view class="fixed-top">
			<view class="status-bar">
				<view style="visibility: hidden;">时间占位</view>
				<view>
					<text class="icon iconfont icon-wifi"></text>
					<text class="icon iconfont icon-signal"></text>
					<text class="icon iconfont icon-battery-full"></text>
				</view>
			</view>
			
			<view class="header">
				<view class="back-button" @tap="goBack">
					<text class="iconfont icon-back"></text>
				</view>
				<text style="font-size: 40rpx; font-weight: bold;">{{ isEditMode ? '编辑日程' : '添加日程' }}</text>
				<text style="color: var(--primary-color); font-weight: 500;" @tap="saveSchedule">保存</text>
			</view>
		</view>
		
		<!-- 内容区域，添加顶部padding以避免被固定头部遮挡 -->
		<view class="content">
			<view class="card" style="margin-bottom: 20rpx; padding: 30rpx;">
				<view v-if="showImagePreview" style="margin-bottom: 30rpx;">
					<image :src="uploadedImageUrl" style="max-width: 100%; max-height: 400rpx; border-radius: 16rpx;"></image>
					<view style="margin-top: 20rpx; color: var(--success-color);">
						<text class="iconfont icon-check-circle"></text> 识别成功，已自动填写日程信息
					</view>
				</view>
				
				<view class="form-group" style="margin-bottom: 20rpx;">
					<label class="form-label">粘贴日程信息</label>
					<textarea v-model="scheduleText" class="form-input textarea" style="height: 200rpx;" placeholder="在此粘贴日程信息文本，如会议邀请、邮件内容等"></textarea>
				</view>
				
				<view style="display: flex; gap: 20rpx;">
					<button class="btn" @tap="recognizeText" style="flex: 1;">
						<text class="iconfont icon-magic"></text> 自动识别填写
					</button>
					<button class="btn" @tap="chooseImage" style="flex: 1; background-color: var(--secondary-color); color: var(--primary-color);">
						<text class="iconfont icon-image"></text> 上传图片识别
					</button>
				</view>
			</view>
			
			<view class="form-group">
				<label class="form-label">日程标题</label>
				<input type="text" v-model="schedule.title" class="form-input input-field" placeholder="输入日程标题" />
			</view>
			
			<view class="form-group">
				<label class="form-label">日期</label>
				<picker mode="date" :value="schedule.date" @change="onDateChange" class="form-input date-picker">
					<view class="picker-value">{{ formatDate(schedule.date) }}</view>
				</picker>
			</view>
			
			<view style="display: flex; gap: 20rpx;">
				<view class="form-group" style="flex: 1;">
					<label class="form-label">开始时间</label>
					<picker mode="time" :value="schedule.startTime" @change="onStartTimeChange" class="form-input time-picker">
						<view class="picker-value">{{ schedule.startTime }}</view>
					</picker>
				</view>
				<view class="form-group" style="flex: 1;">
					<label class="form-label">结束时间</label>
					<picker mode="time" :value="schedule.endTime" @change="onEndTimeChange" class="form-input time-picker">
						<view class="picker-value">{{ schedule.endTime }}</view>
					</picker>
				</view>
			</view>
			
			<view class="form-group">
				<label class="form-label">地点</label>
				<input type="text" v-model="schedule.location" class="form-input input-field" placeholder="输入地点" />
			</view>
			
			<view class="form-group">
				<label class="form-label">参与人</label>
				<input type="text" v-model="schedule.participants" class="form-input input-field" placeholder="输入参与人" />
			</view>
			
			<view class="form-group">
				<label class="form-label">备注</label>
				<textarea v-model="schedule.notes" class="form-input textarea" style="height: 160rpx;" placeholder="输入备注信息"></textarea>
			</view>
			
			<view class="form-group">
				<label class="form-label">天气分析</label>
				<view style="display: flex; align-items: center;">
					<switch :checked="schedule.weatherAnalysis" @change="toggleWeatherAnalysis" color="var(--primary-color)" />
					<text style="margin-left: 20rpx; font-size: 28rpx;">启用目的地天气分析</text>
				</view>
			</view>
			
			<button class="btn" @tap="saveSchedule" style="width: 100%; margin-top: 20rpx; margin-bottom: 120rpx;">
				<text class="iconfont icon-save"></text> 保存日程
			</button>
		</view>
	</view>
</template>

<script>
	import { mapActions } from 'vuex'
	
	export default {
		data() {
			const now = new Date()
			const currentYear = now.getFullYear()
			const currentMonth = now.getMonth()
			const currentDay = now.getDate()
			
			// 设置默认日程信息
			const defaultDate = this.formatDateString(now)
			const defaultStartHour = now.getHours().toString().padStart(2, '0')
			const defaultStartMinute = (Math.ceil(now.getMinutes() / 15) * 15 % 60).toString().padStart(2, '0')
			
			let defaultEndTime = new Date(now)
			defaultEndTime.setHours(now.getHours() + 1)
			defaultEndTime.setMinutes(Math.ceil(now.getMinutes() / 15) * 15 % 60)
			const defaultEndHour = defaultEndTime.getHours().toString().padStart(2, '0')
			const defaultEndMinute = defaultEndTime.getMinutes().toString().padStart(2, '0')
			
			return {
				scheduleText: '',
				uploadedImageUrl: '',
				showImagePreview: false,
				isEditMode: false, // 是否是编辑模式
				scheduleId: '', // 编辑中的日程ID
				
				// 日程信息
				schedule: {
					title: '',
					date: defaultDate,
					startTime: `${defaultStartHour}:${defaultStartMinute}`,
					endTime: `${defaultEndHour}:${defaultEndMinute}`,
					location: '',
					participants: '',
					notes: '',
					weatherAnalysis: true
				}
			}
		},
		onLoad(options) {
			// 如果有传递日期参数，更新日程日期
			if (options.date) {
				this.schedule.date = options.date
			}
			
			// 如果是编辑模式，加载现有日程信息
			if (options.id && options.edit === 'true') {
				// 获取要编辑的日程
				const scheduleToEdit = this.$store.getters.scheduleById(options.id)
				
				if (scheduleToEdit) {
					// 设置为编辑模式
					this.isEditMode = true
					this.scheduleId = options.id
					
					// 复制日程数据到表单
					this.schedule = { ...scheduleToEdit }
				}
			}
		},
		methods: {
			...mapActions(['addNewSchedule', 'updateExistingSchedule']),
			
			// 返回上一页
			goBack() {
				uni.navigateBack()
			},
			
			// 保存日程
			saveSchedule() {
				// 表单验证
				if (!this.schedule.title) {
					uni.showToast({
						title: '请输入日程标题',
						icon: 'none'
					})
					return
				}
				
				if (!this.schedule.date) {
					uni.showToast({
						title: '请选择日期',
						icon: 'none'
					})
					return
				}
				
				// 根据是否是编辑模式选择操作
				if (this.isEditMode) {
					// 调用 vuex action 更新日程
					this.updateExistingSchedule(this.schedule)
					
					// 提示保存成功
					uni.showToast({
						title: '日程更新成功',
						icon: 'success',
						duration: 2000,
						success: () => {
							// 延迟返回，让用户看到提示
							setTimeout(() => {
								uni.navigateBack()
							}, 2000)
						}
					})
				} else {
					// 调用 vuex action 添加日程
					this.addNewSchedule(this.schedule)
					
					// 提示保存成功
					uni.showToast({
						title: '日程保存成功',
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
			},
			
			// 自动识别文本
			recognizeText() {
				if (!this.scheduleText) {
					uni.showToast({
						title: '请先输入日程信息文本',
						icon: 'none'
					})
					return
				}
				
				// 显示加载提示
				uni.showLoading({
					title: '识别中...'
				})
				
				// 调用云函数进行识别
				uniCloud.callFunction({
					name: 'identifyString',
					data: {
						text: this.scheduleText
					}
				}).then(res => {
					// 隐藏加载提示
					uni.hideLoading()
					console.log('云函数返回结果:', res.result)
					
					const result = res.result
					if (result.code === 0 && result.data) {
						// 提取识别结果
						const scheduleData = result.data
						console.log('提取的日程数据:', scheduleData)
						
						// 准备填充到表单的数据
						const recognizedInfo = {}
						
						// 处理标题 - 直接赋值
						if (scheduleData.title) {
							recognizedInfo.title = scheduleData.title
						}
						
						// 处理日期 - 需要转换格式
						if (scheduleData.date) {
							// 如果日期包含相对时间词
							if (typeof scheduleData.date === 'string') {
								if (scheduleData.date.includes('明天')) {
									const tomorrow = new Date()
									tomorrow.setDate(tomorrow.getDate() + 1)
									recognizedInfo.date = this.formatDateString(tomorrow)
								} else if (scheduleData.date.includes('后天')) {
									const dayAfterTomorrow = new Date()
									dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
									recognizedInfo.date = this.formatDateString(dayAfterTomorrow)
								} else if (scheduleData.date.includes('今天')) {
									recognizedInfo.date = this.formatDateString(new Date())
								} else {
									// 尝试解析日期字符串
									try {
										// 尝试处理YYYY-MM-DD格式
										const dateMatch = scheduleData.date.match(/\d{4}-\d{1,2}-\d{1,2}/)
										if (dateMatch) {
											const dateObj = new Date(dateMatch[0])
											if (!isNaN(dateObj.getTime())) {
												recognizedInfo.date = this.formatDateString(dateObj)
											}
										} else {
											// 其他格式尝试直接解析
											const dateObj = new Date(scheduleData.date)
											if (!isNaN(dateObj.getTime())) {
												recognizedInfo.date = this.formatDateString(dateObj)
											}
										}
									} catch (e) {
										console.error('日期解析错误:', e)
									}
								}
							}
						}
						
						// 处理开始时间
						if (scheduleData.startTime) {
							recognizedInfo.startTime = this.formatTimeString(scheduleData.startTime)
						}
						
						// 处理结束时间
						if (scheduleData.endTime) {
							recognizedInfo.endTime = this.formatTimeString(scheduleData.endTime)
						} else if (recognizedInfo.startTime) {
							// 如果没有结束时间，设置为开始时间后1小时
							const [hours, minutes] = recognizedInfo.startTime.split(':').map(Number)
							let endHour = hours + 1
							if (endHour >= 24) endHour = 23
							recognizedInfo.endTime = `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
						}
						
						// 处理地点
						if (scheduleData.location) {
							recognizedInfo.location = scheduleData.location
						}
						
						// 处理参与人
						if (scheduleData.participants) {
							recognizedInfo.participants = scheduleData.participants
						}
						
						// 处理备注
						if (scheduleData.notes) {
							recognizedInfo.notes = scheduleData.notes
						}
						
						console.log('处理后的日程数据:', recognizedInfo)
						
						// 更新表单数据 - 使用解构并保留现有值
						this.schedule = {
							...this.schedule,  // 保留原有值
							...recognizedInfo  // 覆盖识别出的新值
						}
						
						// 显示成功提示
						uni.showToast({
							title: '识别成功',
							icon: 'success'
						})
					} else {
						// 处理错误情况
						console.error('识别失败:', result)
						uni.showToast({
							title: result.message || '识别失败，请重试',
							icon: 'none'
						})
					}
				}).catch(err => {
					// 隐藏加载提示
					uni.hideLoading()
					
					console.error('AI识别请求错误:', err)
					// 显示错误提示
					uni.showToast({
						title: '识别失败: ' + (err.message || '未知错误'),
						icon: 'none'
					})
				})
			},
			
			// 选择图片
			chooseImage() {
				uni.chooseImage({
					count: 1,
					success: (res) => {
						const tempFilePath = res.tempFilePaths[0];
						this.uploadedImageUrl = tempFilePath;
						this.showImagePreview = true;
						
						// 显示加载提示
						uni.showLoading({
							title: '识别中...'
						});
						
						// 根据平台调用不同的图片转base64方法
						this.fileToBase64(tempFilePath, (base64Data) => {
							// 获取图片类型
							let imgType = 'image/jpeg'; // 默认JPEG
							if (tempFilePath.toLowerCase().endsWith('.png')) {
								imgType = 'image/png';
							} else if (tempFilePath.toLowerCase().endsWith('.gif')) {
								imgType = 'image/gif';
							}
							
							// 从base64数据中去除前缀部分
							let fileContent = base64Data;
							if (base64Data.indexOf('base64,') >= 0) {
								fileContent = base64Data.split('base64,')[1];
							}
							
							// 调用云函数进行识别
							uniCloud.callFunction({
								name: 'identifyImg',
								data: {
									fileContent: fileContent,
									fileType: imgType
								}
							}).then(res => {
								// 处理识别结果
								uni.hideLoading();
								console.log('云函数返回结果:', res.result);
								
								const result = res.result;
								if (result.code === 0 && result.data) {
									// 处理识别结果
									this.processRecognitionResult(result.data);
								} else {
									uni.showToast({
										title: result.message || '识别失败',
										icon: 'none'
									});
								}
							}).catch(err => {
								uni.hideLoading();
								console.error('AI识别请求错误:', err);
								uni.showToast({
									title: '识别失败: ' + (err.message || '未知错误'),
									icon: 'none'
								});
							});
						});
					}
				});
			},
			
			// 文件转Base64方法
			fileToBase64(url, cb) {
				// #ifdef MP-WEIXIN
				uni.getFileSystemManager().readFile({
					filePath: url, //选择图片返回的相对路径
					encoding: 'base64', //编码格式
					success: res => { //成功的回调
						let base64 = 'data:image/jpeg;base64,' + res.data;
						cb(base64);
					},
					fail: (e) => {
						console.error("图片转换失败:", e);
						uni.hideLoading();
						uni.showToast({
							title: '图片读取失败',
							icon: 'none'
						});
					}
				});
				// #endif
				
				// #ifdef H5
				uni.request({
					url: url,
					method: 'GET',
					responseType: 'arraybuffer',
					success: ress => {
						let base64 = uni.arrayBufferToBase64(ress.data); //把arraybuffer转成base64
						base64 = 'data:image/jpeg;base64,' + base64;
						cb(base64);
					},
					fail: (e) => {
						console.error("图片转换失败:", e);
						uni.hideLoading();
						uni.showToast({
							title: '图片读取失败',
							icon: 'none'
						});
					}
				});
				// #endif
				
				// #ifdef APP-PLUS
				plus.io.resolveLocalFileSystemURL(url, (entry) => {
					entry.file((file) => {
						let fileReader = new plus.io.FileReader();
						fileReader.onloadend = (evt) => {
							cb(evt.target.result);
						};
						fileReader.readAsDataURL(file);
					});
				}, (e) => {
					console.error("解析文件URL失败:", e);
					uni.hideLoading();
					uni.showToast({
						title: '图片读取失败',
						icon: 'none'
					});
				});
				// #endif
			},
			
			// 处理识别结果的方法
			processRecognitionResult(scheduleData) {
				// 准备填充到表单的数据
				const recognizedInfo = {};
				
				// 处理标题
				if (scheduleData.title) {
					recognizedInfo.title = scheduleData.title;
				}
				
				// 日期处理
				if (scheduleData.date) {
					if (typeof scheduleData.date === 'string') {
						if (scheduleData.date.includes('明天')) {
							const tomorrow = new Date();
							tomorrow.setDate(tomorrow.getDate() + 1);
							recognizedInfo.date = this.formatDateString(tomorrow);
						} else if (scheduleData.date.includes('后天')) {
							const dayAfterTomorrow = new Date();
							dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() +
 2);
							recognizedInfo.date = this.formatDateString(dayAfterTomorrow);
						} else if (scheduleData.date.includes('今天')) {
							recognizedInfo.date = this.formatDateString(new Date());
						} else {
							try {
								// 尝试处理YYYY-MM-DD格式
								const dateMatch = scheduleData.date.match(/\d{4}-\d{1,2}-\d{1,2}/);
								if (dateMatch) {
									const dateObj = new Date(dateMatch[0]);
									if (!isNaN(dateObj.getTime())) {
										recognizedInfo.date = this.formatDateString(dateObj);
									}
								} else {
									// 其他格式尝试直接解析
									const dateObj = new Date(scheduleData.date);
									if (!isNaN(dateObj.getTime())) {
										recognizedInfo.date = this.formatDateString(dateObj);
									}
								}
							} catch (e) {
								console.error('日期解析错误:', e);
							}
						}
					}
				}
				
				// 处理开始时间
				if (scheduleData.startTime) {
					recognizedInfo.startTime = this.formatTimeString(scheduleData.startTime);
				}
				
				// 处理结束时间
				if (scheduleData.endTime) {
					recognizedInfo.endTime = this.formatTimeString(scheduleData.endTime);
				} else if (recognizedInfo.startTime) {
					// 如果没有结束时间，设置为开始时间后1小时
					const [hours, minutes] = recognizedInfo.startTime.split(':').map(Number);
					let endHour = hours + 1;
					if (endHour >= 24) endHour = 23;
					recognizedInfo.endTime = `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
				}
				
				// 处理地点
				if (scheduleData.location) {
					recognizedInfo.location = scheduleData.location;
				}
				
				// 处理参与人
				if (scheduleData.participants) {
					recognizedInfo.participants = scheduleData.participants;
				}
				
				// 处理备注
				if (scheduleData.notes) {
					recognizedInfo.notes = scheduleData.notes;
				}
				
				console.log('处理后的日程数据:', recognizedInfo);
				
				// 更新表单数据
				this.schedule = {
					...this.schedule,  // 保留原有值
					...recognizedInfo  // 覆盖识别出的新值
				};
				
				// 显示成功提示
				uni.showToast({
					title: '识别成功',
					icon: 'success'
				});
			},
			
			// 切换天气分析开关
			toggleWeatherAnalysis(e) {
				this.schedule.weatherAnalysis = e.detail.value
			},
			
			// 日期选择器变化处理
			onDateChange(e) {
				this.schedule.date = e.detail.value
			},
			
			// 开始时间选择器变化处理
			onStartTimeChange(e) {
				this.schedule.startTime = e.detail.value
			},
			
			// 结束时间选择器变化处理
			onEndTimeChange(e) {
				this.schedule.endTime = e.detail.value
			},
			
			// 格式化日期为字符串 (YYYY-MM-DD)
			formatDateString(date) {
				const year = date.getFullYear()
				const month = (date.getMonth() + 1).toString().padStart(2, '0')
				const day = date.getDate().toString().padStart(2, '0')
				return `${year}-${month}-${day}`
			},
			
			// 格式化日期显示 (YYYY年MM月DD日)
			formatDate(dateString) {
				if (!dateString) return '请选择日期'
				
				const date = new Date(dateString)
				const year = date.getFullYear()
				const month = date.getMonth() + 1
				const day = date.getDate()
				return `${year}年${month}月${day}日`
			},
			
			// 添加时间格式化辅助方法
			formatTimeString(timeStr) {
				// 处理常见的时间格式，统一为HH:MM
				if (!timeStr) return ''
				
				// 尝试提取小时和分钟
				let hours, minutes
				
				// 尝试匹配 "HH:MM" 或 "HH:MM:SS" 格式
				const timeRegex = /(\d{1,2}):(\d{1,2})(?::\d{1,2})?/
				const match = timeStr.match(timeRegex)
				
				if (match) {
					hours = match[1].padStart(2, '0')
					minutes = match[2].padStart(2, '0')
					return `${hours}:${minutes}`
				}
				
				// 尝试解析其他时间表示
				try {
					const date = new Date(timeStr)
					if (!isNaN(date.getTime())) {
						hours = date.getHours().toString().padStart(2, '0')
						minutes = date.getMinutes().toString().padStart(2, '0')
						return `${hours}:${minutes}`
					}
				} catch (e) {
					console.error('时间格式解析错误:', e)
				}
				
				// 如果无法解析，返回原始字符串
				return timeStr
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
	
	/* 固定顶部区域样式 */
	.fixed-top {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		background-color: #fff;
		z-index: 999;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
	}
	
	/* 内容区域增加顶部padding以避免被固定头部遮挡 */
	.content {
		padding: 30rpx;
		padding-top: 180rpx; /* 调整此值确保内容不被顶部固定区域遮挡 */
		padding-bottom: 150rpx; /* 确保底部内容不被tabBar遮挡 */
		box-sizing: border-box;
		min-height: 100vh; /* 确保内容区域至少填满整个视口高度 */
	}
	
	/* 修复表单输入框样式 */
	.form-input {
		width: 100%;
		padding: 20rpx;
		border: 2rpx solid var(--border-color);
		border-radius: 8rpx;
		background-color: #ffffff;
		font-size: 32rpx;
		box-sizing: border-box; /* 确保padding和border计入宽度 */
	}
	
	/* 统一输入框高度 */
	.input-field {
		height: 80rpx;
		line-height: 40rpx;
	}
	
	/* 文本域样式 */
	.textarea {
		width: 100%;
		box-sizing: border-box;
		line-height: 1.4;
	}
	
	/* 确保卡片内的内容不溢出 */
	.card {
		overflow: hidden; /* 防止内容溢出 */
		width: 100%;
		box-sizing: border-box;
	}
	
	.form-group {
		width: 100%;
		box-sizing: border-box;
		margin-bottom: 30rpx;
	}
	
	.iconfont {
		font-family: "iconfont" !important;
		font-size: 28rpx;
		font-style: normal;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}
	
	.date-picker, .time-picker {
		display: flex;
		align-items: center;
		height: 80rpx;
	}
	
	.picker-value {
		width: 100%;
	}
	
	.back-button {
		font-size: 40rpx;
		line-height: 1;
		padding: 10rpx;
	}
	
	@font-face {
		font-family: 'iconfont';
		src: url('https://at.alicdn.com/t/font_2211295_iu6ju9j65x.ttf') format('truetype');
	}
	
	.icon-back:before {
		content: '\e6c8';
	}
	
	.icon-magic:before {
		content: '\e615';
	}
	
	.icon-image:before {
		content: '\e6f3';
	}
	
	.icon-save:before {
		content: '\e649';
	}
	
	.icon-check-circle:before {
		content: '\e64d';
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
</style> 