// Inside the Music — Sara Coughlin

// Playback
let isPlaying = false;
let timer     = 0;

// Player bar
let barHeight   = 80;
let sliderWidth = 100;

// Control sliders
let sizeSlider, pulseSlider;

// Modes
let ballMode      = true;
let blobMode      = true;
let multiplyCount = 1;

// All stem data — color, shape, size, wobble, audio, slider, movement
let stems = [
  { col: [220, 170,  20], points: 4,  sizeMult: 1.0,  wobbleFreqs: [1, 2, 7],  wobbleAmps: [0.8, 0.3, 0.15], label: "OTHER"  },
  { col: [255, 120,  80], points: 6,  sizeMult: 1.0,  wobbleFreqs: [3, 5, 9],  wobbleAmps: [0.5, 0.4, 0.2],  label: "DRUMS"  },
  { col: [100, 140, 255], points: 8,  sizeMult: 0.5,  wobbleFreqs: [2, 6, 11], wobbleAmps: [0.6, 0.25, 0.3], label: "BASS"   },
  { col: [200,  80, 255], points: 12, sizeMult: 0.2,  wobbleFreqs: [4, 8, 13], wobbleAmps: [0.4, 0.5, 0.1],  label: "VOCALS" }
];

// Control panel buttons
let buttons = [
  { label: () => ballMode ? "CONTAINED" : "FREE",    action: () => ballMode = !ballMode },
  { label: () => blobMode ? "BLOBS"     : "CIRCLES", action: () => blobMode = !blobMode },
  { label: () => "MULTIPLY: x" + multiplyCount,      action: () => multiplyCount = multiplyCount >= 3 ? 1 : multiplyCount + 1 }
];

function preload() {
  stems[0].sound = loadSound('other.mp3');
  stems[1].sound = loadSound('drums.mp3');
  stems[2].sound = loadSound('bass.mp3');
  stems[3].sound = loadSound('vocals.mp3');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(60);
  textFont('Space Grotesk');

  for (let s of stems) {
    s.amp = new p5.Amplitude();
    s.amp.setInput(s.sound);
    s.amp.smooth(0.8);
    s.vol = createSlider(0, 1, 0.8, 0.01);
    s.vol.style('width', sliderWidth + 'px');
    s.vol.style('opacity', '0');
    s.rx = [random(0.2, 1.4), random(0.2, 1.4), random(0.2, 1.4)];
    s.ry = [random(0.2, 1.4), random(0.2, 1.4), random(0.2, 1.4)];
    s.rs = [random(TWO_PI),   random(TWO_PI),   random(TWO_PI)  ];
  }

  sizeSlider  = createSlider(0.3, 2.0, 1.0, 0.01);
  pulseSlider = createSlider(0.0, 1.0, 0.5, 0.01);
  for (let s of [sizeSlider, pulseSlider]) {
    s.style('width', '100px');
    s.style('opacity', '0');
  }
  sizeSlider.position(80, 28);
  pulseSlider.position(80, 63);

  positionSliders();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  positionSliders();
}

function positionSliders() {
  let spacing = width / (stems.length + 1);
  let sliderY = height - barHeight / 2 - 8;
  for (let stemIndex = 0; stemIndex < stems.length; stemIndex++) {
    if (stems[stemIndex].vol) {
      stems[stemIndex].vol.position(spacing * (stemIndex + 1) - sliderWidth / 2, sliderY);
    }
  }
}

function draw() {
  background(8, 5, 15, 40);

  let cx     = width / 2;
  let cy     = (height - barHeight) / 2;
  let radius = min(width, height - barHeight) * 0.42;

  if (timer > 0) {
    for (let s of stems) s.sound.setVolume(s.vol.value());

    let sizeControl  = sizeSlider.value();
    let pulseControl = pulseSlider.value();

    if (ballMode) {
      drawingContext.save();
      drawingContext.beginPath();
      drawingContext.arc(cx, cy, radius, 0, TWO_PI);
      drawingContext.clip();
    }

    for (let stemIndex = 0; stemIndex < stems.length; stemIndex++) {
      let s     = stems[stemIndex];
      let level = s.amp.getLevel() * s.vol.value();

      for (let copy = 0; copy < multiplyCount; copy++) {
        let rangeX = ballMode ? radius * 0.65 : width  * 0.46;
        let rangeY = ballMode ? radius * 0.55 : height * 0.44;
        let x      = cx + sin(timer * s.rx[copy] + s.rs[copy])              * rangeX;
        let y      = cy + cos(timer * s.ry[copy] + s.rs[copy] * 1.7 + 1.3) * rangeY;
        let blobSize = (ballMode ? radius : min(width, height) * 0.4) * s.sizeMult * sizeControl;

        if (blobMode) drawBlob(x, y, blobSize, s.col, s.vol.value(), s.points, s.wobbleFreqs, s.wobbleAmps, pulseControl, level);
        else          drawCircle(x, y, blobSize, s.col, s.vol.value(), pulseControl, level);
      }
    }

    if (ballMode) {
      drawingContext.restore();
      let drumsPulse = stems[1].amp.getLevel() * 40 * pulseSlider.value();
      noFill();
      for (let rimCount = 20; rimCount >= 0; rimCount--) {
        stroke(255, 255, 255, map(rimCount, 20, 0, 0, 60));
        strokeWeight(map(rimCount, 20, 0, 1, 6));
        ellipse(cx, cy, radius * 2 + rimCount * 5 + drumsPulse);
      }
    }
  }

  if (isPlaying) timer += 0.0012;

  drawControlPanel();
  drawPlayerBar();
}

// Organic blob with unique wobble per stem
function drawBlob(x, y, size, col, volumeFade, numPoints, wobbleFreqs, wobbleAmps, pulseControl, level) {
  noStroke();
  let pulseSize = size * (1 + level * pulseControl * 1.5);
  for (let layer = 0; layer < 8; layer++) {
    let layerSize  = pulseSize * map(layer, 0, 7, 2.2, 0.3);
    let layerAlpha = map(layer, 0, 7, 10, 180) * volumeFade;
    let speed      = map(layer, 0, 7, 0.3, 2.5);
    let rotate     = timer * 0.1 * (layer % 2 === 0 ? 1 : -1) + layer * 0.4;
    let offsetX    = cos(timer * 0.3 + layer * 0.8) * size * 0.1;
    let offsetY    = sin(timer * 0.25 + layer * 0.6) * size * 0.1;

    fill(col[0], col[1], col[2], layerAlpha);
    beginShape();
    for (let pointIndex = 0; pointIndex <= numPoints; pointIndex++) {
      let a = map(pointIndex, 0, numPoints, 0, TWO_PI) + rotate;
      let w = 0;
      for (let freqIndex = 0; freqIndex < wobbleFreqs.length; freqIndex++) {
        w += sin(a * wobbleFreqs[freqIndex] + timer * speed * (freqIndex + 0.5)) * layerSize * 0.15 * wobbleAmps[freqIndex];
      }
      curveVertex(x + offsetX + cos(a) * (layerSize * 0.5 + w),
                  y + offsetY + sin(a) * (layerSize * 0.5 + w));
    }
    endShape(CLOSE);
  }
}

// Fuzzy layered circle
function drawCircle(x, y, size, col, volumeFade, pulseControl, level) {
  noStroke();
  let pulseSize = size * (1 + level * pulseControl * 1.5);
  for (let layer = 0; layer < 8; layer++) {
    fill(col[0], col[1], col[2], map(layer, 0, 7, 10, 180) * volumeFade);
    ellipse(x, y, pulseSize * map(layer, 0, 7, 2.2, 0.3));
  }
}

function drawControlPanel() {
  let trackW   = 100;
  let trackX   = 80;
  let controls = [
    { label: "SIZE",  slider: sizeSlider,  min: 0.3, max: 2.0, y: 36 },
    { label: "PULSE", slider: pulseSlider, min: 0.0, max: 1.0, y: 71 }
  ];

  for (let c of controls) {
    let val = map(c.slider.value(), c.min, c.max, 0, trackW);
    noStroke(); fill(220, 210, 240); textAlign(LEFT, CENTER); textSize(11);
    text(c.label, 20, c.y);
    stroke(60, 50, 80); strokeWeight(3);
    line(trackX, c.y, trackX + trackW, c.y);
    stroke(255); line(trackX, c.y, trackX + val, c.y);
    noStroke(); fill(255); ellipse(trackX + val, c.y, 12, 12);
  }

  for (let btnIndex = 0; btnIndex < buttons.length; btnIndex++) {
    let isOn = btnIndex === 0 ? ballMode : btnIndex === 1 ? blobMode : true;
    drawToggleButton(buttons[btnIndex].label(), 20, 108 + btnIndex * 30, isOn);
  }
}

function drawToggleButton(label, x, y, isOn) {
  let btnW = 130, btnH = 22;
  fill(isOn ? 50 : 20, isOn ? 30 : 20, isOn ? 80 : 40);
  stroke(isOn ? 200 : 80, isOn ? 80 : 40, isOn ? 255 : 100);
  strokeWeight(1); rect(x, y - btnH / 2, btnW, btnH, 4);
  noStroke(); fill(255, isOn ? 255 : 120);
  textAlign(LEFT, CENTER); textSize(11);
  text(label, x + 8, y);
}

function drawPlayerBar() {
  let barTop     = height - barHeight;
  let barMiddleY = barTop + barHeight / 2;
  let spacing    = width / (stems.length + 1);
  let buttonX    = width - 60;
  let buttonY    = barMiddleY;
  let buttonR    = 22;
  let sliderY    = barTop + barHeight / 2 + 8;

  noStroke(); fill(20, 15, 30);
  rect(0, barTop, width, barHeight);
  stroke(50, 40, 70); line(0, barTop, width, barTop);

  noStroke(); fill(220, 210, 240);
  textAlign(LEFT, CENTER); textSize(20);
  text("Begin Again", 20, barMiddleY - 12);
  fill(140, 130, 160); textSize(15);
  text("Ben Böhmer", 20, barMiddleY + 12);

  // Draw slider labels and tracks for each stem
  for (let stemIndex = 0; stemIndex < stems.length; stemIndex++) {
    let s   = stems[stemIndex];
    let sx  = spacing * (stemIndex + 1);
    let val = s.vol.value();

    noStroke(); fill(140, 130, 160);
    textAlign(CENTER, CENTER); textSize(11);
    text(s.label, sx, barTop + 15);

    stroke(80, 70, 100); strokeWeight(3);
    line(sx - sliderWidth / 2, sliderY, sx + sliderWidth / 2, sliderY);
    stroke(s.col[0], s.col[1], s.col[2]);
    line(sx - sliderWidth / 2, sliderY, sx - sliderWidth / 2 + val * sliderWidth, sliderY);
    noStroke(); fill(255);
    ellipse(sx - sliderWidth / 2 + val * sliderWidth, sliderY, 12, 12);
  }

  // Glowing play/pause button
  let isHovering = dist(mouseX, mouseY, buttonX, buttonY) < buttonR;
  let pulse      = sin(timer * 4) * 3;
  noFill();
  for (let g = 5; g >= 0; g--) {
    stroke(200, 80, 255, map(g, 5, 0, 3, 30));
    strokeWeight(map(g, 5, 0, 1, 4));
    ellipse(buttonX, buttonY, buttonR * 2 + g * 8 + pulse);
  }
  stroke(200, 80, 255, isHovering ? 255 : 180); strokeWeight(2);
  noFill(); ellipse(buttonX, buttonY, buttonR * 2);
  noStroke(); fill(255, isHovering ? 255 : 200);
  if (isPlaying) {
    rect(buttonX - 7, buttonY - 8, 5, 16);
    rect(buttonX + 2,  buttonY - 8, 5, 16);
  } else {
    triangle(buttonX - 4, buttonY - 9, buttonX - 4, buttonY + 9, buttonX + 12, buttonY);
  }
}

function mousePressed() {
  for (let btnIndex = 0; btnIndex < buttons.length; btnIndex++) {
    let y = 108 + btnIndex * 30;
    if (mouseX > 20 && mouseX < 150 && mouseY > y - 11 && mouseY < y + 11) {
      buttons[btnIndex].action();
    }
  }

  let buttonX = width - 60;
  let buttonY = height - barHeight / 2;
  if (dist(mouseX, mouseY, buttonX, buttonY) < 22) {
    if (isPlaying) {
      for (let s of stems) s.sound.pause();
      isPlaying = false;
    } else {
      for (let s of stems) s.sound.loop();
      isPlaying = true;
    }
  }
}
