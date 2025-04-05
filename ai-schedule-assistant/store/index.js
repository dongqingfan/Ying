import { createStore } from 'vuex'

const store = createStore({
  state: {
    schedules: [],
    currentDate: new Date(),
    deviceId: '',
    isLoading: false
  },
  
  getters: {
    // 获取所有日程
    allSchedules: (state) => {
      return state.schedules
    },
    
    // 获取今日日程
    todaySchedules: (state) => {
      // 获取今天的日期字符串 (YYYY-MM-DD)
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
      
      console.log('今日日期字符串:', todayStr);
      
      return state.schedules.filter(schedule => {
        console.log('比较日程:', schedule.title, '日期:', schedule.date, '是否等于今天:', schedule.date === todayStr);
        
        // 直接比较日期字符串，避免Date对象时区问题
        return schedule.date === todayStr;
      }).sort((a, b) => {
        return new Date(`${a.date}T${a.startTime}`) - new Date(`${b.date}T${b.startTime}`);
      });
    },
    
    // 获取本周日程
    weekSchedules: (state) => {
      const now = new Date();
      
      // 计算本周的起始日期和结束日期
      const day = now.getDay() || 7; // 当天是周几，周日为0转为7
      const firstDay = new Date(now);
      firstDay.setDate(now.getDate() - day + 1); // 设置为本周一
      
      const lastDay = new Date(firstDay);
      lastDay.setDate(firstDay.getDate() + 6); // 设置为本周日
      
      // 格式化为YYYY-MM-DD格式
      const firstDayStr = `${firstDay.getFullYear()}-${(firstDay.getMonth() + 1).toString().padStart(2, '0')}-${firstDay.getDate().toString().padStart(2, '0')}`;
      const lastDayStr = `${lastDay.getFullYear()}-${(lastDay.getMonth() + 1).toString().padStart(2, '0')}-${lastDay.getDate().toString().padStart(2, '0')}`;
      
      console.log('本周范围:', firstDayStr, '到', lastDayStr);
      
      return state.schedules.filter(schedule => {
        // 日期比较
        console.log('周视图日程:', schedule.title, '日期:', schedule.date);
        
        // 比较字符串大小以判断日期是否在范围内
        return schedule.date >= firstDayStr && schedule.date <= lastDayStr;
      }).sort((a, b) => {
        // 先按日期排序，再按时间排序
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }
        return a.startTime.localeCompare(b.startTime);
      });
    },
    
    // 获取指定日期的日程
    schedulesByDate: (state) => (date) => {
      // 确保date参数是YYYY-MM-DD格式的字符串
      let dateStr = date;
      
      // 如果是Date对象，转为字符串
      if (date instanceof Date) {
        dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      }
      
      console.log('查询特定日期的日程:', dateStr);
      
      return state.schedules.filter(schedule => {
        return schedule.date === dateStr;
      }).sort((a, b) => {
        return a.startTime.localeCompare(b.startTime);
      });
    },
    
    // 获取指定ID的日程
    scheduleById: (state) => (id) => {
      return state.schedules.find(schedule => schedule._id === id)
    },
    
    // 获取当前设备ID
    getDeviceId: (state) => {
      return state.deviceId
    },
    
    // 加载状态
    isLoading: (state) => {
      return state.isLoading
    }
  },
  
  mutations: {
    // 设置所有日程
    setSchedules(state, schedules) {
      state.schedules = schedules
    },
    
    // 添加日程
    addSchedule(state, schedule) {
      state.schedules.push(schedule)
    },
    
    // 更新日程
    updateSchedule(state, updatedSchedule) {
      const index = state.schedules.findIndex(s => s._id === updatedSchedule._id)
      if (index !== -1) {
        state.schedules[index] = updatedSchedule
      }
    },
    
    // 删除日程
    deleteSchedule(state, scheduleId) {
      state.schedules = state.schedules.filter(s => s._id !== scheduleId)
    },
    
    // 设置当前日期
    setCurrentDate(state, date) {
      state.currentDate = date
    },
    
    // 设置设备ID
    setDeviceId(state, deviceId) {
      state.deviceId = deviceId
      uni.setStorageSync('deviceId', deviceId)
    },
    
    // 设置加载状态
    setLoading(state, status) {
      state.isLoading = status
    }
  },
  
  actions: {
    // 初始化应用，获取设备ID
    initApp({ commit, dispatch }) {
      // 获取或生成设备ID
      let deviceId = uni.getStorageSync('deviceId')
      if (!deviceId) {
        deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15)
        uni.setStorageSync('deviceId', deviceId)
      }
      commit('setDeviceId', deviceId)
      
      // 加载日程
      dispatch('loadSchedules')
    },
    
    // 从云数据库加载日程
    async loadSchedules({ commit, state }) {
      commit('setLoading', true)
      try {
        // 获取推送标识clientId
        const clientId = uni.getStorageSync('push_client_id')
        console.log('加载日程 clientId:', clientId)
        const result = await uniCloud.callFunction({
          name: 'schedule',
          data: {
            action: 'list',
            data: {
              cid: clientId || state.deviceId // 优先使用clientId，如果没有则使用deviceId
            }
          }
        })
        
        if (result.result.code === 0) {
          commit('setSchedules', result.result.data)
        } else {
          console.error('加载日程失败:', result.result.message)
          // 失败时设置空数组
          commit('setSchedules', [])
        }
      } catch (error) {
        console.error('加载日程出错:', error)
        // 出错时设置空数组
        commit('setSchedules', [])
      } finally {
        commit('setLoading', false)
      }
    },
    
    // 添加新日程
    async addNewSchedule({ commit, state, dispatch }, schedule) {
      commit('setLoading', true)
      try {
        // 获取提醒设置
        const settings = uni.getStorageSync('settings') || {}
        const notificationEnabled = settings.notificationEnabled || false
        const reminderMinutes = settings.reminderMinutes || 30
        
        // 获取推送标识clientId
        const clientId = uni.getStorageSync('push_client_id')
        
        // 如果启用了提醒，添加reminder对象
        if (notificationEnabled) {
          const scheduleDateTime = new Date(`${schedule.date} ${schedule.startTime}`)
          const reminderTime = new Date(scheduleDateTime.getTime() - reminderMinutes * 60000)
          
          // 添加提醒信息
          schedule.reminder = {
            time: reminderTime.getTime(),
            minutes: reminderMinutes,
            pushClientId: clientId
          }
        }
        
        // 添加设备ID
        schedule.deviceId = state.deviceId
        
        // 将日程保存到云数据库
        const result = await uniCloud.callFunction({
          name: 'schedule',
          data: {
            action: 'add',
            data: {
              ...schedule,
              cid: clientId || state.deviceId, // 使用clientId作为cid
              createTime: Date.now()
            }
          }
        })
        
        if (result.result.code === 0) {
          // 添加成功后重新加载所有日程以保持同步
          dispatch('loadSchedules')
          
          return {
            success: true,
            message: '日程保存成功'
          }
        } else {
          console.error('添加日程失败:', result.result.message)
          return {
            success: false,
            message: result.result.message || '添加日程失败'
          }
        }
      } catch (error) {
        console.error('添加日程出错:', error)
        return {
          success: false,
          message: error.message || '添加日程时发生错误'
        }
      } finally {
        commit('setLoading', false)
      }
    },
    
    // 更新日程
    async updateExistingSchedule({ commit, state, dispatch }, schedule) {
      commit('setLoading', true)
      try {
        // 获取提醒设置
        const settings = uni.getStorageSync('settings') || {}
        const notificationEnabled = settings.notificationEnabled || false
        const reminderMinutes = settings.reminderMinutes || 30
        
        // 获取推送标识clientId
        const clientId = uni.getStorageSync('push_client_id')
        
        // 如果启用了提醒，添加或更新reminder对象
        if (notificationEnabled) {
          const scheduleDateTime = new Date(`${schedule.date} ${schedule.startTime}`)
          const reminderTime = new Date(scheduleDateTime.getTime() - reminderMinutes * 60000)
          
          // 添加提醒信息
          schedule.reminder = {
            time: reminderTime.getTime(),
            minutes: reminderMinutes,
            pushClientId: clientId
          }
        } else {
          // 如果禁用了提醒，删除reminder对象
          delete schedule.reminder
        }
        
        // 调用云函数更新日程
        const result = await uniCloud.callFunction({
          name: 'schedule',
          data: {
            action: 'update',
            scheduleId: schedule._id,
            data: {
              ...schedule,
              cid: clientId || state.deviceId, // 使用clientId作为cid
              updateTime: Date.now()
            }
          }
        })
        
        if (result.result.code === 0) {
          // 更新成功后重新加载所有日程以保持同步
          dispatch('loadSchedules')
          
          return {
            success: true,
            message: '日程更新成功'
          }
        } else {
          console.error('更新日程失败:', result.result.message)
          return {
            success: false,
            message: result.result.message || '更新日程失败'
          }
        }
      } catch (error) {
        console.error('更新日程出错:', error)
        return {
          success: false,
          message: error.message || '更新日程时发生错误'
        }
      } finally {
        commit('setLoading', false)
      }
    },
    
    // 删除日程
    async removeSchedule({ commit, state, dispatch }, scheduleId) {
      commit('setLoading', true)
      try {
        // 调用云函数删除日程
        const result = await uniCloud.callFunction({
          name: 'schedule',
          data: {
            action: 'delete',
            scheduleId: scheduleId
          }
        })
        
        if (result.result.code === 0) {
          // 删除成功后重新加载所有日程以保持同步
          dispatch('loadSchedules')
          
          return {
            success: true,
            message: '日程删除成功'
          }
        } else {
          console.error('删除日程失败:', result.result.message)
          return {
            success: false,
            message: result.result.message || '删除日程失败'
          }
        }
      } catch (error) {
        console.error('删除日程出错:', error)
        return {
          success: false,
          message: error.message || '删除日程时发生错误'
        }
      } finally {
        commit('setLoading', false)
      }
    },
    
    // 获取单个日程详情
    async getScheduleDetail({ commit }, scheduleId) {
      commit('setLoading', true)
      try {
        const result = await uniCloud.callFunction({
          name: 'schedule',
          data: {
            action: 'get',
            scheduleId: scheduleId
          }
        })
        
        if (result.result.code === 0) {
          return {
            success: true,
            data: result.result.data
          }
        } else {
          console.error('获取日程详情失败:', result.result.message)
          return {
            success: false,
            message: result.result.message || '获取日程详情失败'
          }
        }
      } catch (error) {
        console.error('获取日程详情出错:', error)
        return {
          success: false,
          message: error.message || '获取日程详情时发生错误'
        }
      } finally {
        commit('setLoading', false)
      }
    }
  }
})

export default store 