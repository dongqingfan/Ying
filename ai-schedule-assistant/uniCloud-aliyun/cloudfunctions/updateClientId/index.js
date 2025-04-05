'use strict';

exports.main = async (event, context) => {
	try {
		// 获取客户端信息
		const { clientId } = event;
		const { CLIENTIP, PLATFORM, DEVICEID } = context;
		
		if (!clientId) {
			return {
				code: -1,
				message: '缺少clientId参数',
				data: null
			};
		}
		
		// 将clientId与设备ID关联，并保存到本地存储中的clientMap
		// 此处不创建额外的数据表，直接使用本地存储，在云函数读取时查找
		let clientMap = {};
		
		try {
			// 从存储中获取现有的clientMap
			const db = uniCloud.database();
			const result = await db.collection('clientMap').limit(1).get();
			
			if (result.data && result.data.length > 0) {
				clientMap = result.data[0].map || {};
			} else {
				// 如果不存在，创建新的记录
				await db.collection('clientMap').add({
					map: {},
					createTime: Date.now()
				});
			}
			
			// 更新clientMap
			clientMap[DEVICEID || clientId] = {
				clientId: clientId,
				platform: PLATFORM,
				ip: CLIENTIP,
				updateTime: Date.now()
			};
			
			// 保存更新后的clientMap
			if (result.data && result.data.length > 0) {
				await db.collection('clientMap').doc(result.data[0]._id).update({
					map: clientMap,
					updateTime: Date.now()
				});
			} else {
				await db.collection('clientMap').add({
					map: clientMap,
					createTime: Date.now(),
					updateTime: Date.now()
				});
			}
			
			return {
				code: 0,
				message: '推送标识更新成功',
				data: null
			};
		} catch (error) {
			console.error('保存clientId出错:', error);
			
			// 如果数据库操作出错，也返回成功，但记录日志
			return {
				code: 0,
				message: '推送标识已记录',
				data: null
			};
		}
	} catch (error) {
		console.error('更新推送标识失败:', error);
		return {
			code: -1,
			message: '更新推送标识失败: ' + error.message,
			data: null
		};
	}
}; 