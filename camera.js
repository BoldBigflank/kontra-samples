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
            // this.video = document.createElement("video")
            // this.video.setAttribute('playsinline', '')
            // this.video.setAttribute('autoplay', '')
            // this.video.setAttribute('style', 'display:none;')
            // document.body.appendChild(this.video)
            this.video = document.getElementById('video')
            
            this.canvas = document.createElement('canvas');
            this.canvas.setAttribute('style', 'display:none;')
            document.body.appendChild(this.canvas)

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
            kontra.context.drawImage(this.image, 0, 0);
        } else if (this.video) {
            kontra.context.drawImage(this.video, 0, 0)
        } else {
            console.log("no video")
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
    },
    onUp: function (e) {
        this.camera.snapshot(true)
    }
}

// Set up the GUI
let reset = function() {
    sprites.forEach(s=>s.ttl=-1)
    // Camera
    let s = kontra.sprite(camera)
    kontra.pointer.track(s)
    sprites.push(s)

    // Camera button
    let cameraButtonSprite = kontra.sprite(cameraButton)
    cameraButtonSprite.camera = s
    kontra.pointer.track(cameraButtonSprite)
    sprites.push(cameraButtonSprite)

    // Mask

    // Drawing


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