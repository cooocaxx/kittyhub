<!-- <script setup>
import { computed, ref } from 'vue';
import { useKittypad } from './composables/useKittypad';

// 引入逻辑 Hook
const {
  deviceList, activeDevice, isSaving, config,
  phyKeys, keyValues, buttonOptions,
  requestDevice, openConfig, closeConfig, resetDefaults, saveConfig,
  isComboActive, toggleCombo
} = useKittypad();

// Toast 状态管理 (UI层状态)
const toast = ref({ show: false, msg: '', type: 'info' });
const showToast = (msg, type = 'info') => {
    toast.value = { show: true, msg, type };
    setTimeout(() => toast.value.show = false, 3000);
};

// 状态计算
const hasDevice = computed(() => deviceList.value.length > 0);
const statusTitle = computed(() => !hasDevice.value ? "未检测到设备" : `发现 ${deviceList.value.length} 个 Kittypad`);
const statusDesc = computed(() => hasDevice.value ? "请点击下方任意一个手柄进行配置" : "请连接 USB 线，并点击下方按钮搜索设备");

// 包装保存函数以显示 Toast
const handleSave = async () => {
    try {
        await saveConfig();
        showToast("配置保存成功！", "success");
    } catch (e) {
        showToast(e.message, "error");
    }
};

// 包装连接函数
const handleOpen = async (device) => {
    try {
        await openConfig(device);
    } catch (e) {
        showToast(e.message, "error");
    }
}

// 包装恢复默认
const handleReset = () => {
    if(confirm("确定恢复默认设置吗？(需点击保存生效)")) {
        resetDefaults();
        showToast("已恢复默认值", "success");
    }
}
</script>

<template>
  <div class="flex flex-col h-screen relative bg-[#0f0f11] text-[#e4e4e7] font-sans selection:bg-purple-500 selection:text-white">

    <transition name="fade">
        <div v-if="toast.show" class="fixed top-6 left-0 right-0 z-[100] flex justify-center pointer-events-none">
            <div class="px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 backdrop-blur-md border animate-bounce-in"
                 :class="toast.type === 'success' ? 'bg-green-900/80 border-green-500/50 text-green-100' :
                         toast.type === 'error' ? 'bg-red-900/80 border-red-500/50 text-red-100' :
                         'bg-gray-800/90 border-gray-600 text-gray-100'">
                <i :class="toast.type === 'success' ? 'ri-checkbox-circle-fill' : 'ri-information-fill'" class="text-xl"></i>
                <span class="font-medium text-sm">{{ toast.msg }}</span>
            </div>
        </div>
    </transition>

    <nav class="flex justify-between items-center px-8 py-6 border-b border-white/5 bg-[#0f0f11] z-10">
        <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-900/50">
                <i class="ri-gamepad-fill text-white"></i>
            </div>
            <span class="font-bold tracking-wide text-lg bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                Kittypad Studio
            </span>
        </div>
        <div class="flex items-center gap-2">
            <span class="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs text-gray-400 font-mono">
                {{ deviceList.length }} Devices Online
            </span>
        </div>
    </nav>

    <main class="flex-1 flex flex-col items-center justify-center relative overflow-y-auto w-full px-4">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent opacity-50 pointer-events-none"></div>

        <div class="mb-12 text-center z-10">
            <h1 class="text-4xl font-bold mb-3 transition-colors duration-300" :class="hasDevice ? 'text-white' : 'text-gray-600'">
                {{ statusTitle }}
            </h1>
            <p class="text-sm text-gray-500">{{ statusDesc }}</p>
        </div>

        <div class="w-full max-w-5xl mb-16 z-10 min-h-[160px] flex justify-center">
            <transition-group name="list" tag="div" class="flex flex-wrap justify-center gap-8">
                <div v-for="(device, index) in deviceList" :key="device.deviceId || index"
                     class="group cursor-pointer relative" @click="handleOpen(device)">

                    <div class="kittypad-card active flex items-center justify-between px-6">
                        <div class="dpad-grid">
                            <div class="btn-circle col-start-2 row-start-1"></div>
                            <div class="btn-circle col-start-1 row-start-2"></div>
                            <div class="btn-circle col-start-3 row-start-2"></div>
                            <div class="btn-circle col-start-2 row-start-3"></div>
                        </div>
                        <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                            <i class="ri-bear-smile-line text-2xl text-purple-400 mb-1"></i>
                            <span class="text-[10px] bg-black/40 px-2 py-0.5 rounded text-gray-400 font-mono border border-white/10">#{{ index + 1 }}</span>
                        </div>
                        <div class="flex flex-col gap-3">
                            <div class="btn-circle flex items-center justify-center text-[10px] text-gray-500">A</div>
                            <div class="btn-circle flex items-center justify-center text-[10px] text-gray-500">B</div>
                        </div>
                    </div>

                    <div class="absolute inset-0 bg-black/60 rounded-[20px] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px]">
                        <span class="bg-purple-600 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-1 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                            配置此设备 <i class="ri-settings-line"></i>
                        </span>
                    </div>
                    <div class="text-center mt-3 text-sm text-gray-400 font-mono group-hover:text-purple-400 transition-colors">
                        {{ device.productName }}
                    </div>
                </div>
            </transition-group>

            <div v-if="!hasDevice" class="kittypad-card opacity-20 grayscale border-dashed border-4 flex flex-col items-center justify-center gap-2">
                 <i class="ri-search-eye-line text-3xl text-gray-500"></i>
                 <span class="text-gray-500 font-mono text-sm">NO DEVICE</span>
            </div>
        </div>

        <div class="z-10">
            <button @click="requestDevice"
                class="group bg-transparent border border-gray-700 hover:border-purple-500/50 hover:bg-purple-500/10 text-gray-300 px-8 py-3 rounded-full font-medium transition-all flex items-center gap-3">
                <i class="ri-search-line group-hover:scale-110 transition-transform"></i>
                <span>{{ hasDevice ? '添加新设备 / 重新授权' : '点击搜索设备' }}</span>
            </button>
        </div>
    </main>

    <footer class="py-6 text-center text-xs text-gray-600 border-t border-white/5 bg-[#0f0f11]">
        <p>&copy; 2026 Kittypad Studio.</p>
    </footer>

    <transition name="slide-up">
        <div v-if="activeDevice" class="fixed inset-0 bg-[#0f0f11] z-50 flex flex-col">
            <header class="sticky top-0 bg-[#0f0f11]/95 backdrop-blur-md p-4 border-b border-white/10 flex justify-between items-center max-w-6xl mx-auto w-full z-20 shadow-lg">
                <button @click="closeConfig" class="text-gray-400 hover:text-white flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition">
                    <i class="ri-arrow-left-s-line text-xl"></i> 返回列表
                </button>
                <div class="font-bold flex items-center gap-3 text-lg">
                    <span class="relative flex h-3 w-3">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    {{ activeDevice.productName }}
                </div>
                <div class="flex gap-3">
                    <button @click="handleReset" class="text-gray-400 hover:text-red-400 text-sm px-4 py-2 hover:bg-white/5 rounded-lg transition flex items-center gap-1">
                        <i class="ri-refresh-line"></i> 恢复默认
                    </button>
                    <button @click="handleSave" :disabled="isSaving"
                        class="bg-white text-black px-6 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition shadow-lg flex items-center gap-2 disabled:opacity-50">
                        <i v-if="isSaving" class="ri-loader-4-line animate-spin"></i>
                        {{ isSaving ? '保存中...' : '保存配置' }}
                    </button>
                </div>
            </header>

            <div class="flex-1 overflow-y-auto">
                <div class="max-w-5xl mx-auto p-8 space-y-8 pb-20">
                    <section class="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
                        <div class="flex items-center gap-4 mb-8 border-b border-white/5 pb-4">
                            <div class="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-2xl">
                                <i class="ri-keyboard-box-line"></i>
                            </div>
                            <div>
                                <h2 class="text-xl font-bold text-white">基础按键映射 (Single Map)</h2>
                                <p class="text-sm text-gray-500">自定义物理按键的基础功能。设为默认则保留摇杆特性。</p>
                            </div>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                            <div v-for="(keyName, idx) in phyKeys" :key="idx"
                                class="bg-black/30 rounded-xl p-4 border border-white/5 hover:border-blue-500/50 transition-all group">

                                <label class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex justify-between">
                                    {{ keyName }}
                                    <span class="text-[10px] bg-white/10 px-1.5 rounded text-gray-500 group-hover:text-blue-400 transition-colors">
                                        KEY {{ idx + 1 }}
                                    </span>
                                </label>

                                <div class="relative">
                                    <select v-model="config.singleMap[idx]"
                                            class="w-full bg-[#18181b] text-gray-200 text-sm rounded-lg pl-3 pr-8 py-3 outline-none border border-gray-700 focus:border-blue-500 appearance-none cursor-pointer hover:bg-[#202025] transition-colors text-ellipsis overflow-hidden">
                                        <option v-for="opt in buttonOptions" :value="opt.val">{{ opt.name }}</option>
                                    </select>
                                    <i class="ri-arrow-down-s-line absolute right-3 top-3.5 text-gray-500 pointer-events-none"></i>
                                </div>

                            </div>
                        </div>

                    </section>

                    <section class="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
                        <div class="flex items-center gap-4 mb-8 border-b border-white/5 pb-4">
                            <div class="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-2xl">
                                <i class="ri-flashlight-line"></i>
                            </div>
                            <div>
                                <h2 class="text-xl font-bold text-white">Magic Combo (组合键)</h2>
                                <p class="text-sm text-gray-500">按下特定物理组合时触发。优先级高于基础映射。</p>
                            </div>
                        </div>
                        <div class="grid gap-4">
                            <div v-for="(combo, cIdx) in config.combos" :key="cIdx"
                                 class="bg-black/30 rounded-2xl p-6 border border-white/5 flex flex-col md:flex-row gap-6 items-center hover:border-purple-500/30 transition-colors">
                                <div class="w-24 shrink-0 text-center md:text-left">
                                    <span class="text-xs font-bold text-purple-400 bg-purple-900/20 px-3 py-1 rounded-full border border-purple-500/20">RULE #{{cIdx + 1}}</span>
                                </div>
                                <div class="flex-1 flex flex-col items-center md:items-start">
                                    <p class="text-[10px] text-gray-500 mb-2 font-mono uppercase tracking-widest">Trigger Keys</p>
                                    <div class="flex flex-wrap gap-2 justify-center">
                                        <button v-for="(kName, kIdx) in phyKeys" :key="kIdx"
                                                @click="toggleCombo(cIdx, keyValues[kIdx])"
                                                class="px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 flex items-center gap-1.5"
                                                :class="isComboActive(cIdx, keyValues[kIdx])
                                                    ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_12px_rgba(147,51,234,0.4)] scale-105'
                                                    : 'bg-transparent border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'">
                                            <i class="ri-add-line" v-if="isComboActive(cIdx, keyValues[kIdx])"></i>
                                            {{ kName }}
                                        </button>
                                    </div>
                                </div>
                                <i class="ri-arrow-right-line text-2xl text-gray-600 hidden md:block"></i>
                                <div class="w-full md:w-64">
                                    <p class="text-[10px] text-gray-500 mb-2 font-mono uppercase tracking-widest">Output Action</p>
                                    <div class="relative">
                                        <select v-model="combo.dstBtn"
                                                class="w-full bg-[#18181b] text-white text-sm rounded-lg pl-3 pr-8 py-2.5 outline-none border border-gray-700 focus:border-purple-500 appearance-none cursor-pointer">
                                            <option v-for="opt in buttonOptions" :value="opt.val">{{ opt.name }}</option>
                                        </select>
                                        <i class="ri-arrow-down-s-line absolute right-3 top-3 text-gray-500 pointer-events-none"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    </transition>
  </div>
</template>

<style scoped>
/* Scoped styles that Tailwind can't easily handle or Component-specific CSS */
.kittypad-card {
    width: 210px; height: 130px;
    background: #27272a; border-radius: 20px; border: 2px solid #3f3f46;
    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.1);
    position: relative; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.kittypad-card.active {
    border-color: #8b5cf6; background: #1e1e24;
    box-shadow: 0 0 25px rgba(139, 92, 246, 0.15), inset 0 0 15px rgba(139, 92, 246, 0.1);
}
.kittypad-card:hover { transform: translateY(-5px); border-color: #a78bfa; }

.btn-circle {
    width: 28px; height: 28px; border-radius: 50%;
    background: #18181b; border: 1px solid #3f3f46;
    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
}
.kittypad-card.active .btn-circle { background: #2e1065; border-color: #5b21b6; }
.dpad-grid { display: grid; grid-template-columns: repeat(3, 28px); grid-template-rows: repeat(3, 28px); gap: 2px; }

/* Vue Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); opacity: 0; }

.list-enter-active, .list-leave-active { transition: all 0.4s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateY(20px); }
</style> -->


<script setup>
import { computed, ref } from 'vue';
import { useKittypad } from './composables/useKittypad';

const {
  deviceList, activeDevice, isSaving, config,
  phyKeys, keyValues, buttonOptions,
  requestDevice, openConfig, closeConfig, resetDefaults, saveConfig,
  isComboActive, toggleCombo
} = useKittypad();

const toast = ref({ show: false, msg: '', type: 'info' });
const showToast = (msg, type = 'info') => {
    toast.value = { show: true, msg, type };
    setTimeout(() => toast.value.show = false, 3000);
};

const hasDevice = computed(() => deviceList.value.length > 0);
const statusTitle = computed(() => !hasDevice.value ? "等待设备连接" : `已就绪`);
const statusDesc = computed(() => hasDevice.value ? `发现 ${deviceList.value.length} 个 Kittypad，请选择进行配置` : "系统正在扫描 USB 端口...");

const handleSave = async () => {
    try { await saveConfig(); showToast("配置保存成功！", "success"); }
    catch (e) { showToast(e.message, "error"); }
};
const handleOpen = async (device) => {
    try { await openConfig(device); }
    catch (e) { showToast(e.message, "error"); }
}
const handleReset = () => {
    if(confirm("确定恢复默认设置吗？(需点击保存生效)")) {
        resetDefaults();
        showToast("已恢复默认值", "success");
    }
}
</script>

<template>
  <div class="flex flex-col h-screen relative bg-[#0f0f11] text-[#e4e4e7] font-sans selection:bg-purple-500 selection:text-white overflow-hidden">

    <div class="fixed inset-0 pointer-events-none overflow-hidden">
        <div class="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600/20 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob"></div>
        <div class="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-600/20 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div class="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-600/20 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
    </div>

    <transition name="fade">
        <div v-if="toast.show" class="fixed top-6 left-0 right-0 z-[100] flex justify-center pointer-events-none">
            <div class="px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 backdrop-blur-md border animate-bounce-in"
                 :class="toast.type === 'success' ? 'bg-green-900/80 border-green-500/50 text-green-100' :
                         toast.type === 'error' ? 'bg-red-900/80 border-red-500/50 text-red-100' :
                         'bg-gray-800/90 border-gray-600 text-gray-100'">
                <i :class="toast.type === 'success' ? 'ri-checkbox-circle-fill' : 'ri-information-fill'" class="text-xl"></i>
                <span class="font-medium text-sm">{{ toast.msg }}</span>
            </div>
        </div>
    </transition>

    <nav class="flex justify-between items-center px-8 py-6 border-b border-white/5 bg-[#0f0f11]/50 backdrop-blur-md z-10 sticky top-0">
        <div class="flex items-center gap-3 group cursor-default">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-900/20 group-hover:shadow-purple-500/50 transition-all duration-500">
                <i class="ri-gamepad-fill text-white text-xl"></i>
            </div>
            <div>
                <h1 class="font-bold tracking-wide text-lg leading-tight">Kittypad Studio</h1>
                <div class="text-[10px] text-gray-500 font-mono tracking-wider">PRO CONFIGURATOR</div>
            </div>
        </div>
        <div class="flex items-center gap-2">
            <span class="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs text-gray-400 font-mono flex items-center gap-2">
                <span class="w-2 h-2 rounded-full" :class="hasDevice ? 'bg-green-500 animate-pulse' : 'bg-gray-600'"></span>
                {{ deviceList.length }} Devices Online
            </span>
        </div>
    </nav>

    <main class="flex-1 flex flex-col items-center justify-center relative overflow-y-auto w-full px-4 z-10 custom-scrollbar">

        <div class="mb-12 text-center animate-float">
            <h1 class="text-4xl font-bold mb-3 transition-colors duration-300 drop-shadow-lg" :class="hasDevice ? 'text-white' : 'text-gray-500'">
                {{ statusTitle }}
            </h1>
            <p class="text-sm text-gray-500">{{ statusDesc }}</p>
        </div>

        <div class="w-full max-w-5xl mb-16 min-h-[160px] flex justify-center">
            <transition-group name="list" tag="div" class="flex flex-wrap justify-center gap-10">

                <div v-for="(device, index) in deviceList" :key="device.deviceId || index"
                     class="group cursor-pointer relative" @click="handleOpen(device)">

                    <div class="kittypad-card active flex items-center justify-between px-6 transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_40px_rgba(139,92,246,0.3)] group-hover:border-purple-400/50">
                        <div class="dpad-grid">
                            <div class="btn-circle col-start-2 row-start-1 group-hover:bg-purple-900 transition-colors"></div>
                            <div class="btn-circle col-start-1 row-start-2 group-hover:bg-purple-900 transition-colors"></div>
                            <div class="btn-circle col-start-3 row-start-2 group-hover:bg-purple-900 transition-colors"></div>
                            <div class="btn-circle col-start-2 row-start-3 group-hover:bg-purple-900 transition-colors"></div>
                        </div>
                        <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                            <i class="ri-bear-smile-line text-2xl text-purple-400 mb-1 group-hover:scale-110 transition-transform"></i>
                            <span class="text-[10px] bg-black/40 px-2 py-0.5 rounded text-gray-400 font-mono border border-white/10">#{{ index + 1 }}</span>
                        </div>
                        <div class="flex flex-col gap-3">
                            <div class="btn-circle flex items-center justify-center text-[10px] text-gray-500 group-hover:text-purple-300 group-hover:border-purple-500 transition-colors">A</div>
                            <div class="btn-circle flex items-center justify-center text-[10px] text-gray-500 group-hover:text-purple-300 group-hover:border-purple-500 transition-colors">B</div>
                        </div>
                    </div>

                    <div class="text-center mt-4 text-sm text-gray-500 font-mono group-hover:text-white transition-colors">
                        {{ device.productName }}
                    </div>
                </div>
            </transition-group>

            <div v-if="!hasDevice" class="kittypad-card flex flex-col items-center justify-center relative  group">
                 <div class="absolute inset-0 bg-purple-500/5 animate-ping-slow pointer-events-none"></div>
                 <div class="absolute inset-0 bg-purple-500/5 animate-pulse pointer-events-none"></div>

                 <div class="relative flex flex-col items-center gap-2 z-10 opacity-60 group-hover:opacity-100 transition-opacity">
                     <i class="ri-search-eye-line text-3xl text-gray-500 group-hover:text-purple-400 transition-colors"></i>
                     <span class="text-gray-500 font-mono text-sm group-hover:text-gray-300 transition-colors">NO DEVICE</span>
                 </div>
            </div>
        </div>

        <div>
            <button @click="requestDevice"
                class="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 text-gray-300 px-10 py-3 rounded-full font-medium transition-all overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                <div class="relative flex items-center gap-3">
                  <i class="ri-search-line group-hover:scale-110 transition-transform"></i>
                  <span>{{ hasDevice ? '添加新设备 / 重新授权' : '点击搜索设备' }}</span>
                </div>
            </button>
        </div>
    </main>

    <footer class="py-6 text-center text-xs text-gray-600 border-t border-white/5 bg-[#0f0f11]/50 backdrop-blur-md z-10">
        <p>&copy; 2026 Kittypad Studio.</p>
    </footer>

    <transition name="slide-up">
        <div v-if="activeDevice" class="fixed inset-0 bg-[#0f0f11] z-50 flex flex-col">
            <header class="sticky top-0 bg-[#0f0f11]/95 backdrop-blur-md p-4 border-b border-white/10 flex justify-between items-center max-w-6xl mx-auto w-full z-20 shadow-lg">
                <button @click="closeConfig" class="text-gray-400 hover:text-white flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition">
                    <i class="ri-arrow-left-s-line text-xl"></i> <span class="hidden sm:inline">返回列表</span>
                </button>
                <div class="font-bold flex items-center gap-3 text-lg">
                    <span class="relative flex h-3 w-3">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    {{ activeDevice.productName }}
                </div>
                <div class="flex gap-3">
                    <button @click="handleReset" class="text-gray-400 hover:text-red-400 text-sm px-4 py-2 hover:bg-white/5 rounded-lg transition flex items-center gap-1">
                        <i class="ri-refresh-line"></i> <span class="hidden sm:inline">恢复默认</span>
                    </button>
                    <button @click="handleSave" :disabled="isSaving"
                        class="bg-white text-black px-6 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition shadow-lg flex items-center gap-2 disabled:opacity-50 hover:scale-105 active:scale-95">
                        <i v-if="isSaving" class="ri-loader-4-line animate-spin"></i>
                        {{ isSaving ? '保存中...' : '保存配置' }}
                    </button>
                </div>
            </header>

            <div class="flex-1 overflow-y-auto custom-scrollbar">
                <div class="max-w-5xl mx-auto p-8 space-y-8 pb-20">
                    <section class="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm shadow-xl">
                        <div class="flex items-center gap-4 mb-8 border-b border-white/5 pb-4">
                            <div class="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-2xl">
                                <i class="ri-keyboard-box-line"></i>
                            </div>
                            <div>
                                <h2 class="text-xl font-bold text-white">基础按键映射 (Single Map)</h2>
                                <p class="text-sm text-gray-500">自定义物理按键的基础功能。设为默认则保留摇杆特性。</p>
                            </div>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div v-for="(keyName, idx) in phyKeys" :key="idx"
                                 class="bg-black/30 rounded-xl p-4 border border-white/5 hover:border-blue-500/50 transition-all group hover:bg-white/5">
                                <label class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex justify-between">
                                    {{ keyName }}
                                    <span class="text-[10px] bg-white/10 px-1.5 rounded text-gray-500 group-hover:text-blue-400 transition-colors">KEY {{idx+1}}</span>
                                </label>
                                <div class="relative">
                                    <select v-model="config.singleMap[idx]"
                                            class="w-full bg-[#18181b] text-gray-200 text-sm rounded-lg pl-3 pr-8 py-3 outline-none border border-gray-700 focus:border-blue-500 appearance-none cursor-pointer hover:bg-[#202025] transition-colors text-ellipsis overflow-hidden">
                                        <option v-for="opt in buttonOptions" :value="opt.val">{{ opt.name }}</option>
                                    </select>
                                    <i class="ri-arrow-down-s-line absolute right-3 top-3.5 text-gray-500 pointer-events-none"></i>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section class="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm shadow-xl">
                        <div class="flex items-center gap-4 mb-8 border-b border-white/5 pb-4">
                            <div class="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-2xl">
                                <i class="ri-flashlight-line"></i>
                            </div>
                            <div>
                                <h2 class="text-xl font-bold text-white">Magic Combo (组合键)</h2>
                                <p class="text-sm text-gray-500">按下特定物理组合时触发。优先级高于基础映射。</p>
                            </div>
                        </div>
                        <div class="grid gap-4">
                            <div v-for="(combo, cIdx) in config.combos" :key="cIdx"
                                 class="bg-black/30 rounded-2xl p-6 border border-white/5 flex flex-col md:flex-row gap-6 items-center hover:border-purple-500/30 transition-all hover:bg-white/5">
                                <div class="w-24 shrink-0 text-center md:text-left">
                                    <span class="text-xs font-bold text-purple-400 bg-purple-900/20 px-3 py-1 rounded-full border border-purple-500/20">RULE #{{cIdx + 1}}</span>
                                </div>
                                <div class="flex-1 flex flex-col items-center md:items-start">
                                    <p class="text-[10px] text-gray-500 mb-2 font-mono uppercase tracking-widest">Trigger Keys</p>
                                    <div class="flex flex-wrap gap-2 justify-center">
                                        <button v-for="(kName, kIdx) in phyKeys" :key="kIdx"
                                                @click="toggleCombo(cIdx, keyValues[kIdx])"
                                                class="px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 flex items-center gap-1.5"
                                                :class="isComboActive(cIdx, keyValues[kIdx])
                                                    ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)] scale-105'
                                                    : 'bg-transparent border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'">
                                            <i class="ri-add-line" v-if="isComboActive(cIdx, keyValues[kIdx])"></i>
                                            {{ kName }}
                                        </button>
                                    </div>
                                </div>
                                <i class="ri-arrow-right-line text-2xl text-gray-600 hidden md:block"></i>
                                <i class="ri-arrow-down-line text-2xl text-gray-600 md:hidden"></i>
                                <div class="w-full md:w-64">
                                    <p class="text-[10px] text-gray-500 mb-2 font-mono uppercase tracking-widest">Output Action</p>
                                    <div class="relative">
                                        <select v-model="combo.dstBtn"
                                                class="w-full bg-[#18181b] text-white text-sm rounded-lg pl-3 pr-8 py-2.5 outline-none border border-gray-700 focus:border-purple-500 appearance-none cursor-pointer hover:bg-[#202025]">
                                            <option v-for="opt in buttonOptions" :value="opt.val">{{ opt.name }}</option>
                                        </select>
                                        <i class="ri-arrow-down-s-line absolute right-3 top-3 text-gray-500 pointer-events-none"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    </transition>
  </div>
</template>

<style>
/* 🔥 关键修改：移除 scoped，确保滚动条样式生效 */
.animation-delay-2000 { animation-delay: 2s; }
.animation-delay-4000 { animation-delay: 4s; }

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #52525b; }
</style>

<style scoped>
/* 局部组件样式 */
.kittypad-card {
    width: 210px; height: 130px;
    background: #27272a; border-radius: 20px; border: 2px solid #3f3f46;
    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.1);
    position: relative;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.kittypad-card.active {
    border-color: #8b5cf6; background: #1e1e24;
    box-shadow: 0 0 25px rgba(139, 92, 246, 0.15), inset 0 0 15px rgba(139, 92, 246, 0.1);
}

.btn-circle {
    width: 28px; height: 28px; border-radius: 50%;
    background: #18181b; border: 1px solid #3f3f46;
    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
}
.kittypad-card.active .btn-circle { background: #2e1065; border-color: #5b21b6; }
.dpad-grid { display: grid; grid-template-columns: repeat(3, 28px); grid-template-rows: repeat(3, 28px); gap: 2px; }

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.5s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); opacity: 0; }

.list-enter-active,
.list-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.list-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.9);
}

.list-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>
