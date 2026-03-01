import { createApp, ref, reactive, watch, computed, onMounted } from 'https://unpkg.com/vue@3.5.29/dist/vue.esm-browser.prod.js'
import { locales } from './locales.js'

createApp({
  setup () {
    const canvas = ref(null)
    const mode = ref('simple')
    const img = new Image()

    const getBestLocale = function () {
      const code = navigator.language.slice(0, 2)
      return locales[code] ? code : 'en'
    }

    const localeKey = ref(getBestLocale())
    const currentLocale = computed(function () {
      return locales[localeKey.value]
    })

    const simple = reactive({
      topic: '',
      experts: '',
      example: '',
      response: '',
      isPlural: false
    })

    const advanced = reactive({
      top: '',
      bottom: '',
      ofCourse: '',
      footer: ''
    })

    function interpolate (template, params) {
      return template.replace(/\{([^}]+?)\}/g, function (all, key) {
        return params[key] || ''
      })
    }

    function syncToAdvanced () {
      if (mode.value !== 'simple') return
      const l = currentLocale.value
      const p = {
        topic: simple.topic || l.defaults.topic,
        experts: simple.experts || l.defaults.experts,
        example: simple.example || l.defaults.example,
        response: simple.response || l.defaults.response
      }

      const template = simple.isPlural ? l.templateTopPlural : l.templateTopSingular
      advanced.top = interpolate(template, p)
      advanced.bottom = interpolate(l.templateBottom, p)
      advanced.ofCourse = l.ofCourse
      advanced.footer = l.footer
    }

    function drawText (ctx, text, x, y, w, h, align = 'left', valign = 'top', fontSize = 18) {
      ctx.font = `${fontSize}px xkcd-script, "Comic Sans MS", cursive`
      const words = text.toUpperCase().split(/\s+/)
      const lines = []
      let currentLine = ''

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word
        if (ctx.measureText(testLine).width > w && currentLine) {
          lines.push(currentLine)
          currentLine = word
        } else {
          currentLine = testLine
        }
      }
      lines.push(currentLine)

      const lineHeight = fontSize * 1.1
      const blockHeight = lines.length * lineHeight

      if (blockHeight > h && fontSize > 8) {
        return drawText(ctx, text, x, y, w, h, align, valign, fontSize - 1)
      }

      let drawY = y
      if (valign === 'bottom') drawY = y + (h - blockHeight)
      if (valign === 'center') drawY = y + (h - blockHeight) / 2

      ctx.textAlign = align
      ctx.textBaseline = 'top'
      lines.forEach(function (line, i) {
        ctx.fillText(line, x, drawY + (i * lineHeight))
      })
    }

    function draw () {
      if (!canvas.value || !img.complete) return

      const ctx = canvas.value.getContext('2d')
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)

      ctx.scale(2, 2)
      ctx.drawImage(img, 0, 0, 295, 480)

      ctx.fillStyle = 'white'
      ctx.fillRect(26, 21, 241, 114)
      ctx.fillRect(88, 150, 181, 16)
      ctx.fillRect(26, 177, 85, 18)
      ctx.fillRect(0, 395, 295, 85)

      ctx.fillStyle = 'black'
      drawText(ctx, advanced.top, 30, 25, 235, 110, 'left', 'bottom')
      drawText(ctx, advanced.bottom, 285, 150, 220, 45, 'right', 'top')

      ctx.font = '17px xkcd-script, "Comic Sans MS", cursive'
      ctx.textAlign = 'left'
      ctx.fillText(advanced.ofCourse.toUpperCase(), 25, 178)

      drawText(ctx, advanced.footer, 147, 400, 285, 75, 'center', 'center', 16)
    }

    const saveImage = function () {
      const link = document.createElement('a')
      link.download = 'comic.png'
      link.href = canvas.value.toDataURL('image/png')
      link.click()
    }

    const copyImage = async function () {
      canvas.value.toBlob(async function (blob) {
        const item = new ClipboardItem({ 'image/png': blob })
        await navigator.clipboard.write([item])
        window.alert(currentLocale.value.copySuccess)
      })
    }

    watch(currentLocale, function (newLocale) {
      document.documentElement.lang = newLocale.lang
    }, { immediate: true })

    watch([simple, localeKey, mode], function () {
      syncToAdvanced()
      draw()
    }, { immediate: true, deep: true })

    watch(advanced, function () {
      draw()
    }, { deep: true })

    onMounted (function () {
      img.src = 'assets/comic_retina.png'
      img.onload = function () {
        document.fonts.ready.then(draw)
      }
    })

    return { canvas, mode, localeKey, locales, currentLocale, simple, advanced, saveImage, copyImage }
  }
}).mount('#app')
