import { ref } from 'vue'

// 响应式图库列表与存储空间信息
const deviceFiles = ref([])
const storageInfo = ref({ total: 0, used: 0, free: 0, percent: 0 })

const deviceConfig = ref({
  name: 'KittyHub',
  brightness: 80,
  playMode: 'mixed', // mixed, gif_only, jpg_only
  interval: 5,
  autoRotate: true,
})

export function useSerial() {
  const port = ref(null)
  const isConnected = ref(false)
  const logText = ref('=== KittyHub Web Terminal Ready ===\n')

  const isUploading = ref(false)
  const uploadProgress = ref(0)

  let resolveReady = null
  let readBuffer = ''
  let activeReader = null       // 当前活跃的 reader 引用
  let shouldStopReading = false // 控制循环退出的标志
  let readLoopPromise = null    // readLoop 的 Promise，用于等待退出

  const appendLog = (text) => {
    logText.value += text
    if (logText.value.length > 5000) logText.value = logText.value.slice(-3000)
  }

  const makeCmdHeader = (cmdStr) => [
    cmdStr.charCodeAt(0),
    cmdStr.charCodeAt(1),
    cmdStr.charCodeAt(2),
    cmdStr.charCodeAt(3),
  ]

  const startReadLoop = async () => {
    const decoder = new TextDecoder()
    shouldStopReading = false

    return new Promise((resolve) => {
      (async () => {
        while (port.value?.readable && !shouldStopReading) {
          activeReader = port.value.readable.getReader()
          try {
            while (!shouldStopReading) {
              const { value, done } = await activeReader.read()
              if (done) break
              if (value) {
                const text = decoder.decode(value, { stream: true })
                appendLog(text)
                readBuffer += text

                // 1. 匹配握手信号
                if (resolveReady && readBuffer.includes('READY')) {
                  resolveReady()
                  resolveReady = null
                  readBuffer = readBuffer.replace('READY', '')
                }

                // 2. 魔法解析：静默截获文件列表数据！
                const listStart = readBuffer.indexOf('[FILE_LIST_START]')
                const listEnd = readBuffer.indexOf('[FILE_LIST_END]')
                if (listStart !== -1 && listEnd !== -1 && listEnd > listStart) {
                  const listStr = readBuffer.substring(listStart + 17, listEnd)
                  const lines = listStr.split('\n')
                  const files = []

                  lines.forEach((line) => {
                    const cleanLine = line.trim()
                    if (cleanLine.startsWith('[FS_INFO]')) {
                      const parts = cleanLine.replace('[FS_INFO]', '').split('|')
                      const total = parseInt(parts[0])
                      const used = parseInt(parts[1])
                      storageInfo.value = {
                        total: total,
                        used: used,
                        free: total - used,
                        percent: total > 0 ? Math.floor((used / total) * 100) : 0,
                      }
                    } else if (cleanLine.includes('|')) {
                      const [name, size] = cleanLine.split('|')
                      files.push({ name: name, size: parseInt(size) })
                    }
                  })

                  deviceFiles.value = files
                  readBuffer = readBuffer.substring(listEnd + 15)
                }

                // 魔法解析 2：截获 JSON 配置！
                const confStart = readBuffer.indexOf('[CONF_START]')
                const confEnd = readBuffer.indexOf('[CONF_END]')
                if (confStart !== -1 && confEnd !== -1 && confEnd > confStart) {
                  const jsonStr = readBuffer.substring(confStart + 12, confEnd)
                  try {
                    const parsedConf = JSON.parse(jsonStr)
                    deviceConfig.value = { ...deviceConfig.value, ...parsedConf }
                    appendLog(`[系统] 已同步设备最新配置！\n`)
                  } catch (e) {
                    appendLog(`[错误] JSON 解析失败: ${e}\n`)
                  }
                  readBuffer = readBuffer.substring(confEnd + 10)
                }
                if (readBuffer.length > 1000) readBuffer = readBuffer.slice(-500)
              }
            }
          } catch (error) {
            // reader.cancel() 会触发这里，属于正常断开
            if (error.name !== 'AbortError' && !shouldStopReading) {
              appendLog(`\n[系统警告] 读取流断开: ${error}\n`)
            }
          } finally {
            if (activeReader) {
              activeReader.releaseLock()
              activeReader = null
            }
          }
        }
        resolve() // readLoop 完全退出
      })()
    })
  }

  const connectDevice = async () => {
    try {
      if (!port.value) {
        port.value = await navigator.serial.requestPort()
        await port.value.open({ baudRate: 115200 })
        readLoopPromise = startReadLoop()
      }
      isConnected.value = true


      appendLog('[系统] USB CDC 连接成功\n')
      return true
    } catch (err) {
      appendLog(`[连接失败] ${err}\n`)
      return false
    }
  }

  const disconnectDevice = async () => {
    try {
      // 设置停止标志
      shouldStopReading = true

      if (port.value) {
        // 取消活跃的 reader
        if (activeReader) {
          activeReader.cancel()
        }
        // 等待 readLoop 完全退出（释放锁）
        if (readLoopPromise) {
          await readLoopPromise.catch(() => {})
          readLoopPromise = null
        }
        // 安全关闭端口
        await port.value.close()
        port.value = null
      }

      isConnected.value = false
      deviceFiles.value = []
      storageInfo.value = { total: 0, used: 0, free: 0, percent: 0 }
      appendLog('[系统] 设备已断开连接\n')
      return true
    } catch (err) {
      appendLog(`[断开失败] ${err}\n`)
      return false
    }
  }

  const sendCommand = async (fourCC_Cmd, param = 0, payloadData = null) => {
    if (!port.value || !port.value.writable) throw new Error('设备未连接')

    const writer = port.value.writable.getWriter()
    try {
      const protocolHeader = makeCmdHeader(fourCC_Cmd)
      const header = new Uint8Array(8)
      header.set(protocolHeader, 0)

      const paramValue = payloadData ? payloadData.length : param
      header[4] = paramValue & 0xff
      header[5] = (paramValue >> 8) & 0xff
      header[6] = (paramValue >> 16) & 0xff
      header[7] = (paramValue >> 24) & 0xff

      appendLog(`\n[PC -> DEV] 发送指令 [${fourCC_Cmd}], 参数/载荷: ${paramValue}\n`)
      await writer.write(header)

      if (payloadData && payloadData.length > 0) {
        // DELF/CONF 直接发送文本流，GIF/JPEG 需要等 READY 后分块发送
        if (fourCC_Cmd === 'DELF' || fourCC_Cmd === 'CONF') {
          await writer.write(payloadData)
          return
        }

        appendLog('[PC] 等待设备响应 READY...\n')
        await new Promise((res) => {
          resolveReady = res
          setTimeout(() => {
            if (resolveReady) {
              resolveReady()
              resolveReady = null
            }
          }, 5000)
        })

        isUploading.value = true
        uploadProgress.value = 0
        const totalSize = payloadData.length
        const chunkSize = 1024

        for (let i = 0; i < totalSize; i += chunkSize) {
          const end = Math.min(i + chunkSize, totalSize)
          await writer.write(payloadData.slice(i, end))
          uploadProgress.value = Math.floor((end / totalSize) * 100)
          await new Promise((res) => setTimeout(res, 5))
        }
        appendLog('[PC -> DEV] 数据下发完毕！\n')
        setTimeout(() => {
          isUploading.value = false
        }, 2000)
      }
    } finally {
      writer.releaseLock()
    }
  }

  return {
    isConnected,
    logText,
    isUploading,
    uploadProgress,
    deviceFiles,
    connectDevice,
    disconnectDevice,
    sendCommand,
    storageInfo,
    deviceConfig,
  }
}
