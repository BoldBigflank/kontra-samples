kontra.init('canvas')
var sprites = []

// Constants
const COLOR_GREEN = '#33ff33'
const COLOR_RED = '#ff0033'
const COLOR_GREY = '#8a8a8a'

var sketch = {
    x: 0,
    y: 0,
    width: kontra.canvas.width,
    height:kontra.canvas.height,
    lines: [],
    color: COLOR_RED,
    thickness: 5,
    onDown: function () {
        this.drawing = true;
        // Add a new line
        this.lines.push([{x: kontra.pointer.x, y: kontra.pointer.y}])
    },
    onOver: function () {
        if (this.drawing) {
            let line = this.lines[this.lines.length-1]
            line.push({x: kontra.pointer.x, y: kontra.pointer.y})
        }
    },
    onUp: function () {
        this.drawing = false;
    },
    render: function (dt) {
        let context = kontra.context
        context.strokeStyle = this.color
        context.lineWidth = this.thickness,
        // console.log(this.drawing)


        // Make a shape to 'snip'
        context.save()
        context.fillStyle = 'white'
        context.fillRect(50, 50, kontra.canvas.width-100, kontra.canvas.height-100)
        context.restore()

        this.lines.forEach((line, i) => {
            context.beginPath();
            context.moveTo(line[0].x, line[0].y)
            line.forEach((point) => {
                context.lineTo(point.x, point.y)
            })
            // dot the current line
            if (this.drawing && i === this.lines.length-1) {
                context.setLineDash([16, 8])
                context.stroke()
            } else {
                // Fill other lines
                context.closePath()
                context.fillStyle = "#8a8a8a"
                context.fill()                
            }
        })
    }
}

// Set up the GUI
let reset = function() {
    sprites.forEach(s=>s.ttl=-1)
    // Drawing
    let s = kontra.sprite(sketch)
    kontra.pointer.track(s)
    sprites.push(s)
    // document.addEventListener('mousedown', s.onDown.bind(s), false)
    // document.addEventListener('mousemove', s.onOver.bind(s), false)
    // document.addEventListener('mouseup', s.onUp.bind(s), false)
    // document.addEventListener('touchstart', s.onDown.bind(s), false)
    // document.addEventListener('touchmove', s.onOver.bind(s), false)
    // document.addEventListener('touchend', s.onUp.bind(s), false)
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