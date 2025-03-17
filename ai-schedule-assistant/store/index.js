import { createStore } from 'vuex'

const store = createStore({
  state: {
    schedules: [],
    currentDate: new Date()
  },
  
  getters: {
    // 获取所有日程
    allSchedules: (state) => {
      return state.schedules
    },
    
    // 获取今日日程
    todaySchedules: (state) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      return state.schedules.filter(schedule => {
        const scheduleDate = new Date(schedule.date)
        scheduleDate.setHours(0, 0, 0, 0)
        return scheduleDate.getTime() === today.getTime()
      }).sort((a, b) => {
        return new Date(`${a.date}T${a.startTime}`) - new Date(`${b.date}T${b.startTime}`)
      })
    },
    
    // 获取本周日程
    weekSchedules: (state) => {
      const today = new Date()
      const firstDayOfWeek = new Date(today)
      const day = today.getDay() || 7 // 当天是周几，周日为0转为7
      firstDayOfWeek.setDate(today.getDate() - day + 1) // 设置为本周一
      firstDayOfWeek.setHours(0, 0, 0, 0)
      
      const lastDayOfWeek = new Date(firstDayOfWeek)
      lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6) // 设置为本周日
      lastDayOfWeek.setHours(23, 59, 59, 999)
      
      return state.schedules.filter(schedule => {
        const scheduleDate = new Date(schedule.date)
        return scheduleDate >= firstDayOfWeek && scheduleDate <= lastDayOfWeek
      }).sort((a, b) => {
        // 先按日期排序，再按时间排序
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA - dateB
        }
        return new Date(`${a.date}T${a.startTime}`) - new Date(`${b.date}T${b.startTime}`)
      })
    },
    
    // 获取指定日期的日程
    schedulesByDate: (state) => (date) => {
      const targetDate = new Date(date)
      targetDate.setHours(0, 0, 0, 0)
      
      return state.schedules.filter(schedule => {
        const scheduleDate = new Date(schedule.date)
        scheduleDate.setHours(0, 0, 0, 0)
        return scheduleDate.getTime() === targetDate.getTime()
      }).sort((a, b) => {
        return new Date(`${a.date}T${a.startTime}`) - new Date(`${b.date}T${b.startTime}`)
      })
    },
    
    // 获取指定ID的日程
    scheduleById: (state) => (id) => {
      return state.schedules.find(schedule => schedule.id === id)
    }
  },
  
  mutations: {
    // 设置所有日程
    setSchedules(state, schedules) {
      state.schedules = schedules
    },
    
    // 添加日程
    addSchedule(state, schedule) {
      // 生成唯一ID
      schedule.id = Date.now().toString()
      state.schedules.push(schedule)
      // 保存到本地存储
      uni.setStorageSync('schedules', state.schedules)
    },
    
    // 更新日程
    updateSchedule(state, updatedSchedule) {
      const index = state.schedules.findIndex(s => s.id === updatedSchedule.id)
      if (index !== -1) {
        state.schedules[index] = updatedSchedule
        // 保存到本地存储
        uni.setStorageSync('schedules', state.schedules)
      }
    },
    
    // 删除日程
    deleteSchedule(state, scheduleId) {
      state.schedules = state.schedules.filter(s => s.id !== scheduleId)
      // 保存到本地存储
      uni.setStorageSync('schedules', state.schedules)
    },
    
    // 设置当前日期
    setCurrentDate(state, date) {
      state.currentDate = date
    }
  },
  
  actions: {
    // 从本地存储加载日程
    loadSchedules({ commit }) {
      const schedules = uni.getStorageSync('schedules') || []
      commit('setSchedules', schedules)
    },
    
    // 添加新日程
    addNewSchedule({ commit }, schedule) {
      commit('addSchedule', schedule)
    },
    
    // 更新日程
    updateExistingSchedule({ commit }, schedule) {
      commit('updateSchedule', schedule)
    },
    
    // 删除日程
    removeSchedule({ commit }, scheduleId) {
      commit('deleteSchedule', scheduleId)
    }
  }
})

export default store 