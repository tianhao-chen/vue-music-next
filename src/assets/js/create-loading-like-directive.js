import { createApp } from 'vue'
import { addClass, removeClass } from '@/assets/js/dom'

const relativeCls = 'g-relative'

export default function createLoadinglikeDirective(Comp) {
    return {
        mounted(el, binding) {
            const app = createApp(Comp)
            const instance = app.mount(document.createElement('div'))
            const name = Comp.name
            if (!el[name]) {
                el[name] = {}
            }
            // 用name区分开不同comp
            el[name].instance = instance
            const title = binding.arg
            if (typeof title !== 'undefined') {
                instance.setTitle(title)
            }
            if (binding.value) {
                append(el)
            }
        },
        updated(el, binding) {
            const title = binding.arg
            const name = Comp.name
            if (typeof title !== 'undefined') {
                el[name].instance.setTitle(title)
            }
            if (binding.value !== binding.oldValue) {
                binding.value ? append(el) : remover(el)
            }
        }
    }

    function append(el) {
    const name = Comp.name
    const style = getComputedStyle(el)
    if (['absolute', 'fixed', 'relative'].indexOf(style.position) === -1) {
        addClass(el, relativeCls)
    }
    el.appendChild(el[name].instance.$el)
}

    function remover(el) {
        const name = Comp.name
        removeClass(el, relativeCls)
        el.removeChild(el[name].instance.$el)
    }
}
