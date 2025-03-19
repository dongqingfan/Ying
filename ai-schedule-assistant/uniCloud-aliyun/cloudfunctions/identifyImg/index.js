'use strict';

const db = uniCloud.database();
const axios = require('axios');

exports.main = async (event, context) => {
	try {
		// 1. 从数据库获取AI Token
		const tokenRecord = await db.collection('settings').limit(1).get();
		
		if (!tokenRecord.data || tokenRecord.data.length === 0) {
			return {
				code: -1,
				message: '未找到AI Token配置',
				data: null
			};
		}
		
		const aiToken = tokenRecord.data[0].ai_chat;
		
		// 2. 检查输入参数
		if (!event.fileContent || !event.fileType) {
			return {
				code: -2,
				message: '请提供图片内容和类型',
				data: null
			};
		}
		
		console.log('开始上传图片...');
		
		// 3. 使用通义千问API直接进行图像识别（使用base64）
		const imageContent = `data:${event.fileType};base64,${event.fileContent}`;
		
		console.log('调用AI API进行识别...');
		
		// 直接调用通义千问API进行图像识别
		const response = await axios({
			method: 'POST',
			url: 'https://api.siliconflow.cn/v1/chat/completions',
			headers: {
				'Authorization': `Bearer ${aiToken}`,
				'Content-Type': 'application/json'
			},
			data: {
				model: 'Pro/Qwen/Qwen2.5-VL-7B-Instruct',
				messages: [
					{
						role: 'user',
						content: [
							{
								type: 'text',
								text: '这张图片是一张日程安排、会议邀请或事件通知。请提取其中的日程相关信息，直接返回JSON对象，不要包含任何其他格式或标记:{\n  "title": "会议标题或事件名称",\n  "date": "YYYY-MM-DD格式的日期，如果是相对日期如\'明天\'请保留原文",\n  "startTime": "HH:MM格式的开始时间",\n  "endTime": "HH:MM格式的结束时间，如果没有则不填",\n  "location": "地点信息",\n  "participants": "参与人员",\n  "notes": "备注信息"\n}'
							},
							{
								type: 'image_url',
								image_url: {
									url: imageContent
								}
							}
						]
					}
				],
				stream: false,
				max_tokens: 512,
				stop: null,
				temperature: 0.1,
				top_p: 0.7,
				top_k: 50,
				frequency_penalty: 0.5,
				n: 1
			}
		});
		
		console.log('AI API调用成功，处理返回结果...');
		
		// 解析返回的结果
		if (response.data && response.data.choices && response.data.choices.length > 0) {
			try {
				// 获取返回内容
				let messageContent = response.data.choices[0].message.content;
				console.log('AI返回内容:', messageContent);
				
				// 清理markdown格式
				messageContent = messageContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
				
				// 尝试解析JSON
				const jsonData = JSON.parse(messageContent);
				console.log('解析后的JSON数据:', jsonData);
				
				return {
					code: 0,
					message: 'success',
					data: jsonData
				};
			} catch (e) {
				console.error('JSON解析错误:', e);
				// 如果解析失败，返回原始文本
				return {
					code: 0,
					message: 'success',
					data: {
						rawText: response.data.choices[0].message.content,
						parseError: '返回结果无法解析为JSON'
					}
				};
			}
		}
		
		return {
			code: 0,
			message: 'success',
			data: response.data
		};
		
	} catch (error) {
		console.error('处理失败：', error);
		// 打印更详细的错误信息
		if (error.response) {
			console.error('错误响应数据:', error.response.data);
			console.error('错误状态码:', error.response.status);
			console.error('错误响应头:', error.response.headers);
		}
		return {
			code: -3,
			message: '处理失败：' + (error.message || JSON.stringify(error)),
			data: null
		};
	}
};
