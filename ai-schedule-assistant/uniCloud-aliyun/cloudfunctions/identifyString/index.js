'use strict';

const db = uniCloud.database();
const axios = require('axios'); // 需要在云函数package.json中添加axios依赖

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
		const inputText = event.text;
		if (!inputText) {
			return {
				code: -2,
				message: '请提供需要分析的文本内容',
				data: null
			};
		}
		
		// 3. 调用通义千问API
		const response = await callQwenAPI(aiToken, inputText);
		
		// 4. 返回结果
		return {
			code: 0,
			message: 'success',
			data: response
		};
		
	} catch (error) {
		console.error('处理失败：', error);
		return {
			code: -3,
			message: '处理失败：' + (error.message || JSON.stringify(error)),
			data: null
		};
	}
};

// 调用通义千问API的函数
async function callQwenAPI(token, text) {
	try {
		const response = await axios({
			method: 'POST',
			url: 'https://api.siliconflow.cn/v1/chat/completions',
			headers: {
				'Authorization': `Bearer ${token}`,
				'Content-Type': 'application/json'
			},
			data: {
				model: 'Qwen/Qwen2.5-7B-Instruct',
				messages: [
					{
						role: 'user',
						content: `从以下文本中提取日程相关信息，按照以下格式返回JSON对象:
{
  "title": "会议标题或事件名称",
  "date": "YYYY-MM-DD格式的日期，如果是相对日期如'明天'请保留原文",
  "startTime": "HH:MM格式的开始时间",
  "endTime": "HH:MM格式的结束时间，如果没有则不填",
  "location": "地点信息",
  "participants": "参与人员",
  "notes": "备注信息"
}

文本内容:
${text}`
					}
				],
				stream: false,
				max_tokens: 512,
				stop: null,
				temperature: 0.1,
				top_p: 0.7,
				top_k: 50,
				frequency_penalty: 0.5,
				n: 1,
				response_format: {
					type: "json_object"
				}
			}
		});
		
		// 解析返回的结果
		if (response.data && response.data.choices && response.data.choices.length > 0) {
			try {
				// 尝试将结果解析为JSON
				const messageContent = response.data.choices[0].message.content;
				console.log(messageContent);
				const jsonData = JSON.parse(messageContent);
				console.log(jsonData);
				return jsonData;
			} catch (e) {
				// 如果解析失败，直接返回原始文本
				return {
					rawText: response.data.choices[0].message.content,
					parseError: '返回结果无法解析为JSON'
				};
			}
		}
		
		return response.data;
	} catch (error) {
		console.error('调用AI API失败:', error);
		throw new Error('AI分析失败: ' + (error.response?.data?.message || error.message));
	}
}
