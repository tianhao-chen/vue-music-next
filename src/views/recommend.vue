<template>
    <div class="recommend" v-loading="loading">
        <scroll class="recommend-content">
            <div class="content-container">
                <div class="slider-wrapper">
                    <div class="slider-content">
                        <slider v-if="sliders.length" :sliders = "sliders"></slider>
                    </div>
                </div>
                <div class="recommend-list">
                    <h1 class="list-header" v-show = "!loading">热门歌单推荐</h1>
                    <ul>
                        <li
                        class = "item"
                        v-for = "item in albums"
                        :key = "item.id"
                        @click="selectAlbum(item)">
                            <div class = "icon">
                                <img width="60" height="60" v-lazy = "item.pic">
                            </div>
                            <div class="text">
                                <h2 class = "name">{{item.username}}</h2>
                                <p class="title">{{item.title}}</p>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </scroll>
        <router-view v-slot="{ Component }">
            <transition appear name="slide">
                <component :is="Component" :data="selectedAlbum"/>
            </transition>
        </router-view>
    </div>
</template>

<script>
    import { getRecommend } from '@/service/recommend'
    import Slider from '../components/base/slider/slider.vue'
    import Scroll from '../components/wrap-scroll'
    import { ALBUM_KEY } from '@/assets/js/constants'
    import storage from 'good-storage'

    export default {
        name: 'recommend',
        components: {
            Slider,
            Scroll
        },
        data() {
            return {
                sliders: [],
                albums: [],
                selectedAlbum: null
            }
        },
        computed: {
            loading() {
                return !this.sliders.length && !this.albums.length
            }
        },
        methods: {
            selectAlbum(item) {
            this.selectedAlbum = item
            // 缓存选中的singer
            this.cacheAlbum(item)
            // 路由跳转
            this.$router.push({
                path: `/recommend/${item.id}`
                })
            },
            cacheAlbum(item) {
                storage.session.set(ALBUM_KEY, item)
            }
        },
        async created() {
            const result = await getRecommend()
            this.sliders = result.sliders
            this.albums = result.albums
        }
    }
</script>

<style lang="scss" scoped>
    .recommend {
        position: fixed;
        width: 100%;
        top: 88px;
        bottom: 0;
        overflow: scroll;
        .recommend-content {
            height: 100%;
            overflow: hidden;
        }
        .slider-wrapper {
            position: relative;
            width: 100%;
            height: 0;
            padding-top: 40%;

            .slider-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
            }
        }
        .recommend-list {
            .list-header {
                height: 65px;
                line-height:65px;
                text-align: center;
                font-size: $font-size-medium;
                color: $color-theme;
            }
            .item {
                display: flex;
                box-sizing: border-box;
                align-items: center;
                padding: 0 20px 20px 20px;

                .icon {
                    flex: 0 0 60px;
                    width: 60px;
                    padding-right: 20px;
                }

                .text {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: flex-start;
                    flex: 1;
                    line-height: 20px;
                    overflow: hidden;
                    font-size: $font-size-medium;
                }

                .name {
                    margin-bottom: 10px;
                    color: $color-text;
                }

                .title {
                    color: $color-text-d;
                }
            }
        }
    }
</style>
