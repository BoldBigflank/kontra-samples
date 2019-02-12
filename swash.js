kontra.init('canvas')
var loop
var sprites = []
var ss // spritesheet
var gameSprite // Where the magic happens


// Constants
const COLOR_GREEN = '#33ff33'
const COLOR_AMBER = '#FFBF00'
const GAME_BEATS = [0,0,0,0,
                    1,1,1,1,
                    2,2,2,2,
                    3,3,3,3,
                    4,4,4,4,
                    5,5,5,5] // Shuffle this sucker
const ACTION_POSITIONS = [
    {x: 32 * 5, y: 32 * 5},
    {x: 32 * 5, y: 32 * 7},
    {x: 32 * 5, y: 32 * 9},

    {x: 32 * 7, y: 32 * 9},
    {x: 32 * 7, y: 32 * 7},
    {x: 32 * 7, y: 32 * 5}
]

// Assets
const ssImage = 'images/pirates.v1.png'
const shipImage = 'images/ship.png'


// Helper functions
function shuffle(array) {
    var m = array.length, t, i;

    // While there remain elements to shuffle…
    while (m) {
        // Pick a remaining element…
        i = Math.floor(Math.random() * m--);

        // And swap it with the current element.
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }

    return array;
}

// Sprites
var time = {
    x: 0,
    y: 0,
    dy: -60,
    value: 0,
    ttl: 30,
    render: function(dt) {
        kontra.context.save()
        kontra.context.font = '32px Courier New'
        kontra.context.fillStyle = (this.value < 30) ? COLOR_GREEN : (this.value < 60) ? COLOR_AMBER : 'red'
        kontra.context.fillText(this.value, this.x, this.y)
        kontra.context.restore()
    }
}

var actionButton = {
    type: 'action',
    anchor: {x: 0.5, y: 0.5},
    width:32,
    height:32,
    index: 0,
    active: false,
    color: "red",
    timer: 0,
    // A button that accepts input. Visible when it's correct
    onDown: function(e) {
        if (!this.active) return
        // Tell the gamestuff it's hit
        gameSprite.buttonHit(this.index, this.timer)

        let s = kontra.sprite(time)
        s.value = this.timer
        s.x = this.x
        s.y = this.y
        sprites.push(s)
        this.timer = 0
    },
    update: function (dt) {
        this.active = gameSprite.beats[gameSprite.beatsIndex] === this.index
        this.timer = (this.active) ? this.timer + 1 : 0
        this.color = (this.timer < 30) ? COLOR_GREEN : (this.timer < 60) ? COLOR_AMBER : 'red'
        this.advance()
    },
    render: function (dt) {
        if (this.active) {
            this.draw()
        }
    }
}

var game = {
    result: [],
    buttonHit: function (i, timer) {
        if (i === this.beats[this.beatsIndex]) {
            // Correct!
            console.log("correct!")
            this.result.push(timer)
        } else {
            // Incorrect!
            console.log("Incorrect")
        }
        this.beatsIndex++
    },
    update: function (dt) {
        // Show the correct
        let currentBeat = this.beats[this.beatsIndex]
        let buttons = sprites.filter(s => { s.type === 'action' })
        buttons.forEach(b => {
            b.active = (b.index === currentBeat)
        })
    }
}

// Set up the GUI
let reset = function() {
    sprites.forEach(s=>s.ttl=-1)

    // The Game sprite
    gameSprite = kontra.sprite(game)
    gameSprite.beats = shuffle(GAME_BEATS.slice(0)) // Make a fresh shuffle
    gameSprite.beatsIndex = 0
    sprites.push(gameSprite)

    // Images
    kontra.assets.load(ssImage, shipImage)
    .then((images) => {
        let background = kontra.sprite({
            image: kontra.assets.images[shipImage],
            x: 0,
            y: 0,
            width:480,
            height:480
        })
        sprites.unshift(background)
        // Spritesheet
        if (!ss) {
            ss = kontra.spriteSheet({
                image: kontra.assets.images[ssImage],
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

        // Place the two players
        let p1 = kontra.sprite({
            anchor: {x:0.5, y:0.5},
            x: 32 * 5,
            y: 32 * 8,
            width: -32,
            height: 32,
            animations: ss.animations
        })
        p1.playAnimation('p1')
        sprites.push(p1)

        // Place the two players
        let p2 = kontra.sprite({
            anchor: {x:0.5, y:0.5},
            x: 32 * 7,
            y: 32 * 8,
            width: 32,
            height: 32,
            animations: ss.animations
        })
        p2.playAnimation('p2')
        sprites.push(p2)

        // The action buttons
        for (let i = 0; i < ACTION_POSITIONS.length; i++) {
            let s = kontra.sprite(actionButton)
            s.index = i
            s.x = ACTION_POSITIONS[i].x
            s.y = ACTION_POSITIONS[i].y
            sprites.push(s)
            kontra.pointer.track(s)
        }
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