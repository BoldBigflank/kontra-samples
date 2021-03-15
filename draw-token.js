kontra.init('canvas')
var sprites = []

// Constants
const COLOR_GREEN = '#33ff33'
const COLOR_RED = '#fb405a'
const COLOR_BACKGROUND = '#dedede'
const COLOR_ONION = '#cccccc'

// State
const state = {
    mode: 'drawing', // or moving
    interaction: false,
    lines: []
    // symbol
}

var sketch = {
    x: 0,
    y: 0,
    width: kontra.canvas.width,
    height: kontra.canvas.width,
    lines: [],
    color: 'black',
    thickness: 8,
    mode: 'drawing',
    onDown: function () {
        if (state.mode === 'drawing') {
            state.interaction = 'drawing';
            // Add a new line
            state.lines.push([{ x: kontra.pointer.x, y: kontra.pointer.y }])
        }
        if (state.mode === 'moving') {
            const currentCoord = { x: kontra.pointer.x, y: kontra.pointer.y }
            const distance = Math.sqrt(Math.pow((currentCoord.x - state.symbol.x), 2) + Math.pow(currentCoord.y - state.symbol.y, 2))
            state.interaction =  (distance < 30) ? 'translate' : 'scale'
            this.lastCoord = { x: kontra.pointer.x, y: kontra.pointer.y }
        }
    },
    onOver: function () {
        if (!state.interaction) return
        if (state.mode === 'drawing') {
            const lines = state.lines
            let line = lines[lines.length - 1]
            line.push({ x: kontra.pointer.x, y: kontra.pointer.y })
        }
        if (state.mode === 'moving') {
            const currentCoord = { x: kontra.pointer.x, y: kontra.pointer.y }
            // Translate
            if (state.interaction === 'translate') {
                state.symbol.x += currentCoord.x - this.lastCoord.x
                state.symbol.y += currentCoord.y - this.lastCoord.y
            }
            if (state.interaction === 'scale') {
                // Scale from center
                const oldLength = Math.sqrt(Math.pow((this.lastCoord.x - state.symbol.x), 2) + Math.pow(this.lastCoord.y - state.symbol.y, 2))
                const newLength = Math.sqrt(Math.pow((currentCoord.x - state.symbol.x), 2) + Math.pow(currentCoord.y - state.symbol.y, 2))
                state.symbol.scale = state.symbol.scale * (newLength / oldLength)

                // Rotate
                var startAngle = Math.atan2((this.lastCoord.y - state.symbol.y), (this.lastCoord.x - state.symbol.x)) + Math.PI
                var newAngle = Math.atan2((currentCoord.y - state.symbol.y), (currentCoord.x - state.symbol.x)) + Math.PI
                if (newAngle < startAngle) newAngle += 2 * Math.PI
                state.symbol.rotation += newAngle - startAngle
            }

            this.lastCoord = currentCoord
        }
    },
    onUp: function () {
        state.interaction = false;
        if (!state.symbol) {
            let minX = Infinity
            let maxX = 0
            let minY = Infinity
            let maxY = 0
            const line = [...state.lines[0]]
            
            // Mark the boundaries
            line.forEach((point) => {
                minX = Math.min(minX, point.x)
                maxX = Math.max(maxX, point.x)
                minY = Math.min(minY, point.y)
                maxY = Math.max(maxY, point.y)
            })

            // Convert the first line to the symbol
            const symbolX = (minX + maxX) / 2
            const symbolY = (minY + maxY) / 2
            state.symbol = {
                line: line.map((point) => {
                    return {
                        x: point.x - symbolX,
                        y: point.y - symbolY
                    }
                }),
                x: symbolX,
                y: symbolY,
                rotation: 0,
                scale: 1,
                width: maxX - minX,
                height: maxY - minY
            }
            
            // Remove from the regular lines
            state.lines = []
        }
    },
    update: function (dt) {
        if (state.interaction && !kontra.pointer.pressed('left')) this.onUp()
    },
    render: function (dt) {
        let context = kontra.context
        // Background
        context.fillStyle = COLOR_BACKGROUND
        context.fillRect(this.x, this.y, this.width, this.height)

        // Line
        context.strokeStyle = this.color
        context.lineWidth = this.thickness
        const lines = state.lines || []
        lines.forEach((line) => {
            context.beginPath();
            context.moveTo(line[0].x, line[0].y)
            line.forEach((point) => {
                context.lineTo(point.x, point.y)
            })
            // context.closePath()
            context.stroke()
        })

        // Symbol
        if (state.symbol) {
            context.save()
            
            // translate, rotate, scale
            context.translate(state.symbol.x, state.symbol.y)
            context.rotate(state.symbol.rotation)
            // scale is faked bc we don't want to mess with line widths

            // Draw the line
            context.scale(state.symbol.scale, state.symbol.scale)
            context.strokeStyle = (state.mode === 'moving') ? COLOR_RED : 'black'
            context.lineWidth = this.thickness / state.symbol.scale
            const line = state.symbol.line || []
            context.beginPath();
            context.moveTo(line[0].x, line[0].y)
            line.forEach((point) => {
                context.lineTo(point.x, point.y)
            })
            // context.closePath()
            context.stroke()
            
            if (state.mode === 'moving') {
                // Draw the move widget
                context.strokeStyle = COLOR_ONION
                context.lineWidth = 0.5 * this.thickness / state.symbol.scale
                context.beginPath()
                context.arc(0, 0, 30 / state.symbol.scale, 0, 2 * Math.PI)
                context.stroke()
            }

            context.restore()
        }
    }
}

let modeToggleButton = {
    x: 10,
    y: kontra.canvas.width + 10,
    width: 50,
    height: 50,
    color: 'red',
    update(dt) {
        this.color = (state.mode === 'drawing') ? 'black' : COLOR_RED
    },
    onDown() {
        if (state.interaction) return
        if (!state.symbol) return
        state.mode = (state.mode === 'drawing') ? 'moving' : 'drawing'
    }
}

let undoButton = {
    x: kontra.canvas.width - 60,
    y: kontra.canvas.width + 10,
    width: 50,
    height: 50,
    color: 'blue',
    onDown() {
        if (state.interaction) return
        if (!state.lines || !state.lines.length) return
        state.lines.pop()
    }
}


// Set up the GUI
let reset = function () {
    sprites.forEach(s => s.ttl = -1)
    // Drawing
    let s = kontra.sprite(sketch)
    kontra.pointer.track(s)
    sprites.push(s)

    let f = kontra.sprite(modeToggleButton)
    kontra.pointer.track(f)
    sprites.push(f)

    let u = kontra.sprite(undoButton)
    kontra.pointer.track(u)
    sprites.push(u)
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