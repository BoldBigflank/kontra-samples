kontra.init('canvas')
var sprites = []

// Constants
const COLOR_AMBER = '#FFBF00'
const COLOR_GREEN = '#33ff33'

// Helper functions
var degreesToRadians = function (deg) {
  return deg * Math.PI / 180;
}

function lerp (min, max, t) {
    return min * (1-t) + max * t
}

function damp (a, b, lambda, dt) {
    return lerp(a, b, 1 - Math.exp(-lambda * dt))
}

function clamp (val, a, b) {
    if (a < b) {
        return Math.max(a, Math.min(b, val)) 
    } else {
        return Math.max(b, Math.min(a, val)) 
    }
}

var camera = {
    x: 0,
    y: 0,
    width:100,
    height: 100,
    snapshot: function (save) {
        if (save) {
            let image = new Image();
            image.onload = function () {
                this.image = image
            }.bind(this)
            this.canvas.width = this.video.videoWidth
            this.canvas.height = this.video.videoHeight
            this.canvas.getContext('2d').drawImage(this.video,0,0, this.canvas.width, this.canvas.height)
            image.src = this.canvas.toDataURL()
        } else {
            this.image = undefined;
        }
    },
    update: function (dt) {
        if (!this.initialized) {
            this.video = document.getElementById('video')
            
            this.canvas = document.createElement('canvas');

            navigator.mediaDevices.getUserMedia({
                audio: false, video: true
            }).then((stream) => {
                this.video.srcObject = stream;
                this.canvas.width = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;
            }).catch((error) => {
                console.log('navigator.getUserMedia error', error)
            })

            this.initialized = true
        }
    },
    render: function (dt) {
        kontra.context.save()
        kontra.context.translate(kontra.canvas.width, 0)
        kontra.context.scale(-1, 1)
        if (this.image) {
            // Originally: Draw the image
            // kontra.context.drawImage(this.image, 0, 0);

            // Mask a circle of the image
            kontra.context.save()
            kontra.context.beginPath()
            kontra.context.scale(1,5/4)
            kontra.context.moveTo(256,256)
            kontra.context.arc(kontra.canvas.width * 0.5, kontra.canvas.height * 0.3, kontra.canvas.width * 0.2, 0, Math.PI * 2, true)
            kontra.context.closePath()
            kontra.context.clip()
            kontra.context.scale(1, 4/5)
            kontra.context.drawImage(this.image, 0, 0)
            kontra.context.restore()
        } else if (this.video) {
            kontra.context.drawImage(this.video, 0, 0)

            // Draw a circle to preview
            kontra.context.save()
            kontra.context.beginPath()
            kontra.context.scale(1,5/4)
            // kontra.context.moveTo(256,256)
            kontra.context.arc(kontra.canvas.width * 0.5, kontra.canvas.height * 0.3, kontra.canvas.width * 0.2, 0, Math.PI * 2, true)
            kontra.context.closePath()
            kontra.context.stroke();
            kontra.context.restore()
        }
        kontra.context.restore()
    }
}

var cameraButton = {
    x: kontra.canvas.width * 0.5,
    y: kontra.canvas.height - 32,
    width: 64,
    height: 64,
    color: COLOR_AMBER,
    anchor: {
        x: 0.5,
        y: 0.5
    },
    onDown: function (e) {
        this.camera.snapshot(false)
        // Clear the sketch
        this.sketch.lines = []
    },
    onUp: function (e) {
        this.camera.snapshot(true)
    }
}

var sketch = {
    x: 0,
    y: 0,
    width: kontra.canvas.width,
    height:kontra.canvas.height - 64,
    lines: [],
    color: "#000",
    thickness: 8,
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
    // Camera
    let s = kontra.sprite(camera)
    kontra.pointer.track(s)
    sprites.push(s)
    
    // Drawing
    let sketchSprite = kontra.sprite(sketch)
    kontra.pointer.track(sketchSprite)
    sprites.push(sketchSprite)

    // Camera button
    let cameraButtonSprite = kontra.sprite(cameraButton)
    cameraButtonSprite.camera = s
    cameraButtonSprite.sketch = sketchSprite
    kontra.pointer.track(cameraButtonSprite)
    sprites.push(cameraButtonSprite)


    // Tell the camera button about the sketch
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