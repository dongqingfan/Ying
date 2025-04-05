'use strict';

const db = uniCloud.database();

exports.main = async (event, context) => {
	try {
		// 获取当前时间
		const now = new Date();
		const currentTime = now.getTime();
		
		// 查询需要提醒的日程
		const schedules = await db.collection('schedules')
			.where({
				reminder: db.command.exists(true),
				'reminder.time': db.command.lte(currentTime),
				'reminder.sent': db.command.exists(false)
			})
			.get();
		
		if (!schedules.data || schedules.data.length === 0) {
			return {
				code: 0,
				message: '没有需要提醒的日程',
				data: null
			};
		}
		
		// 处理每个需要提醒的日程
		for (const schedule of schedules.data) {
			// 发送提醒
			await sendReminder(schedule);
			
			// 标记提醒已发送
			await db.collection('schedules').doc(schedule._id).update({
				'reminder.sent': true
			});
		}
		
		return {
			code: 0,
			message: '提醒处理完成',
			data: {
				processedCount: schedules.data.length
			}
		};
		
	} catch (error) {
		console.error('处理提醒失败：', error);
		return {
			code: -1,
			message: '处理提醒失败：' + (error.message || JSON.stringify(error)),
			data: null
		};
	}
};

// 发送提醒的函数
async function sendReminder(schedule) {
	try {
		// 构建提醒消息
		const message = {
			title: '日程提醒',
			content: `您有一个日程即将开始：${schedule.title}`,
			payload: {
				type: 'schedule_reminder',
				scheduleId: schedule._id
			}
		};
		
		// 检查是否有推送标识
		if (schedule.reminder && schedule.reminder.pushClientId) {
			// 使用UniPush发送推送
			const pushResult = await uniCloud.sendPushMessage({
				"push_clientid": schedule.reminder.pushClientId, // 客户端推送标识
				"title": message.title, // 推送标题
				"content": message.content, // 推送内容
				"payload": JSON.stringify(message.payload), // 附加数据，点击通知时可以获取
				"force_notification": true, // 强制作为通知栏消息处理
				"sound": "default", // 使用默认提示音
				"request_id": schedule._id // 请求唯一标识
			});
			
			console.log('推送发送结果:', pushResult);
			return true;
		} else {
			console.log('日程没有推送标识，无法发送提醒:', schedule._id);
			return false;
		}
	} catch (error) {
		console.error('发送提醒失败:', error);
		throw error;
	}
}
// 在APP启动时或定时检查
function checkScheduleReminders() {
	const now = new Date().getTime();
	const schedules = uni.getStorageSync('schedules') || [];
	
	schedules.forEach(schedule => {
		if (schedule.reminder && schedule.reminder.time <= now && !schedule.reminder.sent) {
			// 显示本地通知
			uni.showNotification({
				title: '日程提醒',
				content: `您有一个日程即将开始：${schedule.title}`,
				success: function() {
					// 标记为已提醒
					schedule.reminder.sent = true;
					// 更新存储
					uni.setStorageSync('schedules', schedules);
				}
			});
		}
	});
} 