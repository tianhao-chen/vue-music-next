<template>
    <div class="player" v-show="playlist.length">
        <transition
        name="normal"
        @enter="enter"
        @after-enter="afterEnter"
        @leave = "leave"
        @after-leave ="afterLeave">
            <div
            class="normal-player"
            v-show="fullScreen">
                <template v-if="currentSong">
                    <div class="background">
                        <img :src="currentSong.pic">
                    </div>
                    <div class="top">
                        <div
                        class="back"
                        @click="goBack">
                            <i class="icon-back"></i>
                        </div>
                        <h1 class="title">{{currentSong.name}}</h1>
                        <h2 class="subtitle">{{currentSong.singer}}</h2>
                    </div>
                    <div class= "middle"
                    @touchstart.prevent="onMiddleTouchStart"
                    @touchmove.prevent="onMiddleTouchMove"
                    @touchend.prevent="onMiddleTouchEnd">
                        <div class="middle-l"
                        :style="middleLStyle">
                            <div class="cd-wrapper"
                            ref="cdWrapperRef">
                                <div
                                ref="cdRef"
                                class="cd">
                                    <img
                                    class="image"
                                    ref="cdImageRef"
                                    :class="cdCls"
                                    :src="currentSong.pic" >
                                </div>
                            </div>
                            <div class="playing-lyric-wrapper">
                                <div class="playing-lyric">{{playingLyric}}</div>
                            </div>
                        </div>
                        <scroll
                        class="middle-r"
                        ref="lyricScrollRef"
                        :style="middleRStyle">
                            <div class="lyric-wrapper">
                                <div v-if="currentLyric" ref="lyricListRef">
                                    <p
                                    class="text"
                                    :class="{'current': currentLineNum === index}"
                                    v-for="(line, index) in currentLyric.lines"
                                    :key="line.num"
                                    >{{line.txt}}</p>
                                </div>
                                <div class="pure-music" v-show="pureMusicLyric">
                                    <p>{{pureMusicLyric}}</p>
                                </div>
                            </div>
                        </scroll>
                    </div>
                    <div class="bottom">
                        <div class="dot-wrapper">
                            <span class="dot"
                            :class="{'active':currentShow==='cd'}"></span>
                            <span class="dot"
                            :class="{'active':currentShow==='lyric'}"></span>
                        </div>
                        <div class="progress-wrapper">
                            <span class="time time-l">{{formatTime(currentTime)}}</span>
                            <div class="progress-bar-wrapper">
                                <progress-bar
                                ref="barRef"
                                :progress="progress"
                                @progress-changing="onProgressChanging"
                                @progress-changed="onProgressChanged"
                                ></progress-bar>
                            </div>
                            <span class="time time-r">{{formatTime(currentSong.duration)}}</span>
                        </div>
                        <div class="operators" @click.stop>
                            <div class="icon i-left" >
                                <i
                                @click="changeMode"
                                :class="modeIcon"></i>
                            </div>
                            <div class="icon i-left" :class="disableCls">
                                <i class="icon-prev"  @click="prev"></i>
                            </div>
                            <div
                            class="icon i-center" :class="disableCls">
                                <i :class="playIcon" @click="togglePlay"></i>
                            </div>
                            <div class="icon i-right" :class="disableCls">
                                <i class="icon-next" @click="next"></i>
                            </div>
                            <div class="icon i-right" >
                                <i @click="toggleFavorite(currentSong)"
                                :class="getFavoriteIcon(currentSong)"></i>
                            </div>
                        </div>
                    </div>
                </template>
            </div>
        </transition>
        <mini-player
        :progress="progress"
        :togglePlay="togglePlay"></mini-player>
        <audio
        ref="audioRef"
        @pause="pause"
        @canplay="ready"
        @error="error"
        @timeupdate="updatetime"
        @ended="end"
        ></audio>
    </div>
</template>

<script>
// 不能使用mapActions，因为这里逻辑比较复杂，计划使用composition API来写
// 没有this来给我们读，所以使用useStore
import { useStore } from 'vuex'
import { computed, watch, ref, nextTick } from 'vue'
import useMode from './use-mode'
import useFavorite from './use-favorite'
import useCd from './use-cd'
import useLyric from './use-lyric'
import useMiddleInteractive from './use-middle-interactive'
import useAnimation from './use-animation'
import usePlayHistory from './use-play-history'
import Scroll from '@/components/base/scroll/scroll'
import ProgressBar from './progress-bar.vue'
import MiniPlayer from './mini-player.vue'
import { formatTime } from '@/assets/js/util'
import { PLAY_MODE } from '@/assets/js/constants'

export default {
    name: 'player',
    components: {
        ProgressBar,
        Scroll,
        MiniPlayer
    },
    // fullScreen以及currentSong的数据均在stroe中定义了方法
    setup() {
        // data
        const audioRef = ref(null)
        const barRef = ref(null)
        const songReady = ref(false)
        const currentTime = ref(0)
        // 为了避免updatetime修改时间和拖动起冲突
        let progressChanging = false

        // fullScreen的变化应当为响应式的，这样一旦state里的属性发生变化就会改变
        // useStore返回的是createStore里的属性 vuex
        const store = useStore()
        const fullScreen = computed(() => store.state.fullScreen)
        const currentSong = computed(() => store.getters.currentSong)
        const currentIndex = computed(() => store.state.currentIndex)
        const playing = computed(() => store.state.playing)
        const playlist = computed(() => store.state.playlist)
        const playMode = computed(() => store.state.playMode)

        // hooks
        const { modeIcon, changeMode } = useMode()
        const { getFavoriteIcon, toggleFavorite } = useFavorite()
        const { cdCls, cdRef, cdImageRef } = useCd()
        const { currentLyric, currentLineNum, playLyric, stopLyric, lyricScrollRef, lyricListRef, pureMusicLyric, playingLyric } = useLyric(songReady, currentTime)
        const { currentShow, middleRStyle, middleLStyle, onMiddleTouchStart, onMiddleTouchMove, onMiddleTouchEnd } = useMiddleInteractive()
        const { cdWrapperRef, enter, afterEnter, leave, afterLeave } = useAnimation()
        const { savePlay } = usePlayHistory()

        // computed 因为playing是一个计算属性，需要.value获取到值
        const playIcon = computed(() => {
            return playing.value ? 'icon-pause' : 'icon-play'
        })
        const disableCls = computed(() => {
            return songReady.value ? '' : 'disable'
        })
        const progress = computed(() => {
            return currentTime.value / currentSong.value.duration
        })

        // watch API
        // 歌曲播放
        watch(currentSong, (newSong) => {
            if (!newSong.id || !newSong.url) {
                // newSong为空
                return
            }
            // 还没设url，肯定没准备好，因此要定义false
            currentTime.value = 0
            songReady.value = false
            const audioEl = audioRef.value
            audioEl.src = newSong.url
            audioEl.play()
            store.commit('setPlayingState', true)
        })
        // 歌曲暂停/续播
        watch(playing, (newPlaying) => {
            if (!songReady.value) {
                return
            }
            const audioEl = audioRef.value
            if (newPlaying) {
                audioEl.play()
                playLyric()
            } else {
            audioEl.pause()
            stopLyric()
            }
        })
        // set progress bar change with fullscreen
        watch(fullScreen, async (newFullScreen) => {
            if (newFullScreen) {
                // 在vue中访问数据依赖的dom需要nexttick后才能拿到想要的dom
                await nextTick()
                barRef.value.setOffset(progress.value)
            }
        })

        // methods
        // 收缩fullScreen
        function goBack() {
            return store.commit('setFullScreen', false)
        }
        // togglePlay切换播放状态
        function togglePlay() {
            if (!songReady.value) {
                return
            }
            store.commit('setPlayingState', !playing.value)
        }
        // 监听原生audio非交互pause的事件，播放完或者电脑待机
        function pause() {
            store.commit('setPlayingState', false)
        }
        // 前进
        function prev() {
            const list = playlist.value
            // 无数据情况
            if (!list.length || !songReady.value) {
                return
            }
            if (list.length === 1) {
                loop()
            } else {
                let index = currentIndex.value - 1
                if (index === -1) {
                    index = list.length - 1
                }
                store.commit('setCurrentIndex', index)
            }
        }
        // 后退
        function next() {
            const list = playlist.value
            // 无数据情况
            if (!list.length || !songReady.value) {
                return
            }
            // 如果只有一首歌边界条件
            if (list.length === 1) {
                loop()
            } else {
                let index = currentIndex.value + 1
                if (index === list.length) {
                    index = 0
                }
                store.commit('setCurrentIndex', index)
            }
        }
        // canplay回调函数，歌曲准备好时触发，返回true
        function ready() {
            if (songReady.value) {
                return
            }
            songReady.value = true
            playLyric()
            savePlay(currentSong.value)
        }
        // 防止一首歌有问题而无法切换的问题
        function error() {
            songReady.value = true
        }
        // 循环辅助函数
        function loop() {
            const audioEl = audioRef.value
            audioEl.currentTime = 0
            audioEl.play()
            store.commit('setPlayingState', true)
        }
        function updatetime(e) {
            // 优先级低于拖动
            if (!progressChanging) {
                currentTime.value = e.target.currentTime
            }
        }
        function end() {
            currentTime.value = 0
            // if loop
            if (playMode.value === PLAY_MODE.loop) {
                loop()
            } else {
                next()
            }
        }
        function onProgressChanging(progress) {
            progressChanging = true
            currentTime.value = currentSong.value.duration * progress
            // 同步到currentTime当前位置
            playLyric()
            // 停住
            stopLyric()
        }
        function onProgressChanged(progress) {
            progressChanging = false
            audioRef.value.currentTime = currentTime.value = currentSong.value.duration * progress
            if (!playing.value) {
                store.commit('setPlayingState', true)
            }
            // 同步到currentTime当前位置
            playLyric()
        }
        return {
            playlist,
            barRef,
            audioRef,
            disableCls,
            fullScreen,
            currentSong,
            currentTime,
            goBack,
            progress,
            playIcon,
            togglePlay,
            pause,
            prev,
            next,
            ready,
            error,
            // mode
            modeIcon,
            changeMode,
            // favorite
            getFavoriteIcon,
            toggleFavorite,
            // progressbar
            updatetime,
            formatTime,
            onProgressChanging,
            onProgressChanged,
            end,
            // cd
            cdCls,
            cdRef,
            cdImageRef,
            playingLyric,
            // lyric
            currentLyric,
            currentLineNum,
            lyricScrollRef,
            lyricListRef,
            pureMusicLyric,
            // lyric-cd interactive
            currentShow,
            middleRStyle,
            middleLStyle,
            onMiddleTouchStart,
            onMiddleTouchMove,
            onMiddleTouchEnd,
            // animation
            cdWrapperRef,
            enter,
            afterEnter,
            leave,
            afterLeave
        }
    }
}
</script>

<style lang="scss" scoped>
.player {
    .normal-player {
        position: fixed;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        z-index: 150;
        background: $color-background;
        .background {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            // 不透明度
            opacity: 0.6;
            filter: blur(20px);

            img {
                width: 100%;
                height: 100%;
            }
        }
        .top {
            position: relative;
            margin-bottom: 25px;
            .back {
                position: absolute;
                top: 0;
                left: 6px;
                z-index: 50;
            }
            .icon-back {
                display: block;
                padding: 9px;
                font-size: $font-size-large-x;
                color: $color-theme;
                transform: rotate(-90deg);
            }
            .title {
                width: 70%;
                margin: 0 auto;
                line-height: 40px;
                text-align: center;
                @include no-wrap();
                font-size: $font-size-large;
                color: $color-text;
            }
            .subtitle {
                line-height: 20px;
                text-align: center;
                font-size: $font-size-medium;
                color: $color-text;
            }
        }
        .middle {
            position: fixed;
            width: 100%;
            top: 80px;
            bottom: 170px;
            white-space: nowrap;
            font-size: 0;
            .middle-l {
                display: inline-block;
                vertical-align: top;
                position: relative;
                width: 100%;
                height: 0;
                // 百分比基于父元素宽度
                padding-top: 80%;
                .cd-wrapper {
                    position: absolute;
                    left: 10%;
                    top: 0;
                    width: 80%;
                    box-sizing: border-box;
                    height: 100%;
                    .cd {
                        width: 100%;
                        height: 100%;
                        border-radius: 50%;
                        img {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            height: 100%;
                            box-sizing: border-box;
                            border-radius: 50%;
                            border: 10px solid rgba(255,255,255,0.1);
                        }
                        .playing {
                            animation: rotate 20s linear infinite;
                        }
                    }
                }
                .playing-lyric-wrapper {
                    width: 80%;
                    margin: 30px auto 0 auto;
                    overflow: hidden;
                    text-align: center;
                    .playing-lyric {
                        height: 20px;
                        line-height: 20px;
                        font-size: $font-size-medium;
                        color: $color-text-l;
                    }
                }
            }
            .middle-r {
                display: inline-block;
                vertical-align: top;
                width: 100%;
                height: 100%;
                overflow: hidden;
                .lyric-wrapper {
                    width: 80%;
                    margin: 0 auto;
                    overflow: hidden;
                    text-align: center;
                    .text {
                        line-height: 32px;
                        color: $color-text-l;
                        font-size: $font-size-medium;
                        &.current {
                            color: $color-text;
                        }
                    }
                    .pure-music {
                    padding-top: 50%;
                    line-height: 32px;
                    color: $color-text-l;
                    font-size: $font-size-medium;
                    }
                }
            }
        }
        .bottom {
            position: absolute;
            bottom: 50px;
            width: 100%;
            .dot-wrapper {
                text-align: center;
                font-size: 0;
                .dot {
                    display: inline-block;
                    vertical-align: middle;
                    margin: 0 4px;
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: $color-text-l;
                    &.active {
                        width: 20px;
                        border-radius: 5px;
                        background: $color-text-ll;
                    }
                }
            }
            .progress-wrapper {
                display: flex;
                align-items: center;
                width: 80%;
                margin: 0px auto;
                padding: 10px 0;
                .time {
                    color: $color-text;
                    font-size: $font-size-small;
                    flex: 0 0 40px;
                    line-height: 30px;
                    width: 40px;
                    &.time-l {
                        text-align: left;
                    }
                    &.time-r {
                        text-align: right;
                    }
                }
                .progress-bar-wrapper {
                    flex: 1;
                }
            }
            .operators {
                display: flex;
                align-items: center;
                .icon {
                    flex: 1;
                    color: $color-theme;
                    &.disable {
                        color: $color-theme-d;
                    }
                    i {
                    font-size: 30px;
                    }
                }
                .i-left {
                    text-align: right;
                }
                .i-center {
                    // 左右间距
                    padding: 0 20px;
                    text-align: center;
                    i {
                        font-size: 40px;
                    }
                }
                .i-right {
                    text-align: left;
                    .icon-favorite {
                        color: $color-sub-theme;
                    }
                }
            }
        }
        // transition animation for normal player
        &.normal-enter-active, &.normal-leave-active {
            transition: all .6s;
            .top, .bottom {
                transition: all .6s cubic-bezier(0.45, 0, 0.55);
            }
        }
        &.normal-enter-from, &.normal-leave-to {
            opacity: 0;
            .top {
                transform: translate3d(0, -100px, 0);
            }
            .bottom {
                transform: translate3d(0, 100px, 0);
            }
        }
    }
}
</style>
