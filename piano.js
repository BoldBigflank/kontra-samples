kontra.init('canvas')
var loop
var sprites = []
var ac

// Constants
const COLOR_GREEN = '#33ff33'
const COLOR_AMBER = '#FFBF00'

var key = {
    originalColor: "#ffffff",
    color: "#ffffff",
    width: 56,
    height: 384,
    y: 0,
    onDown: function() {
        this.selected = true
        this.color = COLOR_AMBER
        if (ac === undefined) ac = new (window.AudioContext || window.webkitAudioContext)()
        this.o = ac.createOscillator()
        this.g = ac.createGain()
        this.o.connect(ac.destination)
        this.o.frequency.value = this.freq || 880
        this.g.connect(ac.destination)
        this.o.start(0)
    },
    onUp: function() {
        this.color = this.originalColor
        if (!ac) return
        this.selected = false
        if (this.o) this.o.stop()
    },
    update: function (dt) {
        if (this.selected && !kontra.pointer.pressed('left')) {
            this.onUp()
        }
    },
    render: function(dt) {
        kontra.context.fillStyle = this.color
        kontra.context.fillRect(this.x, this.y, this.width, this.height)
        kontra.context.strokeRect(this.x, this.y, this.width, this.height)
    }
}

// Set up the GUI
let reset = function() {
    sprites.forEach(s=>s.ttl=-1)
    let whiteKeys = [261.6, 293.7, 329.6, 349.2, 392, 440, 493.9, 523.3]
    let blackKeys = [277.2, 311.1, 370, 415.3, 466.2]
    let blackX = [30, 100, 200, 260, 320]
    whiteKeys.forEach((f,i) => {
        let s = kontra.sprite(key)
        kontra.pointer.track(s)
        s.freq = f
        s.x = i * (key.width + 2)
        sprites.push(s)
    })

    blackKeys.forEach((f,i) => {
        let s = kontra.sprite(key)
        kontra.pointer.track(s)
        s.color = s.originalColor = "#000000"
        s.height = s.height * 0.66
        s.freq = f
        s.y = 0
        s.x = blackX[i]
        sprites.push(s)
    })

    loop.start();
}

kontra.keys.bind('r', function() {
    reset()
})

// Boilerplate gameloop
loop = kontra.gameLoop({
    update(dt) {
        sprites.forEach(sprite => sprite.update(dt))
        sprites = sprites.filter(sprite => sprite.isAlive());
    },
    render() {
        sprites.forEach(sprite => sprite.render())
    }
});
this.loop = loop

kontra.canvas.addEventListener('mousedown', function (e) {
    if (loop.isStopped) reset()
})
kontra.canvas.addEventListener('touchstart', function (e) {
    if (loop.isStopped) reset()
})

reset()
