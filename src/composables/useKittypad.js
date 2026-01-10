// src/composables/useKittypad.js
import { ref, reactive, computed, onMounted } from 'vue'

const CONFIG = { VID: 0xca75, PID: 0x000b, REPORT_ID: 2 }

// 按键定义
const PHY_KEYS = ['UP', 'DOWN', 'LEFT', 'RIGHT', 'A', 'B']
const KEY_VALUES = [1, 2, 4, 8, 16, 32]
const BTN_OPTS = [
  { name: '✨ 默认 (Joystick/Axis)', val: 0 },
  { name: 'Button 1 (A / Cross)', val: 0x0001 },
  { name: 'Button 2 (B / Circle)', val: 0x0002 },
  { name: 'Button 3 (X / Square)', val: 0x0004 },
  { name: 'Button 4 (Y / Triangle)', val: 0x0008 },
  { name: 'Button 5 (L1 / LB)', val: 0x0010 },
  { name: 'Button 6 (R1 / RB)', val: 0x0020 },
  { name: 'Button 7 (L2 / LT)', val: 0x0040 },
  { name: 'Button 8 (R2 / RT)', val: 0x0080 },
  { name: 'Button 9 (Select)', val: 0x0100 },
  { name: 'Button 10 (Start)', val: 0x0200 },
  { name: 'Button 11 (L3)', val: 0x0400 },
  { name: 'Button 12 (R3)', val: 0x0800 },
  { name: 'Button 13 (Home / D-Up)', val: 0x1000 },
  { name: 'Button 14 (D-Down)', val: 0x2000 },
  { name: 'Button 15 (D-Left)', val: 0x4000 },
  { name: 'Button 16 (D-Right)', val: 0x8000 },
]

export function useKittypad() {
  const deviceList = ref([])
  const activeDevice = ref(null)
  const isSaving = ref(false)

  // 配置数据
  const config = reactive({
    singleMap: [0, 0, 0, 0, 1, 2],
    combos: [
      { srcMask: 48, dstBtn: 512 },
      { srcMask: 17, dstBtn: 256 },
    ],
  })

  // 辅助函数：判断是不是我们的设备
  // const isMyDevice = (d) => d.vendorId === CONFIG.VID && d.productId === CONFIG.PID
  const isMyDevice = (d) => d.vendorId === CONFIG.VID
  // 刷新设备列表
  const refreshDevices = async () => {
    if (!('hid' in navigator)) return
    const devices = await navigator.hid.getDevices()
    deviceList.value = devices.filter((d) => isMyDevice(d))
  }

  // 请求新设备权限
  const requestDevice = async () => {
    try {
      await navigator.hid.requestDevice({
        filters: [{ vendorId: CONFIG.VID }], // 👈 删掉了 productId
      })
      await refreshDevices()
    } catch (err) {
      console.log('用户取消或未选择')
    }
  }

  // 连接（打开）设备
  const openConfig = async (device) => {
    try {
      if (!device.opened) await device.open()
      activeDevice.value = device
      // TODO: 这里将来可以读取 Flash 回显配置
    } catch (err) {
      throw new Error('连接失败: ' + err.message)
    }
  }

  const closeConfig = () => (activeDevice.value = null)

  // 恢复默认
  const resetDefaults = () => {
    config.singleMap = [0, 0, 0, 0, 1, 2]
    config.combos[0] = { srcMask: 48, dstBtn: 512 }
    config.combos[1] = { srcMask: 17, dstBtn: 256 }
  }

  // 保存配置 (核心 WebHID 发送)
  const saveConfig = async () => {
    if (!activeDevice.value) return
    isSaving.value = true

    try {
      const buffer = new ArrayBuffer(63)
      const view = new DataView(buffer)

      // 0. CMD
      view.setUint8(0, 0xa0)

      // 1. Single Map
      config.singleMap.forEach((val, i) => {
        view.setUint16(1 + i * 2, parseInt(val), true)
      })

      // 2. Combos (注意：手动处理 Packed 对齐)
      config.combos.forEach((c, i) => {
        const offset = 13 + i * 4
        view.setUint8(offset, c.srcMask)
        view.setUint16(offset + 1, parseInt(c.dstBtn), true)
        view.setUint8(offset + 3, 0) // Padding
      })

      await activeDevice.value.sendReport(CONFIG.REPORT_ID, new Uint8Array(buffer))
    } finally {
      setTimeout(() => (isSaving.value = false), 500)
    }
  }

  // 组合键辅助
  const isComboActive = (cIdx, kVal) => (config.combos[cIdx].srcMask & kVal) === kVal
  const toggleCombo = (cIdx, kVal) => (config.combos[cIdx].srcMask ^= kVal)

  // 生命周期挂载监听
  onMounted(() => {
    if ('hid' in navigator) {
      refreshDevices()
      navigator.hid.addEventListener('connect', (e) => {
        if (isMyDevice(e.device)) refreshDevices()
      })
      navigator.hid.addEventListener('disconnect', (e) => {
        if (isMyDevice(e.device)) {
          refreshDevices()
          if (activeDevice.value === e.device) activeDevice.value = null
        }
      })
    }
  })

  return {
    deviceList,
    activeDevice,
    isSaving,
    config,
    phyKeys: PHY_KEYS,
    keyValues: KEY_VALUES,
    buttonOptions: BTN_OPTS,
    requestDevice,
    openConfig,
    closeConfig,
    resetDefaults,
    saveConfig,
    isComboActive,
    toggleCombo,
  }
}
