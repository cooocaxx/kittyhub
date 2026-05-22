<template>
  <div class="fui-ultimate-cockpit" :class="systemStateClass">

    <div class="global-pixel-noise"></div>

    <header class="fui-top-bar" v-motion :initial="{ opacity: 0, y: -50 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 600, ease: 'circOut' } }">
      <div class="title-block">
        <h1 class="huge-title">KITTY<span class="outline-text">HUB</span></h1>
        <div class="sub-title">/// ADVANCED.CTRL.UNIT [RP2040]</div>
      </div>

      <div class="fui-tabs">
        <button :class="['fui-tab', activeTab === 'gallery' ? 'tab-active' : '']" @click="activeTab = 'gallery'">[
          GALLERY ]</button>
        <button :class="['fui-tab', activeTab === 'power' ? 'tab-active' : '']" @click="activeTab = 'power'">[
          POWER_MONITOR ]</button>
      </div>

      <div class="status-block">
        <span class="status-dot rgb-split"></span>
        <span class="status-text target-neon">{{ isConnected ? (isBooting ? 'INITIALIZING...' : 'SYS.ONLINE') :
          'SYS.STANDBY' }}</span>
      </div>

      <button class="fui-btn connect-btn" :class="{ 'btn-yellow': !isConnected, 'btn-outline': isConnected }"
        @click="isConnected ? disconnectDevice() : handleConnect()" :disabled="isBooting">
        {{ isBooting ? 'BOOTING...' : (isConnected ? 'TERMINATE LINK' : 'INITIALIZE UPLINK') }}
      </button>
    </header>

    <main class="fui-workspace">

      <div v-show="activeTab === 'gallery'" class="bento-grid">

        <section class="panel panel-left bracket-corners" v-motion :initial="{ opacity: 0, x: -60, skewX: 5 }"
          :enter="{ opacity: 1, x: 0, skewX: 0, transition: { duration: 500, delay: 100, ease: 'easeOut' } }">
          <div class="panel-header target-color">DIR_LISTING <span class="blink">_</span></div>
          <div class="file-list-area">
            <div v-if="!isConnected && !isBooting" class="empty-sys dither-dense">AWAITING LINK...</div>
            <div v-if="isBooting" class="empty-sys glitch-text">READING FLASH...</div>
            <div v-for="file in deviceFiles" :key="file.name" class="file-tile animate-in">
              <div class="dither-icon target-neon-border"></div>
              <div class="file-meta">
                <span class="f-name">{{ file.name.replace('/', '') }}</span>
                <span class="f-size">SIZE: {{ (file.size / 1024).toFixed(1) }}K</span>
              </div>
              <button
                class="f-del"
                :class="{ 'confirm-delete': deleteConfirmFile === file.name }"
                @click="handleDeleteClick(file.name)">
                {{ deleteConfirmFile === file.name ? '[?]' : '[X]' }}
              </button>
            </div>
          </div>
          <div class="action-stack">
            <button class="fui-btn btn-green full-w" @click="handleRotate" :disabled="!isConnected">>> ROTATE
              (SROT)</button>
            <button
              class="fui-btn full-w"
              :class="wipeConfirmMode ? 'btn-yellow' : 'btn-magenta'"
              @click="handleWipeClick"
              :disabled="!isConnected">
              {{ wipeConfirmMode ? '>>> CONFIRM WIPE?' : '>> FORMAT FLASH' }}
            </button>
          </div>
        </section>

        <section class="panel panel-center bracket-corners" v-motion :initial="{ opacity: 0, scale: 0.95, y: 20 }"
          :enter="{ opacity: 1, scale: 1, y: 0, transition: { duration: 600, delay: 200, type: 'spring', stiffness: 100 } }">

          <div v-if="!showCropModal" class="dither-upload-box" @click="triggerFileInput"
            :class="{ disabled: !isConnected }">
            <div class="glitch-bg-anim target-anim-bg"></div>
            <div class="dither-pixel-mask"></div>
            <div class="upload-scanline target-scanline"></div>
            <div class="pixel-crosshair"></div>

            <div class="idle-content bracket-corners">
              <div class="upload-icon target-neon">▚</div>
              <h2 class="bold-cta target-color">{{ isConnected ? 'INSERT_MEDIA_PAYLOAD' : 'SYSTEM OFFLINE' }}</h2>
              <p class="sub-cta">{{ isConnected ? '[ CLICK TO BROWSE DIRECTORY ]' : 'AWAITING INITIALIZATION' }}</p>
            </div>
          </div>
          <input type="file" ref="fileInputRef" accept="image/*" class="hidden-input" @change="handleFileSelect">

          <div v-if="showCropModal" class="fui-cropper-area">
            <!-- 上传进度条 -->
            <div v-if="isUploading" class="upload-progress-overlay">
              <div class="upload-progress-content">
                <div class="upload-progress-title target-neon">TRANSMITTING DATA...</div>
                <div class="upload-progress-bar">
                  <div class="upload-progress-fill" :style="{ width: uploadProgress + '%' }"></div>
                </div>
                <div class="upload-progress-text target-yellow">{{ uploadProgress }}%</div>
              </div>
            </div>

            <!-- GIF 预览模式：只显示图片，禁用裁剪 -->
            <div v-if="isGifPreview && !isUploading" class="gif-preview-frame">
              <img :src="cropUrl" class="gif-preview-img" alt="GIF Preview" />
              <div class="gif-info target-neon">GIF ANIMATION - NO CROP</div>
            </div>
            <!-- 普通图片：裁剪器 -->
            <div v-else-if="!isUploading" class="cropper-frame dither-dense">
              <div class="hud-corner top-left"></div>
              <div class="hud-corner top-right"></div>
              <div class="hud-corner bottom-left"></div>
              <div class="hud-corner bottom-right"></div>
              <div class="fui-coord top-left-data">POS: X0 Y0</div>
              <div class="fui-coord bottom-right-data">ROT: {{ currentRotation * 90 }}°</div>
              <Cropper ref="cropperRef" class="vue-cropper-instance" :src="cropUrl"
                :stencil-props="{ aspectRatio: getScreenRatio() }" />
            </div>

            <div class="cropper-actions">
              <button v-if="!isGifPreview && !isUploading" class="fui-btn btn-outline" @click="cropRotate(90)">[ ROT +90° ]</button>
              <button class="fui-btn btn-outline" @click="cancelCrop" :disabled="isUploading">[ ABORT ]</button>
              <button class="fui-btn btn-yellow execute-btn" @click="confirmCrop" :disabled="isUploading">>>> {{ isGifPreview ? 'UPLOAD GIF' : 'EXECUTE CROP & UPLOAD' }}</button>
            </div>
          </div>
        </section>

        <section class="panel panel-right bracket-corners" v-motion :initial="{ opacity: 0, x: 60, skewX: -5 }"
          :enter="{ opacity: 1, x: 0, skewX: 0, transition: { duration: 500, delay: 300, ease: 'easeOut' } }">
          <div class="panel-header target-color">SYS_CONFIG (CONF)</div>

          <div class="config-controls">
            <div class="c-row">
              <label>ID_STRING</label>
              <input type="text" class="fui-input term-input target-color" v-model="deviceConfig.name" maxlength="12"
                :disabled="!isConnected">
            </div>
            <div class="c-row">
              <label>LUMEN_OUTPUT [{{ deviceConfig.brightness }}%]</label>
              <input type="range" class="fui-slider glitch-slider target-color" v-model.number="deviceConfig.brightness"
                min="5" max="100" step="5" :disabled="!isConnected">
            </div>
            <div class="c-row radio-group">
              <label>EXECUTION_MODE</label>
              <div class="radio-options">
                <label class="radio-label green-radio" :class="{ 'disabled-text': !isConnected }">
                  <input type="checkbox" v-model="playGif" :disabled="!isConnected"> [ GIF_ONLY ]
                </label>
                <label class="radio-label green-radio" :class="{ 'disabled-text': !isConnected }">
                  <input type="checkbox" v-model="playJpg" :disabled="!isConnected"> [ JPG_ONLY ]
                </label>
              </div>
            </div>
            <div class="c-row switch-row">
              <label>AUTO_CYCLE_ROUTINE</label>
              <label class="fui-switch yellow-switch">
                <input type="checkbox" v-model="deviceConfig.autoRotate" :disabled="!isConnected">
                <span class="switch-track dither-dense"></span>
              </label>
            </div>
            <div class="c-row">
              <label>DWELL_TICK [SEC]</label>
              <input type="number" class="fui-input term-input num-input target-color"
                v-model.number="deviceConfig.interval" min="0" max="60" :disabled="!isConnected">
            </div>
          </div>

          <div class="flex-spacer"></div>
          <button
            class="fui-btn full-w"
            :class="configConfirmMode ? 'btn-magenta' : 'btn-yellow'"
            @click="handleConfigClick"
            :disabled="!isConnected">
            {{ configConfirmMode ? '>>> CONFIRM WRITE?' : '>>> WRITE TO FLASH' }}
          </button>
        </section>

        <section class="panel panel-bottom" v-motion :initial="{ opacity: 0, y: 60 }"
          :enter="{ opacity: 1, y: 0, transition: { duration: 600, delay: 400, type: 'spring', stiffness: 80 } }">
          <div class="console-module terminal-module bracket-corners">
            <div class="panel-header target-color">TERMINAL_OUT <span class="blink">_</span></div>
            <pre class="terminal-body target-neon">{{ logText }}</pre>
          </div>

          <div class="console-module hex-module bracket-corners dither-bg-subtle">
            <div class="panel-header target-color">SYS_STORAGE_ALLOC</div>
            <div class="hex-content target-yellow">
              <div v-for="(line, index) in hexLines" :key="'hex' + index" v-html="line"></div>
            </div>
          </div>

          <div class="console-module signal-module bracket-corners">
            <div class="panel-header target-color">
              <span>SIGNAL_OSC [FREQ_ANALYSIS]</span>
              <span class="status-blink" v-if="isConnected && !isBooting">[ SYNC_LOCK ]</span>
            </div>

            <div class="osc-container">
              <div class="osc-data target-color">
                <div class="data-row"><span>FRQ:</span> <span class="target-yellow">{{ oscData.freq }} MHz</span></div>
                <div class="data-row"><span>AMP:</span> <span class="target-yellow">{{ oscData.amp }} dB</span></div>
                <div class="data-row"><span>SNR:</span> <span class="target-magenta">{{ oscData.snr }} %</span></div>
                <div class="data-row"><span>PHS:</span> <span>{{ oscData.phase }} rad</span></div>
              </div>

              <div class="osc-graph-wrapper dither-bg-subtle target-border">
                <div class="osc-grid"></div>
                <div class="eq-bars">
                  <div class="eq-bar target-eq" v-for="n in 16" :key="'eq' + n"
                    :style="{ animationDuration: (0.3 + (n % 5) * 0.2) + 's' }"></div>
                </div>
                <div class="osc-sweep target-scanline"></div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div v-show="activeTab === 'power'" class="bento-grid power-grid-layout" v-motion
        :initial="{ opacity: 0, scale: 0.98 }" :enter="{ opacity: 1, scale: 1, transition: { duration: 400 } }">
        <section class="panel bracket-corners power-panel">
          <div class="panel-header target-color">TELEMETRY: POWER MONITORING</div>
          <div class="usb-grid-horizontal">
            <div class="usb-card dither-bg-subtle" :class="{ 'offline': !isConnected }">
              <div class="u-name">PORT_A <span class="status target-neon">[{{ isConnected ? 'ACTIVE' : 'STANDBY'
              }}]</span></div>
              <div class="u-volts target-yellow">{{ isConnected ? usb1Data.voltage.toFixed(2) : '0.00' }}<span
                  class="unit">V</span></div>
              <div class="u-details">
                <span class="data-block">AMP: {{ isConnected ? (usb1Data.current * 1000).toFixed(0) : '0' }}mA</span>
                <span class="data-block target-magenta">PWR: {{ isConnected ? (usb1Data.voltage * usb1Data.current *
                  1000).toFixed(0) : '0' }}mW</span>
              </div>
            </div>
            <div class="usb-card dither-bg-subtle" :class="{ 'offline': !isConnected }">
              <div class="u-name">PORT_B <span class="status target-neon">[{{ isConnected ? 'ACTIVE' : 'STANDBY'
              }}]</span></div>
              <div class="u-volts target-yellow">{{ isConnected ? usb2Data.voltage.toFixed(2) : '0.00' }}<span
                  class="unit">V</span></div>
              <div class="u-details">
                <span class="data-block">AMP: {{ isConnected ? (usb2Data.current * 1000).toFixed(0) : '0' }}mA</span>
                <span class="data-block target-magenta">PWR: {{ isConnected ? (usb2Data.voltage * usb2Data.current *
                  1000).toFixed(0) : '0' }}mW</span>
              </div>
            </div>
            <div class="usb-card dither-bg-subtle" :class="{ 'offline': !isConnected }">
              <div class="u-name">PORT_C <span class="status target-neon">[{{ isConnected ? 'ACTIVE' : 'STANDBY'
              }}]</span></div>
              <div class="u-volts target-yellow">{{ isConnected ? usb3Data.voltage.toFixed(2) : '0.00' }}<span
                  class="unit">V</span></div>
              <div class="u-details">
                <span class="data-block">AMP: {{ isConnected ? (usb3Data.current * 1000).toFixed(0) : '0' }}mA</span>
                <span class="data-block target-magenta">PWR: {{ isConnected ? (usb3Data.voltage * usb3Data.current *
                  1000).toFixed(0) : '0' }}mW</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <div class="fui-marquee" :class="{ 'marquee-offline': !isConnected }">
      <div class="marquee-track target-marquee-anim">
        <span>// KITTYHUB_CORE_V1.0.4 {{ isConnected ? 'ACTIVE' : 'STANDBY' }} // SYSTEM_TELEMETRY_{{ isConnected ?
          'ONLINE' : 'OFFLINE' }} // AWAITING_COMMAND // 0x3F8A2B_MEM_CLEAR // SENSOR_ARRAY_{{ isConnected ? 'NOMINAL' :
            'SLEEP' }} //</span>
        <span>// KITTYHUB_CORE_V1.0.4 {{ isConnected ? 'ACTIVE' : 'STANDBY' }} // SYSTEM_TELEMETRY_{{ isConnected ?
          'ONLINE' : 'OFFLINE' }} // AWAITING_COMMAND // 0x3F8A2B_MEM_CLEAR // SENSOR_ARRAY_{{ isConnected ? 'NOMINAL' :
            'SLEEP' }} //</span>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
import { useSerial } from './composables/useSerial';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';
import './assets/fui-cockpit.css';

const {
  isConnected, logText, isUploading, uploadProgress,
  deviceFiles, deviceConfig, storageInfo,
  connectDevice, disconnectDevice, sendCommand
} = useSerial();

const activeTab = ref('gallery');
const isBooting = ref(false);
const currentRotation = ref(1);
const showCropModal = ref(false);
const cropUrl = ref('');
const fileInputRef = ref(null);
const isGifPreview = ref(false);  // GIF 预览模式（禁用裁剪）
const gifData = ref(null);        // GIF 文件数据
const configConfirmMode = ref(false); // 配置确认模式
let configConfirmTimer = null;    // 确认模式超时计时器
const wipeConfirmMode = ref(false);   // 格式化确认模式
let wipeConfirmTimer = null;      // 格式化确认超时计时器
const deleteConfirmFile = ref('');    // 待删除的文件名
let deleteConfirmTimer = null;    // 删除确认超时计时器

const systemStateClass = computed(() => {
  if (isBooting.value) return 'sys-booting';
  if (isConnected.value) return 'sys-online';
  return 'sys-offline';
});

// 播放模式多选控制：两个都选 = mixed，只选一个 = gif_only/jpg_only
const playGif = computed({
  get: () => deviceConfig.value.playMode === 'mixed' || deviceConfig.value.playMode === 'gif_only',
  set: (val) => {
    if (val && deviceConfig.value.playMode === 'jpg_only') {
      deviceConfig.value.playMode = 'mixed';
    } else if (val) {
      deviceConfig.value.playMode = 'gif_only';
    } else if (deviceConfig.value.playMode === 'mixed') {
      deviceConfig.value.playMode = 'jpg_only';
    } else {
      deviceConfig.value.playMode = 'jpg_only';
    }
  }
});

const playJpg = computed({
  get: () => deviceConfig.value.playMode === 'mixed' || deviceConfig.value.playMode === 'jpg_only',
  set: (val) => {
    if (val && deviceConfig.value.playMode === 'gif_only') {
      deviceConfig.value.playMode = 'mixed';
    } else if (val) {
      deviceConfig.value.playMode = 'jpg_only';
    } else if (deviceConfig.value.playMode === 'mixed') {
      deviceConfig.value.playMode = 'gif_only';
    } else {
      deviceConfig.value.playMode = 'gif_only';
    }
  }
});


// ================= 具有真实硬件映射的 Hex 动画生成器 =================
const hexLines = ref(['', '', '', '']);
let hexTimer = null;

const updateHexData = () => {
  if (isConnected.value && !isBooting.value) {
    // 提取真实的硬件存储数据
    const total = storageInfo.value.total.toFixed(1);
    const free = storageInfo.value.free.toFixed(1);
    const used = (storageInfo.value.total - storageInfo.value.free).toFixed(1);
    const pct = storageInfo.value.percent || 0;

    // 生成 FUI 风格的 ASCII 物理进度条 [██████------]
    const barLen = 12;
    const filled = Math.round((pct / 100) * barLen);
    const bar = '█'.repeat(filled) + '-'.repeat(barLen - filled);

    // 进度条颜色：空间超过 85% 变洋红警告，否则正常霓虹绿
    const barColor = pct > 85 ? 'var(--magenta)' : 'var(--green)';

    // 尾部保留一个高速闪烁的随机 Hex 字节，维持数据流动的机械感
    const randHex = () => Math.floor(Math.random() * 255).toString(16).padStart(2, '0').toUpperCase();

    hexLines.value = [
      `0x1A00  VOL_CAP : ${total.padStart(7, ' ')} KB  <span class="glitch-hex">${randHex()}</span>`,
      `0x1A04  IN_USE  : ${used.padStart(7, ' ')} KB  <span class="glitch-hex">${randHex()}</span>`,
      `0x1A08  AVAIL   : ${free.padStart(7, ' ')} KB  <span class="glitch-hex">${randHex()}</span>`,
      `0x1A0C  [<span style="color: ${barColor}; text-shadow: 0 0 5px ${barColor}">${bar}</span>] ${pct.toFixed(1).padStart(5, ' ')}%`
    ];
  } else if (!isConnected.value) {
    // 离线死寂态
    hexLines.value = [
      '0x0000  VOL_CAP : ------- KB  00',
      '0x0004  IN_USE  : ------- KB  00',
      '0x0008  AVAIL   : ------- KB  00',
      '0x000C  [------------]   0.0%'
    ];
  } else if (isBooting.value) {
    // 启动时的乱码装载态
    hexLines.value = [
      '0x####  SCANNING SECTORS...   FF',
      '0x####  CALCULATING CHECKSUM  8A',
      '0x####  MOUNTING VOLUMES...   3C',
      '0x####  [████████████] 100.0%'
    ];
  }
};

onMounted(() => {
  hexTimer = setInterval(() => {
    updateHexData();
    updateOscData();
  }, 100);
});

onUnmounted(() => {
  clearInterval(hexTimer);
  if (powerUpdateTimer) {
    clearInterval(powerUpdateTimer);
    powerUpdateTimer = null;
  }
});


const handleConnect = async () => {
  if (!isConnected.value) {
    isBooting.value = true;
    await connectDevice();
    setTimeout(async () => {
      isBooting.value = false;
      await sendCommand("GETC");
      setTimeout(() => sendCommand("LIST"), 200);
    }, 1500);
  }
};

const saveConfig = async () => {
  if (!isConnected.value) return;
  configConfirmMode.value = false; // 重置确认模式
  try {
    const configData = {
      name: deviceConfig.value.name,
      brightness: deviceConfig.value.brightness,
      playMode: deviceConfig.value.playMode,
      interval: deviceConfig.value.interval,
      autoRotate: deviceConfig.value.autoRotate,
    };
    const jsonString = JSON.stringify(configData);
    console.log('[CONFIG] 发送配置:', configData);
    console.log('[CONFIG] JSON:', jsonString);
    await sendCommand("CONF", 0, new TextEncoder().encode(jsonString));
  } catch (err) {
    console.error('[CONFIG] 保存失败:', err);
  }
};

const handleConfigClick = () => {
  if (configConfirmMode.value) {
    // 第二次点击：执行保存
    if (configConfirmTimer) {
      clearTimeout(configConfirmTimer);
      configConfirmTimer = null;
    }
    saveConfig();
  } else {
    // 第一次点击：进入确认模式
    configConfirmMode.value = true;
    configConfirmTimer = setTimeout(() => {
      configConfirmMode.value = false;
    }, 3000); // 3秒后自动取消
  }
};

const handleRotate = async () => {
  if (!isConnected.value) return;
  try {
    currentRotation.value = (currentRotation.value + 1) % 4;
    await sendCommand("SROT", currentRotation.value);
  } catch (err) {
    console.error('[ROTATE] 旋转命令失败:', err);
  }
};

const handleWipe = async () => {
  if (!isConnected.value) return;
  wipeConfirmMode.value = false;
  try {
    await sendCommand("WIPE", 0);
    setTimeout(() => sendCommand("LIST"), 100);
  } catch (err) {
    console.error('[WIPE] 格式化失败:', err);
  }
};

const handleWipeClick = () => {
  if (wipeConfirmMode.value) {
    // 第二次点击：执行格式化
    if (wipeConfirmTimer) {
      clearTimeout(wipeConfirmTimer);
      wipeConfirmTimer = null;
    }
    handleWipe();
  } else {
    // 第一次点击：进入确认模式
    wipeConfirmMode.value = true;
    wipeConfirmTimer = setTimeout(() => {
      wipeConfirmMode.value = false;
    }, 3000);
  }
};

const triggerFileInput = () => { if (!isConnected.value) return; fileInputRef.value.click(); };
const getScreenRatio = () => (currentRotation.value === 1 || currentRotation.value === 3) ? 320 / 170 : 170 / 320;

const handleFileSelect = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // 释放之前的 blob URL
  if (cropUrl.value) {
    URL.revokeObjectURL(cropUrl.value);
  }

  cropUrl.value = URL.createObjectURL(file);
  showCropModal.value = true;

  // GIF 文件：预览但不裁剪
  if (file.type === 'image/gif') {
    const arrayBuffer = await file.arrayBuffer().catch(() => null);
    if (!arrayBuffer) {
      alert('无法读取 GIF 文件');
      cancelCrop();
      if (fileInputRef.value) fileInputRef.value.value = "";
      return;
    }
    isGifPreview.value = true;
    gifData.value = new Uint8Array(arrayBuffer);
  } else {
    isGifPreview.value = false;
    gifData.value = null;
  }

  if (fileInputRef.value) fileInputRef.value.value = "";
};

const cropperRef = ref(null);
const cropRotate = (angle) => cropperRef.value?.rotate(angle);
const cancelCrop = () => {
  // 释放资源
  if (cropUrl.value) {
    URL.revokeObjectURL(cropUrl.value);
    cropUrl.value = '';
  }
  gifData.value = null;
  isGifPreview.value = false;
  showCropModal.value = false;
};

const confirmCrop = async () => {
  // GIF 模式：直接上传
  if (isGifPreview.value && gifData.value) {
    try {
      await sendCommand("ANIM", 0, gifData.value);
      cancelCrop();
      setTimeout(() => sendCommand("LIST"), 200);
    } catch (err) {
      console.error('[GIF UPLOAD] 上传失败:', err);
    }
    return;
  }

  // JPEG 模式：裁剪后上传
  if (!cropperRef.value) return;
  try {
    const { canvas } = cropperRef.value.getResult();
    const { w, h } = (currentRotation.value === 1 || currentRotation.value === 3) ? { w: 320, h: 170 } : { w: 170, h: 320 };
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = w; finalCanvas.height = h;
    const ctx = finalCanvas.getContext('2d');
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
    ctx.drawImage(canvas, 0, 0, w, h);

    finalCanvas.toBlob(async (blob) => {
      if (blob) {
        try {
          await sendCommand("JPEG", 0, new Uint8Array(await blob.arrayBuffer()));
          cancelCrop();
          setTimeout(() => sendCommand("LIST"), 200);
        } catch (err) {
          console.error('[UPLOAD] 上传失败:', err);
        }
      }
    }, 'image/jpeg', 0.95);
  } catch (err) {
    console.error('[CROP] 裁剪失败:', err);
  }
};

const handleDeleteClick = (fileName) => {
  if (deleteConfirmFile.value === fileName) {
    // 第二次点击：执行删除
    if (deleteConfirmTimer) {
      clearTimeout(deleteConfirmTimer);
      deleteConfirmTimer = null;
    }
    deleteConfirmFile.value = '';
    performDelete(fileName);
  } else {
    // 第一次点击：进入确认模式
    if (deleteConfirmTimer) {
      clearTimeout(deleteConfirmTimer);
    }
    deleteConfirmFile.value = fileName;
    deleteConfirmTimer = setTimeout(() => {
      deleteConfirmFile.value = '';
    }, 3000);
  }
};

const performDelete = async (fileName) => {
  if (!isConnected.value) return;
  try {
    await sendCommand("DELF", 0, new TextEncoder().encode(fileName));
    setTimeout(() => sendCommand("LIST"), 500);
  } catch (err) {
    console.error('[DELETE] 删除失败:', err);
  }
};

// 三端口电源数据
const usb1Data = ref({ voltage: 5.08, current: 0.85 });
const usb2Data = ref({ voltage: 5.05, current: 0.42 });
const usb3Data = ref({ voltage: 5.12, current: 0.15 });

let powerUpdateTimer = null;
const updatePowerData = () => {
  if (isConnected.value) {
    usb1Data.value = { voltage: 5.08 + Math.random() * 0.15, current: 0.85 + Math.random() * 0.2 };
    usb2Data.value = { voltage: 5.05 + Math.random() * 0.12, current: 0.42 + Math.random() * 0.15 };
    usb3Data.value = { voltage: 5.12 + Math.random() * 0.10, current: 0.15 + Math.random() * 0.08 };
  }
};
watch(activeTab, (newTab) => {
  if (newTab === 'power') { powerUpdateTimer = setInterval(updatePowerData, 100); }
  else if (powerUpdateTimer) { clearInterval(powerUpdateTimer); powerUpdateTimer = null; }
});



// ================= 波形与射频动画生成器 =================
const oscData = ref({ freq: '000.00', amp: '00.0', snr: '00.0', phase: '0.00' });

const updateOscData = () => {
  if (isConnected.value && !isBooting.value) {
    // 在线时疯狂跳动
    oscData.value = {
      freq: (144 + Math.random() * 2).toFixed(2),
      amp: (-15 + Math.random() * 5).toFixed(1),
      snr: (95 + Math.random() * 4).toFixed(1),
      phase: (Math.random() * 3.14).toFixed(2)
    };
  } else {
    // 离线时数据归零死寂
    oscData.value = { freq: '000.00', amp: '00.0', snr: '00.0', phase: '0.00' };
  }
};

</script>

<style scoped>
/* CSS 已提取到 src/assets/fui-cockpit.css */
</style>
