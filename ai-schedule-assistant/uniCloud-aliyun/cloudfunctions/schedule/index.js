'use strict';

const db = uniCloud.database();
const scheduleCollection = db.collection('schedules');

exports.main = async (event, context) => {
	const { action, data = {}, scheduleId } = event;
	
	// 获取设备信息
	const { PLATFORM, DEVICEID } = context;
	
	try {
		switch (action) {
			case 'add': {
				// 添加新日程
				const scheduleData = {
					...data,
					cid: data.cid || 'unknown',
					platform: PLATFORM || 'unknown'
				};
				
				// 检查reminder是否需要添加sent字段
				if (scheduleData.reminder && scheduleData.reminder.time) {
					scheduleData.reminder.sent = false;
				}
				
				const result = await scheduleCollection.add(scheduleData);
				return {
					code: 0,
					message: '日程添加成功',
					data: {
						_id: result.id
					}
				};
			}
			
			case 'update': {
				// 更新日程
				if (!scheduleId) {
					return {
						code: -1,
						message: '日程ID不能为空',
						data: null
					};
				}
				
				const scheduleData = { ...data };
				
				// 删除不可修改的字段
				delete scheduleData._id;
				delete scheduleData.createTime;
				
				// 如果修改了提醒时间，重置sent状态
				if (scheduleData.reminder && scheduleData.reminder.time) {
					scheduleData.reminder.sent = false;
				}
				
				await scheduleCollection.doc(scheduleId).update(scheduleData);
				return {
					code: 0,
					message: '日程更新成功',
					data: null
				};
			}
			
			case 'delete': {
				// 删除日程
				if (!scheduleId) {
					return {
						code: -1,
						message: '日程ID不能为空',
						data: null
					};
				}
				
				await scheduleCollection.doc(scheduleId).remove();
				return {
					code: 0,
					message: '日程删除成功',
					data: null
				};
			}
			
			case 'get': {
				// 获取单个日程
				if (!scheduleId) {
					return {
						code: -1,
						message: '日程ID不能为空',
						data: null
					};
				}
				
				const result = await scheduleCollection.doc(scheduleId).get();
				return {
					code: 0,
					message: '获取日程成功',
					data: result.data[0]
				};
			}
			
			case 'list': {
				// 获取日程列表
				const { date, cid } = data;
				let query = scheduleCollection;
				
				// 按日期查询
				if (date) {
					query = query.where({ date });
				}
				
				// 按客户端ID查询
				if (cid) {
					query = query.where({ cid });
				}
				
				// 按创建时间倒序
				const result = await query.orderBy('createTime', 'desc').get();
				
				return {
					code: 0,
					message: '获取日程列表成功',
					data: result.data
				};
			}
			
			default:
				return {
					code: -1,
					message: '未知操作',
					data: null
				};
		}
	} catch (error) {
		console.error('日程操作失败：', error);
		return {
			code: -2,
			message: '操作失败：' + error.message,
			data: null
		};
	}
}; 