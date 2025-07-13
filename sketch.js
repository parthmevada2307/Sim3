let items = [];
let beakerContents = [];
let popUpMessage = '';        // Text shown in the popup box
let popUpTimer = 0;           // Timer to control popup "pop" animation

let popUpDuration = 60;       // Duration of the popup animation (in frames)
let liquidImages = {};
let litmus = {
  x: 600,
  y: 200,
  w: 25,
  h: 100,
  dragging: false,
  offsetX: 0,
  offsetY: 0
};

let draggingItem = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

let litmusPH = null;
let isLitmusInLiquid = false;
let liquidTopY = 0;
let liquidBottomY = 0;

const maxLayers = 12; // max layers for pouring
const liquidHeight = 15; // height per layer
const maxLiquidHeight = maxLayers * liquidHeight; // max total liquid height

let pouringSound;
let pourQueue = [];
let currentPour = null;
let pourProgress = 0;
let isPouring = false;

let resetButton;

function preload() {
  pouringSound = loadSound('water-pouring-98795.mp3');
  let imagePaths = {
    "Coffee": "coffee.jpg",
    "Apple Juice": "applejuice.jpg",
    "Lemon Juice": "lemonjuice.jpg",
    "Milk": "milk1.jpg",
    "Mouthwash": "mouthwash.jpg",
    "Pickle": "pickle1.jpg",
    "Soap": "soap.jpg",
    "CocaCola": "soda.jpg",
    "Tomato Juice": "tomatojuice1.jpg",
    "Vinegar": "vinegar.jpg",
    "Water": "water1.jpg"
  };

  for (let key in imagePaths) {
    liquidImages[key] = loadImage(imagePaths[key]);
  }
}

function setup() {
  createCanvas(800, 800);
  textFont('Times New Roman');

  let leftMargin = 40;
  let topMargin = 160;
  let spacing = 60;

 let liquids = [
  { name: "Coffee", pH: 4.89, color: 'brown', image: "assets/coffee.jpg" },
  { name: "Apple Juice", pH: 3.5, color: 'red', image: "assets/apple_juice.png" },
  { name: "Lemon Juice", pH: 2.2, color: 'yellow', image: "assets/lemon_juice.png" },
  { name: "Milk", pH: 6.5, color: '#fffdd0', image: "milk1.jpg" },
  { name: "Mouthwash", pH: 9.0, color: '#80dfff', image: "assets/mouthwash.png" },
  { name: "Pickle", pH: 3.0, color: 'darkred', image: "assets/pickle1.png" },
  { name: "Soap", pH: 9.5, color: '#b0e0e6', image: "assets/soap.png" },
  { name: "CocaCola", pH: 2.5, color: 'black', image: "assets/soda.png" },
  { name: "Tomato Juice", pH: 4.2, color: '#ff6347', image: "assets/tomatojuice1.png" },
  { name: "Vinegar", pH: 2.8, color: '#ffb6c1', image: "assets/vinegar.png" },
   { name: "Water", pH: 7, color: 'blue', image: "assets/water1.png" }
];


liquids.forEach((item, index) => {
  items.push({
    ...item,
    x: leftMargin,
    y: topMargin + index * spacing,
    w: 40,
    h: 40
  });
});

  // Create Reset button below the learn about text
  resetButton = createButton("Reset");
  resetButton.position(width / 2 - resetButton.width / 2, 120);
  resetButton.mousePressed(resetSimulation);
}

function resetSimulation() {
  // Reset all variables and states to start fresh
  beakerContents = [];
  pourQueue = [];
  currentPour = null;
  pourProgress = 0;
  isPouring = false;
  litmus.x = 600;
  litmus.y = 200;
  litmus.dragging = false;
  draggingItem = null;
  litmusPH = null;
  isLitmusInLiquid = false;
}

function draw() {
  background(255);
  textAlign(CENTER, TOP);
  textSize(32);
  fill(0);
  textStyle(BOLD);
  text("Stage - 3", width / 2, 20);

  textSize(25);
  fill(0);
  text("Mix and Change! Can We Flip It?", width / 2, 70);

  items.forEach(item => {
  // Show image if available
  if (liquidImages[item.name]) {
    image(liquidImages[item.name], item.x, item.y, item.w, item.h);
  } else {
    // fallback color circle
    fill(item.color);
    noStroke();
    ellipse(item.x + item.w / 2, item.y + item.h / 2, item.w, item.h);
  }

  fill(0);
  textAlign(LEFT, CENTER);
  textSize(14);
  text(item.name, item.x + item.w + 10, item.y + item.h / 2);
});

  let cx = 330;
  let topY = 300;
  let w = 120;
  let h = 200;
  let ellipseHeight = 30;
  let bottomY = topY + h;

  drawBeaker(cx, topY, w, h);

  liquidTopY = bottomY;
  liquidBottomY = bottomY;

  // Average color for display
  let mixColor = averageColor(beakerContents.map(i => i.color));

  if (beakerContents.length > 0) {
    for (let i = 0; i < beakerContents.length; i++) {
      let y = bottomY - ellipseHeight / 2 - (i + 1) * liquidHeight;
      fill(mixColor); // Use averaged mix color
      noStroke();
      rect(cx - w / 2 + 5, y, w - 10, liquidHeight);
    }

    liquidTopY = bottomY - ellipseHeight / 2 - beakerContents.length * liquidHeight;
    liquidBottomY = bottomY - ellipseHeight / 2;
  }

  drawBeakerMarks(cx, topY, w, h);

  // Pouring logic
  if (!isPouring && pourQueue.length > 0 && beakerContents.length < maxLayers) {
    currentPour = pourQueue.shift();
    isPouring = true;
    pourProgress = 0;
    if (!pouringSound.isPlaying()) pouringSound.loop();
  }

  if (isPouring && currentPour) {
    pourProgress += 2;

    if (pourProgress >= 15) {
      beakerContents.push(currentPour);
      isPouring = false;
      currentPour = null;
      pouringSound.stop();
    } else {
      drawPouringGlass(currentPour, pourProgress);
    }
  }

  if (!isPouring && pouringSound.isPlaying()) {
    pouringSound.stop();
  }

  // Litmus logic
  isLitmusInLiquid = false;
  litmusPH = null;

  if (beakerContents.length > 0) {
    let litmusTop = litmus.y;
    let litmusBottom = litmus.y + litmus.h;
    let litmusRight = litmus.x + litmus.w;
    let litmusLeft = litmus.x;

    if (
      litmusBottom > liquidTopY &&
      litmusTop < liquidBottomY &&
      litmusRight > cx - w / 2 &&
      litmusLeft < cx + w / 2
    ) {
      litmusPH = averagePH(beakerContents);
      isLitmusInLiquid = true;
    }
  }

  drawLitmusPaper(litmus.x, litmus.y, litmus.w, litmus.h, litmusPH, isLitmusInLiquid);
  fill(0);
  textSize(12);
  textAlign(CENTER, BOTTOM);
  text("Litmus Paper", litmus.x + litmus.w / 2, litmus.y - 5);

  let meterX = 630;
  let meterY = 540;
  let meterRadius = 120;
  let phForMeter = (isLitmusInLiquid && beakerContents.length > 0) ? averagePH(beakerContents) : null;
  drawPHMeter(meterX, meterY, meterRadius, phForMeter);

  // pH popup
  let staticBoxX = 650;
  let staticBoxY = 340;

  let staticMessage = 'Dip paper in liquid';
let boxColor = 'white';

if (isLitmusInLiquid && litmusPH !== null) {
  staticMessage = `pH = ${litmusPH.toFixed(2)}`;

  // Match box color with the pH meter section
  if (litmusPH < 3.5) {
    boxColor = '#ff0000'; // Strong Acid - Red
    staticMessage = `Strong Acid (${staticMessage})`;
  } else if (litmusPH < 7) {
    boxColor = '#ffa500'; // Weak Acid - Orange
    staticMessage = `Weak Acid (${staticMessage})`;
  } else if (litmusPH === 7) {
    boxColor = '#00ff00'; // Neutral - Green
    staticMessage = `Neutral (${staticMessage})`;
  } else if (litmusPH <= 10) {
    boxColor = '#1e90ff'; // Weak Base - Blue
    staticMessage = `Weak Base (${staticMessage})`;
  } else {
    boxColor = '#4b0082'; // Strong Base - Indigo
    staticMessage = `Strong Base (${staticMessage})`;
  }
}


  push();
  rectMode(CENTER);
  textAlign(CENTER, CENTER);
  textSize(16);
  noStroke();
  fill(boxColor);
  rect(staticBoxX, staticBoxY, 250, 60, 12);
  fill('white');
  text(staticMessage, staticBoxX, staticBoxY);
  pop();
}


function drawBeaker(cx, topY, w, h) {
  const bottomY = topY + h;
  const ellipseHeight = 30;
  stroke(0);
  strokeWeight(2);
  fill(240, 240, 255, 80);

  beginShape();
  vertex(cx - w / 2, topY);
  vertex(cx - w / 2, bottomY - ellipseHeight / 2);
  vertex(cx + w / 2, bottomY - ellipseHeight / 2);
  vertex(cx + w / 2, topY);
  endShape(CLOSE);

  fill(255);
  ellipse(cx, topY, w, ellipseHeight);
  fill(240, 240, 255, 80);
  ellipse(cx, topY + 3, w * 0.9, ellipseHeight * 0.6);

  noStroke();
  fill(0);
  textSize(16);
  textAlign(CENTER, TOP);
  text("Glass", cx, bottomY + 10);
}

function drawBeakerMarks(cx, topY, w, h) {
  const bottomY = topY + h;
  const ellipseHeight = 30;
  stroke(0);
  strokeWeight(1);
  let marks = 10;
  for (let i = 1; i < marks; i++) {
    let y = map(i, 0, marks, topY + ellipseHeight / 2, bottomY - ellipseHeight / 2);
    line(cx - w / 2 + 5, y, cx - w / 2 + 20, y);
  }
}

function drawLitmusPaper(x, y, w, h, ph, inLiquid) {
  noStroke();
  fill('yellow');
  rect(x, y, w, h);

  if (inLiquid && ph !== null) {
    let intersectTop = max(y, liquidTopY);
    let intersectBottom = min(y + h, liquidBottomY);
    let intersectHeight = max(0, intersectBottom - intersectTop);

    if (intersectHeight > 0) {
      // Define color bands based on typical pH scale
      let color = 'white';

      if (ph > 0 && ph < 1) color = '#ff0000';         // Strong acid (red)
      else if (ph >= 1 && ph < 2) color = '#ff4000';   // Orange-red
      else if (ph >= 2 && ph < 3) color = '#ff8000';     // Yellow
      else if (ph >= 3 && ph < 4) color = '#ffbf00';   // Green
      else if (ph >= 4 && ph < 5) color = '#ffff00';     // Cyan
      else if (ph >= 5 && ph < 6) color = '#bfff00';    // Blue
      else if (ph >= 6 && ph < 7) color = '#80ff00';
      else if (ph >= 7 && ph < 8) color = '#40ff00';
      else if (ph >= 8 && ph < 9) color = '#00ff00';
      else if (ph >= 9 && ph < 10) color = '#00ffff';
      else if (ph >= 10 && ph < 11) color = '#00bfff';
      else if (ph >= 11 && ph < 12) color = '#0080ff';
      else if (ph >= 12 && ph < 13) color = '#0040ff';
      else if (ph >= 13 && ph < 14) color = '#0000ff';
      else color = '#4000ff';                 // Strong base (purple)

      fill(color);
      rect(x, intersectTop, w, intersectHeight);
    }
  }
}

function drawPouringGlass(liquid, progress) {
  let glassX = 330;
  let glassY = 260 - progress;
  push();
  translate(glassX, glassY);
  rotate(radians(-45));
  stroke(100);
  strokeWeight(1.5);
  fill(255, 255, 255, 80);
  beginShape();
  vertex(-15, -30);
  vertex(-20, 30);
  vertex(20, 30);
  vertex(15, -30);
  bezierVertex(10, -35, -10, -35, -15, -30);
  endShape(CLOSE);

  fill(liquid.color);
  noStroke();
  quad(-13, 5, -18, 28, 18, 28, 13, 5);
  pop();

  if (progress > 10) {
    stroke(liquid.color);
    strokeWeight(6);
    line(glassX, glassY + 30, 330, 300);
  }
}

function drawPHMeter(cx, cy, radius, phValue) {
  let colors = ['#ff0000', '#ff4000', '#ff8000', '#ffbf00', '#ffff00', '#bfff00', '#80ff00',
    '#40ff00', '#00ff00', '#00ffff', '#00bfff', '#0080ff', '#0040ff', '#0000ff', '#4000ff'];

  for (let i = 0; i < 14; i++) {
    let startAngle = map(i, 0, 14, PI, TWO_PI);
    let endAngle = map(i + 1, 0, 14, PI, TWO_PI);
    fill(colors[i]);
    noStroke();
    arc(cx, cy, radius * 2, radius * 2, startAngle, endAngle, PIE);
  }

  noFill();
  stroke(0);
  strokeWeight(4);
  arc(cx, cy, radius * 2, radius * 2, PI, TWO_PI);

  strokeWeight(2);
  fill(0);
  textSize(12);
  for (let i = 0; i <= 14; i++) {
    let angle = map(i, 0, 14, PI, TWO_PI);
    let inner = radius - 15;
    let outer = radius;
    let x1 = cx + cos(angle) * inner;
    let y1 = cy + sin(angle) * inner;
    let x2 = cx + cos(angle) * outer;
    let y2 = cy + sin(angle) * outer;
    stroke(0);
    line(x1, y1, x2, y2);

    let tx = cx + cos(angle) * (radius + 25);
    let ty = cy + sin(angle) * (radius + 25);
    noStroke();
    fill(0);
    text(i, tx, ty);

    if (i === 0) text("Acidic", tx, ty + 12);
    if (i === 7) text("Neutral", tx, ty + 12);
    if (i === 14) text("Basic", tx, ty + 12);
  }

    if (phValue !== null) {
    let needleAngle = map(phValue, 0, 14, PI, TWO_PI);
    let nx = cx + cos(needleAngle) * (radius - 30);
    let ny = cy + sin(needleAngle) * (radius - 30);

    stroke(255, 0, 0);
    strokeWeight(4);
    line(cx, cy, nx, ny);

    // Draw center circle
    fill(0);
    noStroke();
    ellipse(cx, cy, 10, 10);
  }

}

function mousePressed() {
  items.forEach(item => {
    // Only add to pourQueue if there is space in the beaker
    let currentHeight = beakerContents.length * liquidHeight;
    if (dist(mouseX, mouseY, item.x + 20, item.y + 20) < 20 && currentHeight < maxLiquidHeight) {
      pourQueue.push(item);
      draggingItem = item;
      dragOffsetX = mouseX - item.x;
      dragOffsetY = mouseY - item.y;
    }
  });

  if (
    mouseX > litmus.x && mouseX < litmus.x + litmus.w &&
    mouseY > litmus.y && mouseY < litmus.y + litmus.h
  ) {
    litmus.dragging = true;
    litmus.offsetX = mouseX - litmus.x;
    litmus.offsetY = mouseY - litmus.y;
  }
}

function mouseDragged() {
  if (litmus.dragging) {
    litmus.x = mouseX - litmus.offsetX;
    litmus.y = mouseY - litmus.offsetY;
  }
  
}

function mouseReleased() {
  litmus.dragging = false;
  draggingItem = null;
}

function averageColor(colors) {
  let r = 0, g = 0, b = 0;
  colors.forEach(c => {
    let col = color(c);
    r += red(col);
    g += green(col);
    b += blue(col);
  });
  r /= colors.length;
  g /= colors.length;
  b /= colors.length;
  return color(r, g, b);
}

function averagePH(contents) {
  if (contents.length === 0) return null;

  let sum = 0;
  contents.forEach(c => sum += c.pH);
  return sum / contents.length;
}

function averageColor(colors) {
  if (colors.length === 0) return color('white');
  let base = color(colors[0]);
  for (let i = 1; i < colors.length; i++) {
    base = lerpColor(base, color(colors[i]), 1 / (i + 1));
  }
  return base;
}

