const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ===== MAP =====
let map = []; // dynamic 2D array
let mapWidth = 50;  // initial size
let mapHeight = 50;

// Initialize map with 0
for (let y = 0; y < mapHeight; y++) {
  map[y] = [];
  for (let x = 0; x < mapWidth; x++) {
    map[y][x] = 1; // fill with walls initially
  }
}

// ===== PLAYER =====
let posX = Math.floor(mapWidth/2);
let posY = Math.floor(mapHeight/2);
let dirX = -1;
let dirY = 0;
let planeX = 0;
let planeY = 0.66;

// ===== TEXTURE =====
const wallTexture = new Image();
wallTexture.src = "images/wall.png";

// ===== INPUT =====
const keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// ===== ROOM GENERATION HELPERS =====
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Place a room
function placeRoom(x, y, width, height) {
  for (let i = y; i < y + height; i++) {
    for (let j = x; j < x + width; j++) {
      if(i >= 0 && i < mapHeight && j >=0 && j < mapWidth) {
        map[i][j] = 0; // floor
      }
    }
  }
}

// Check for overlap
function roomOverlap(x, y, width, height) {
  for (let i = y-1; i < y + height+1; i++) {
    for (let j = x-1; j < x + width+1; j++) {
      if (i >=0 && i < mapHeight && j >=0 && j < mapWidth) {
        if(map[i][j] === 0) return true;
      }
    }
  }
  return false;
}

// Generate hallways between two points
function createHallway(x1, y1, x2, y2) {
  let cx = x1;
  let cy = y1;
  
  while (cx !== x2 || cy !== y2) {
    if(cx !== x2) {
      cx += (x2 > cx ? 1 : -1);
    } else if(cy !== y2) {
      cy += (y2 > cy ? 1 : -1);
    }
    if(cy >=0 && cy < mapHeight && cx >=0 && cx < mapWidth) map[cy][cx] = 0;
  }
}

// ===== INITIAL MAP =====
let rooms = [];

// Place initial room
let startWidth = randomInt(4, 8);
let startHeight = randomInt(4, 8);
let startX = Math.floor(mapWidth/2 - startWidth/2);
let startY = Math.floor(mapHeight/2 - startHeight/2);

placeRoom(startX, startY, startWidth, startHeight);
rooms.push({x:startX, y:startY, w:startWidth, h:startHeight});

// Place 5 more rooms randomly
for(let r=0; r<100; r++) {
  let w = randomInt(2, 6);
  let h = randomInt(4, 8);
  let rx = randomInt(1, mapWidth - w -1);
  let ry = randomInt(1, mapHeight - h -1);

  if(!roomOverlap(rx, ry, w, h)) {
    placeRoom(rx, ry, w, h);

    // Connect to previous room
    let prev = rooms[rooms.length-1];
    let px = randomInt(prev.x, prev.x + prev.w -1);
    let py = randomInt(prev.y, prev.y + prev.h -1);
    let nx = randomInt(rx, rx + w -1);
    let ny = randomInt(ry, ry + h -1);
    createHallway(px, py, nx, ny);

    rooms.push({x:rx, y:ry, w:w, h:h});
  }
}

// ===== GAME LOOP =====
wallTexture.onload = () => { requestAnimationFrame(gameLoop); };

function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

// ===== PLAYER MOVEMENT =====
function update() {
  const moveSpeed = 0.05;
  const rotSpeed = 0.03;

  if (keys["w"]) {
    if(map[Math.floor(posY)][Math.floor(posX + dirX*moveSpeed)] === 0) posX += dirX*moveSpeed;
    if(map[Math.floor(posY + dirY*moveSpeed)][Math.floor(posX)] === 0) posY += dirY*moveSpeed;
  }
  if (keys["s"]) {
    if(map[Math.floor(posY)][Math.floor(posX - dirX*moveSpeed)] === 0) posX -= dirX*moveSpeed;
    if(map[Math.floor(posY - dirY*moveSpeed)][Math.floor(posX)] === 0) posY -= dirY*moveSpeed;
  }
  if (keys["a"]) rotate(-rotSpeed);
  if (keys["d"]) rotate(rotSpeed);
}

function rotate(speed) {
  const oldDirX = dirX;
  dirX = dirX*Math.cos(speed) - dirY*Math.sin(speed);
  dirY = oldDirX*Math.sin(speed) + dirY*Math.cos(speed);

  const oldPlaneX = planeX;
  planeX = planeX*Math.cos(speed) - planeY*Math.sin(speed);
  planeY = oldPlaneX*Math.sin(speed) + planeY*Math.cos(speed);
}

// ===== RAYCASTING & RENDER =====
function render() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Ceiling
  ctx.fillStyle = "#222";
  ctx.fillRect(0,0,canvas.width,canvas.height/2);

  // Floor
  ctx.fillStyle = "#444";
  ctx.fillRect(0,canvas.height/2,canvas.width,canvas.height/2);

  for(let x=0;x<canvas.width;x++){
    const cameraX = 2*x/canvas.width -1;
    const rayDirX = dirX + planeX*cameraX;
    const rayDirY = dirY + planeY*cameraX;

    let mapX = Math.floor(posX);
    let mapY = Math.floor(posY);

    const deltaDistX = Math.abs(1/rayDirX);
    const deltaDistY = Math.abs(1/rayDirY);

    let stepX, stepY;
    let sideDistX, sideDistY;

    if(rayDirX<0){stepX=-1; sideDistX=(posX-mapX)*deltaDistX;}
    else {stepX=1; sideDistX=(mapX+1-posX)*deltaDistX;}

    if(rayDirY<0){stepY=-1; sideDistY=(posY-mapY)*deltaDistY;}
    else {stepY=1; sideDistY=(mapY+1-posY)*deltaDistY;}

    let hit=0;
    let side;

    while(hit===0){
      if(sideDistX<sideDistY){ sideDistX+=deltaDistX; mapX+=stepX; side=0;}
      else { sideDistY+=deltaDistY; mapY+=stepY; side=1;}
      if(map[mapY] && map[mapY][mapX] && map[mapY][mapX]>0) hit=1;
    }

    let perpWallDist;
    if(side===0) perpWallDist = (mapX-posX+(1-stepX)/2)/rayDirX;
    else perpWallDist = (mapY-posY+(1-stepY)/2)/rayDirY;

    let safeDist = Math.max(perpWallDist, 0.1);
    const lineHeight = Math.floor(canvas.height/safeDist);

    let drawStart = -lineHeight/2 + canvas.height/2;
    if(drawStart<0) drawStart=0;
    let drawEnd = lineHeight/2 + canvas.height/2;
    if(drawEnd>=canvas.height) drawEnd = canvas.height-1;

    let wallX;
    if(side===0) wallX = posY + perpWallDist*rayDirY;
    else wallX = posX + perpWallDist*rayDirX;
    wallX -= Math.floor(wallX);

    let textureX = Math.floor(wallX*wallTexture.width);
    if(side===0 && rayDirX>0) textureX = wallTexture.width - textureX -1;
    if(side===1 && rayDirY<0) textureX = wallTexture.width - textureX -1;

    ctx.drawImage(
      wallTexture,
      textureX,0,1,wallTexture.height,
      x,drawStart,1,drawEnd-drawStart
    );
  }
}

const gun = document.getElementById("gun");

let isFiring = false;

window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !isFiring) {
    isFiring = true;

    // Switch to fired image
    gun.src = "gunfired.png";

    // Switch back after 0.1 seconds (100ms)
    setTimeout(() => {
      gun.src = "gun.png";
      isFiring = false;
    }, 100);
  }
});