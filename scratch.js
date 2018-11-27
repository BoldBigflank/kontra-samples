kontra.init('canvas')
var sprites = []

// Constants
const COLOR_GREEN = '#33ff33'

let cherry = {
    x: 0,
    y: 0,
    width: 60,
    height: 60,
    color: '#ff0000',
}

var sketch = {
    x: 0,
    y: 0,
    width: 120,
    height:120,
    color: COLOR_GREEN,
    thickness: 5,
    shuffle: function (pct) {
        if (pct === undefined) pct = 0.5
        this.color = (Math.random() < pct) ? "#33ff33" : "#ff0000"
    },
    onDown: function () {
        this.drawing = true;
        // Add a new line
        this.lines.push([{x: kontra.pointer.x - this.x, y: kontra.pointer.y - this.y}])
    },
    onOver: function () {
        if (this.drawing) {
            let line = this.lines[this.lines.length-1]
            line.push({x: kontra.pointer.x - this.x, y: kontra.pointer.y - this.y})
        }
    },
    onUp: function () {
        this.drawing = false;
    },
    update: function (dt) {
        if (!this.lines) this.lines = []
        if (!this.hiddenCanvas) {
            this.hiddenCanvas = document.createElement('canvas');
            this.hiddenCanvas.width = this.width
            this.hiddenCanvas.height = this.height
        }
    },
    render: function (dt) {
        if (!this.hiddenCanvas) return
        let context = this.hiddenCanvas.getContext('2d')
        context.save()
        context.fillStyle="#333333"
        context.fillRect(0, 0, this.width, this.height)

        context.globalCompositeOperation = "destination-out"
        context.strokeStyle = this.color
        context.lineWidth = this.thickness
        this.lines.forEach((line) => {
            context.beginPath();
            context.moveTo(line[0].x, line[0].y)
            line.forEach((point) => {
                context.lineTo(point.x, point.y)
            })
            // context.closePath()
            context.stroke()
        })

        context.globalCompositeOperation = "destination-over"
        context.fillStyle = this.color
        context.fillRect(45, 45, 30, 30)

        context.restore()
        kontra.context.drawImage(this.hiddenCanvas, this.x, this.y)
    }
}

// Set up the GUI
let reset = function() {
    sprites.forEach(s=>s.ttl=-1)
    // Scratchers
    for (let i = 0; i < 3; i++) {
        let s = kontra.sprite(sketch)
        s.shuffle([1, 0.75, 0.5][i])

        let x = i * kontra.canvas.width * 2 / 6 + kontra.canvas.width / 6 - s.width * 0.5
        let y = kontra.canvas.height * 0.5

        s.x = x
        s.y = y
        kontra.pointer.track(s)
        sprites.push(s)
        
    }
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