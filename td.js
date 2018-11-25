kontra.init('canvas')
var sprites = []

// Constants
const COLOR_GREEN = '#33ff33'
const COLOR_AMBER = '#FFBF00'
const TILE_SIZE = 48;
const FPS = 60;

const WAVES = [
    {
        baddies: [
            {type: 0, delay: 0},
            {type: 0, delay: 1 * FPS},
            {type: 0, delay: 2 * FPS},
            {type: 0, delay: 3 * FPS},
            {type: 0, delay: 4 * FPS},
            {type: 0, delay: 5 * FPS},
            {type: 0, delay: 6 * FPS},
            {type: 0, delay: 7 * FPS},
            {type: 0, delay: 8 * FPS},
            {type: 0, delay: 9 * FPS},
            {type: 0, delay: 10 * FPS},
            {type: 0, delay: 11 * FPS},
            {type: 0, delay: 12 * FPS},
            {type: 0, delay: 13 * FPS}
        ]
    }
]

const TYPES = [
    {type: 'baddy', health: 10, color: COLOR_AMBER, speed: 1, width: TILE_SIZE * 0.5, height: TILE_SIZE * 0.5},
    {type: 'baddy', health: 20, color: COLOR_GREEN, speed: .5, width: TILE_SIZE * 0.8, height: TILE_SIZE * 0.8}
]
const PATHS = [
    {points: [
        {x: 1, y: 1},
        {x: 1, y: 9},
        {x: 3, y: 9},
        {x: 3, y: 1},
        {x: 5, y: 1},
        {x: 5, y: 9},
        {x: 7, y: 9},
        {x: 7, y: 1},
        {x: 9, y: 1},
        {x: 9, y: 9},
    ]}
]

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

var normalize = function (n) {
    var magnitude = Math.sqrt(n.x*n.x + n.y*n.y)
    n = {
        x: n.x / magnitude,
        y: n.y / magnitude
    }
    return n
}

var lemmingMove = function(dt) {
    this.advance()
    if (this.desiredX === undefined || this.desiredY === undefined) {
        this.pathIndex = 0;
        this.desiredX = PATHS[0].points[this.pathIndex].x * TILE_SIZE
        this.desiredY = PATHS[0].points[this.pathIndex].y * TILE_SIZE
        this.x = this.desiredX
        this.y = this.desiredY
    }
    if (Math.abs(this.x - this.desiredX) < 0.1 && Math.abs(this.y - this.desiredY) < 0.1) {
        // Get a new target
        this.pathIndex++
        console.log("new position", this.pathIndex)
        if (PATHS[0].points[this.pathIndex]) {
            this.desiredX = PATHS[0].points[this.pathIndex].x * TILE_SIZE
            this.desiredY = PATHS[0].points[this.pathIndex].y * TILE_SIZE   
        } else {
            this.ttl = -1
        }
    } else {
        // console.log(this.x, this.y)
    }
    // Aim at the target


    let n = normalize({x: this.desiredX - this.x, y: this.desiredY - this.y})
    this.dx = n.x * this.speed
    this.dy = n.y * this.speed

    // If you made it to the desired tile position
    // Move to the next tile in the same velocity
    // If that tile is blocked, try to go down, right, left, up
    // Aim for the next tile
}

var path = {
    render: function (dt) {
        kontra.context.lineWidth = TILE_SIZE * 0.7
        kontra.context.beginPath()
        for (let i = 0; i < PATHS[0].points.length; i++) {
            let point = PATHS[0].points[i]
            if (i==0) kontra.context.moveTo(point.x*TILE_SIZE, point.y*TILE_SIZE)
            kontra.context.lineTo(point.x*TILE_SIZE, point.y*TILE_SIZE)
        }
        kontra.context.stroke()
    }
};

// Fire minigame - rub two sticks together
// Water minigame - pump the water
// ??? minigame - follow a needle on a dial to achieve maximum pressure

var waveLauncher = {
    currentWave: 0,
    currentBaddy: 0,
    ticks: 0,
    render: function (dt) {},
    update: function (dt) {
        // Add a baddy if this frame calls for it
        while(this.currentBaddy < WAVES[this.currentWave].baddies.length &&
            WAVES[this.currentWave].baddies[this.currentBaddy].delay == this.ticks) {
            console.log("making a baddy")
            let nextBaddy = WAVES[this.currentWave].baddies[this.currentBaddy]
            let s = kontra.sprite(TYPES[nextBaddy.type])
            s.anchor = {x: 0.5, y: 0.5}
            s.update = lemmingMove
            sprites.push(s)
            this.currentBaddy++
        }
        // To to the next frame
        // Wave ended
        if (this.currentBaddy > WAVES[this.currentWave].baddies.length) {
            if (sprites.filter(s=>s.type='baddy').length == 0) {
                this.currentWave++
                this.currentBaddy = 0
                this.ticks = 0
            }
        } else {
            this.ticks++
        }
    }
}

// Set up the GUI
let reset = function() {
    sprites.forEach(s=>s.ttl=-1)
    
    let p = kontra.sprite(path)
    sprites.push(p)
    let l = kontra.sprite(waveLauncher)
    sprites.push(l)
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