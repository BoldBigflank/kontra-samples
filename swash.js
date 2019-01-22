kontra.init('canvas')
var loop
var sprites = []
var ac
var ss, ssImage

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

    if (!ss) {
        console.log("ssImage", ssImage)
        ss = kontra.spriteSheet({
            image: ssImage,
            frameWidth: 16,
            frameHeight: 16,
            animations:  {
                p1: {
                    frames: 18,
                    loop: false
                },
                p2: {
                    frames: 19,
                    loop: false
                },
                p3: {
                    frames: 20,
                    loop: false
                },
                p4: {
                    frames: 21,
                    loop: false
                }
            }
        })
    }
    // Put the background up
    let shipImage = new Image()
    shipImage.onload = function () {
        let back = kontra.sprite({
            anchor: {x:0.5,y:0.5},
            image: shipImage,
            x: 240,
            y: 240,
            // update: function (dt) {
            //     this.advance()
            //     this.width += 4
            //     this.height += 4
            // }
        })
        sprites.unshift(back)
    }
    shipImage.src = 'images/ship.png'
    // Place the two players
    let p1 = kontra.sprite({
        anchor: {x:0.5, y:0.5},
        x: 32 * 5,
        y: 32 * 8,
        width: 32,
        height: 32,
        animations: ss.animations,
        // update: function (dt) {
        //     this.advance()
        //     this.width += 0.1
        //     this.height += 0.2
        // }
    })
    p1.playAnimation('p1')
    sprites.push(p1)

    // Put action buttons in six spots
    // Make a sequence, if necessary

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

ssImage = new Image()
ssImage.onload = function() {
    console.log("loaded")
    reset()
}
ssImage.src = 'images/pirates.v1.png'

