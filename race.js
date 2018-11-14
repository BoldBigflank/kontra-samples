
const COLOR_AMBER = '#FFBF00'
const COLOR_GREEN = '#33ff33'
kontra.init();

var sprites = []
let tileSize = 48

const map = [
  ['x','x','x','x','x','x','x','x','x','x'],
  ['x',' ',' ',' ',' ',' ',' ',' ','x','x'],
  ['x',' ','x','x','x','x','x',' ',' ','x'],
  ['x',' ',' ',' ','x',' ','x',' ',' ','x'],
  ['x','x','x',' ','x',' ','x',' ',' ','x'],
  ['x',' ',' ',' ','x',' ','x','x',' ','x'],
  ['x',' ',' ','x','x',' ',' ','x',' ','x'],
  ['x',' ','x','x','x','x','x','x',' ','x'],
  ['x',' ',' ',' ',' ','s',' ',' ',' ','x'],
  ['x','x','x','x','x','x','x','x','x','x']
]

var degreesToRadians = function (deg) {
  return deg * Math.PI / 180;
}

var score = kontra.sprite({
    x:0,
    y:480,
    laps:0,
    color: COLOR_GREEN,
    render: function () {
        // Make a progress bar
        this.context.fillStyle = '#333';
        this.context.fillRect(this.x, this.y, kontra.canvas.width, kontra.canvas.height - this.y)
        this.context.fillStyle = '#666';
        let percent = this.laps / 5.0;
        let percentWidth = percent * kontra.canvas.width
        this.context.fillRect(this.x, this.y, percentWidth, kontra.canvas.height - this.y)

        // Write the laps
        this.context.fillStyle = this.color;
        this.context.font = "48px Courier New"
        this.context.textBaseline = 'top'
        this.context.fillText(this.laps + '/5', this.x, this.y)
    }
})
sprites.unshift(score)

var car = kontra.sprite({
  x: 100,        // starting x,y position of the sprite
  y: 80,
  color: COLOR_GREEN,  // fill color of the sprite rectangle
  width: 20,     // width and height of the sprite rectangle
  height: 40,
  speed: 1.5,          // move the sprite 2px to the right every frame
  rotation: 0,
    crashFrames: 0,
    update: function () {
        this.color = (this.crashFrames > 0) ? COLOR_AMBER : COLOR_GREEN
        if (this.crashFrames > 0) {
            // this.rotation -= 6
            this.crashFrames--;
        } else {
            const cos = Math.cos(degreesToRadians(this.rotation));
            const sin = Math.sin(degreesToRadians(this.rotation));
            this.x += cos*this.speed;
            this.y -= sin* this.speed;
            let tileX = Math.floor(this.x / tileSize)
            let tileY = Math.floor(this.y / tileSize)
            if (map[tileY][tileX] === 'x') {
                // Crash!
                this.speed = 1.5;
                this.crashFrames = 90;
                this.x = this.tileX * tileSize + tileSize/2;
                this.y = this.tileY * tileSize + tileSize /2;
            }
            if (map[tileY][tileX] === 's') {
                // Only allow 0 degrees rotation on s tile
                this.rotation = 180
                // The previous tile was before it, increment a lap
                if (this.tileX > tileX) {
                    score.laps++;
                }
            }
            this.tileX = tileX;
            this.tileY = tileY;
            this.speed += 1/60/30
        }
    },
  render: function () {
    kontra.context.save()
    kontra.context.strokeStyle = this.color
    kontra.context.fillStyle = 'black'
    kontra.context.translate(this.x, this.y)
    kontra.context.rotate(-1 * degreesToRadians(this.rotation))
    kontra.context.fillRect(-20, -10, 40, 20)
    kontra.context.strokeRect(-20, -10, 40, 20)
    kontra.context.strokeRect(0, -8, 10, 16) // windshield
    kontra.context.strokeRect(6, -14, 8, 4) // wheel
    kontra.context.strokeRect(6, 10, 8, 4) // wheel
    kontra.context.strokeRect(-16, -14, 8, 4) // wheel
    kontra.context.strokeRect(-16, 10, 8, 4) // wheel
    kontra.context.restore()
  }
});
sprites.push(car)

var grass = {
  width:48,
  height:48,
  color: COLOR_GREEN,
  render: function () {
      kontra.context.strokeStyle = this.color
      kontra.context.strokeRect(this.x, this.y, tileSize, tileSize)
      kontra.context.strokeRect(this.x+4, this.y+4, tileSize-8, tileSize-8)
  }
}

var start = {
  width:48,
  height:48,
  color: COLOR_AMBER,
  render: function () {
      kontra.context.strokeStyle = this.color
      kontra.context.strokeRect(this.x, this.y, tileSize, tileSize)
      kontra.context.strokeRect(this.x+4, this.y+4, tileSize-8, tileSize-8)
  }
}

let reset = function() {
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            if (map[y][x] === 'x') {
                let s = kontra.sprite(grass)
                s.x = x*tileSize;
                s.y = y*tileSize;
                sprites.unshift(s)
            } if (map[y][x] === 's') {
                // Start the player there
                car.x = x*tileSize + car.width/2
                car.y = y*tileSize + car.height/2
                car.rotation = 180;
                let s = kontra.sprite(start )
                s.x = x*tileSize;
                s.y = y*tileSize;
                sprites.unshift(s)
            }
        }
    }
}
kontra.keys.bind(['space','right'], function() {
    car.rotation = (car.rotation-90+360)%360
})

let rightButton = kontra.sprite({
    x: 240,
    y: 500,
    width:80,
    height: 80,
    color: COLOR_GREEN,
    onDown: function () {
        car.rotation = (car.rotation-90+360)%360
    },
    render: function () {
        this.context.save();
        this.context.strokeStyle = this.color;
        this.context.translate(this.x, this.y)
        this.context.beginPath()
        this.context.moveTo(0,20)
        this.context.lineTo(40, 20)
        this.context.lineTo(40, 0)
        this.context.lineTo(80, 40)
        this.context.lineTo(40, 80)
        this.context.lineTo(40, 60)
        this.context.lineTo(0, 60)
        this.context.closePath()
        this.context.stroke()
        
        this.context.restore();
    }
})
kontra.pointer.track(rightButton)
sprites.push(rightButton)

var loop = kontra.gameLoop({  // create the main game loop
  update() {        // update the game state
    sprites.forEach(sprite => {
      sprite.update()
      if (sprite.x > kontra.canvas.width) {
        sprite.x = -sprite.width;
      }
    })
  },
  render() {        // render the game state
    kontra.context.fillStyle = "#000000";
    kontra.context.fillRect(0,0,kontra.canvas.width,kontra.canvas.height);
    sprites.forEach(sprite => {
      sprite.render();
    })
  }
});

reset()
loop.start(); 
this.loop = loop