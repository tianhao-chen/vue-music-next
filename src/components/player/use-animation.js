import { ref } from 'vue'
import animations from 'create-keyframe-animation'

export default function useAnimation() {
    const cdWrapperRef = ref(null)
    let entering = false
    let leaving = false

    function enter(el, done) {
        // use the flag to check leaving and entering to avoid the mess while leave is not finished but enter is triggered again.
        if (leaving) {
            afterLeave()
        }
        entering = true
        const { x, y, scale } = getPosAndScale()

        const animation = {
            0: {
                transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`
            },
            100: {
                transform: 'translate3d(0, 0, 0) scale(1)'
            }
        }
        animations.registerAnimation({
            name: 'move',
            // transition animation
            animation,
            presets: {
                duration: 600,
                easing: 'cubic-bezier(0.45, 0, 0.55, 1)'
            }
        })
        animations.runAnimation(cdWrapperRef.value, 'move', done)
        // done--> afterEnter
    }

    function afterEnter() {
        animations.unregisterAnimation('move')
        cdWrapperRef.value.animation = ''
        entering = false
    }

    function leave(el, done) {
        if (entering) {
            afterEnter()
        }
        leaving = true
        const { x, y, scale } = getPosAndScale()
        const cdWrapperEl = cdWrapperRef.value

        cdWrapperEl.style.transition = 'all .6s cubic-bezier(0.45, 0, 0.55, 1)'
        cdWrapperEl.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`
        // 动态绑定事件，一定要注意手动解绑
        cdWrapperEl.addEventListener('transitionend', next)
        function next() {
            cdWrapperEl.removeEventListener('transitionend', next)
            done()
        }
    }

    function afterLeave() {
        const cdWrapperEl = cdWrapperRef.value
        cdWrapperEl.style.transition = ''
        cdWrapperEl.style.transform = ''
        leaving = true
    }

    function getPosAndScale() {
        // mini-cd
        const targetWidth = 40
        const miniPaddingLeft = 40
        const miniPaddingBottom = 30
        // cd
        const paddingTop = 80
        const width = window.innerWidth * 0.8
        // mini to cd: x & y
        // origin of screen is at the top-left corner as (0, 0). so x should be negative
        const x = -(window.innerWidth / 2 - miniPaddingLeft)
        const y = window.innerHeight - paddingTop - width / 2 - miniPaddingBottom

        const scale = targetWidth / width

        return {
            x,
            y,
            scale
        }
    }

    return {
        cdWrapperRef,
        enter,
        afterEnter,
        leave,
        afterLeave
    }
}
