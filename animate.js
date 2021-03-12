kontra.init('canvas')
var sprites = []

// Constants
const COLOR_GREEN = '#33ff33'
const COLOR_RED = '#fb405a'
const COLOR_BACKGROUND = '#dedede'
const COLOR_ONION = '#cccccc'

// State
const state = {
    activeFrame: 0,
    drawing: false,
    frames: [{
        lines: []
    }, {
        lines: []
    }]
}

var sketch = {
    x: 0,
    y: 0,
    width: kontra.canvas.width,
    height:kontra.canvas.width,
    lines: [],
    color: COLOR_RED,
    onionColor: COLOR_ONION,
    thickness: 8,
    flipDelay: 30,
    onDown: function () {
        state.drawing = true;
        // Add a new line
        state.frames[state.activeFrame].lines.push([{x: kontra.pointer.x, y: kontra.pointer.y}])
    },
    onOver: function () {
        if (state.drawing) {
            const lines = state.frames[state.activeFrame].lines
            let line = lines[lines.length-1]
            line.push({x: kontra.pointer.x, y: kontra.pointer.y})
        }
    },
    onUp: function () {
        state.drawing = false;
    },
    update: function (dt) {
        if (!kontra.pointer.pressed('left')) state.drawing = false
        if (state.preview) {
            // Flip every 30 frames
            this.flipDelay += -1
            if (this.flipDelay < 1) {
                this.flipDelay = 30
                state.activeFrame = (state.activeFrame === 1) ? 0 : 1
            }
        }
    },
    render: function (dt) {
        let context = kontra.context
        // Background
        context.fillStyle = COLOR_BACKGROUND
        context.fillRect(this.x, this.y, this.width, this.height)

        // Onion skin
        if (!state.preview) {
            context.strokeStyle = this.onionColor
            context.lineWidth = this.thickness
            const altFrame = (state.activeFrame === 0) ? 1 : 0
            const lines = state.frames[altFrame].lines || []
            lines.forEach((line) => {
                context.beginPath();
                context.moveTo(line[0].x, line[0].y)
                line.forEach((point) => {
                    context.lineTo(point.x, point.y)
                })
                // context.closePath()
                context.stroke()
            })
        }

        // Line
        context.strokeStyle = this.color
        context.lineWidth = this.thickness
        const lines = state.frames[state.activeFrame].lines || []
        lines.forEach((line) => {
            context.beginPath();
            context.moveTo(line[0].x, line[0].y)
            line.forEach((point) => {
                context.lineTo(point.x, point.y)
            })
            // context.closePath()
            context.stroke()
        })
    }
}

let frameButton = {
    x: 10,
    y: kontra.canvas.width + 10,
    width: 50,
    height: 50,
    color: 'red',
    onDown: function() {
        if (state.drawing) return
        state.activeFrame = (state.activeFrame === 1) ? 0 : 1
        state.preview = false
    }
}

let previewButton = {
    x: 0.5 * kontra.canvas.width - 25,
    y: kontra.canvas.width + 10,
    width: 50,
    height: 50,
    color: 'green',
    onDown: function () {
        if (state.drawing) return
        state.preview = !state.preview
    }
}

// Set up the GUI
let reset = function() {
    sprites.forEach(s=>s.ttl=-1)
    // Drawing
    let s = kontra.sprite(sketch)
    kontra.pointer.track(s)
    sprites.push(s)

    let f = kontra.sprite(frameButton)
    kontra.pointer.track(f)
    sprites.push(f)

    let p = kontra.sprite(previewButton)
    kontra.pointer.track(p)
    sprites.push(p)
}

// Boilerplate gameloop
var loop = kontra.gameLoop({
    update(dt) {
        sprites.forEach(sprite => sprite.update(dt))
        sprites = sprites.filter(sprite => sprite.isAlive());
    },
    render() {
        sprites.forEach(sprite => sprite.render())
    }
});
this.loop = loop

reset()
loop.start();