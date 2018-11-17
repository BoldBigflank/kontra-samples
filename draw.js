kontra.init('canvas')
var sprites = []

// Constants
const COLOR_GREEN = '#33ff33'

var sketch = {
    x: 0,
    y: 0,
    width: kontra.canvas.width,
    height:kontra.canvas.height,
    lines: [],
    color: COLOR_GREEN,
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
        this.lines.forEach((line) => {
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

// Set up the GUI
let reset = function() {
    sprites.forEach(s=>s.ttl=-1)
    // Drawing
    let s = kontra.sprite(sketch)
    kontra.pointer.track(s)
    sprites.push(s)
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