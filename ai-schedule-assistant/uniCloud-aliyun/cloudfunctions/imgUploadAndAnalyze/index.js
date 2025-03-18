// imgUploadAndAnalyze/index.js
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
        
        // 2. 检查上传的文件
        if (!event.file) {
            return {
                code: -2,
                message: '未找到上传的图片',
                data: null
            };
        }
        
        // 3. 读取文件内容并转为base64
        const fileBuffer = event.file.buffer;
        const fileType = event.file.type || 'image/jpeg';
        const base64Img = fileBuffer.toString('base64');
        
        // 4. 调用AI进行识别
        const response = await callQwenAPIWithImage(aiToken, base64Img, fileType);
        
        // 5. 返回结果
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

// 调用通义千问API的函数(支持图像识别)
async function callQwenAPIWithImage(token, imgBase64, imgType) {
    try {
        // 构建图像内容
        const imageContent = `data:${imgType};base64,${imgBase64}`;
        
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
                        content: [
                            {
                                type: 'text',
                                text: '这张图片是一张日程安排、会议邀请或事件通知。请提取其中的日程相关信息，按照以下格式返回JSON对象:\n{\n  "title": "会议标题或事件名称",\n  "date": "YYYY-MM-DD格式的日期，如果是相对日期如\'明天\'请保留原文",\n  "startTime": "HH:MM格式的开始时间",\n  "endTime": "HH:MM格式的结束时间，如果没有则不填",\n  "location": "地点信息",\n  "participants": "参与人员",\n  "notes": "备注信息"\n}'
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
                temperature: 0.1,
                response_format: {
                    type: "json_object"
                }
            }
        });
        
        // 解析返回的结果
        if (response.data && response.data.choices && response.data.choices.length > 0) {
            try {
                const messageContent = response.data.choices[0].message.content;
                console.log(messageContent);
                const jsonData = JSON.parse(messageContent);
                console.log(jsonData);
                return jsonData;
            } catch (e) {
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