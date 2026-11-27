
// プレイヤー：決まった数・今の値・キー・動き・描き方

// ------------------------------
// 定数
// ------------------------------

const GRAVITY = 2000;
const JUMP_SPEED = 700;
const MOVE_SPEED = 240;
const MAX_JUMPS = 2;
const FALL_GRAVITY_RATE = 2;
const MAX_HP = 3;
const HIT_TIME = 1;

// ------------------------------
// 状態ごとの色
// ------------------------------

const STATE_COLORS = {
  idle: "#7ef5e1",
  run: "#06d6a0",
  jump: "#ffd166",
  fall: "#ef476f"
};

// ------------------------------
// プレイヤーの情報
// ------------------------------

const player = {
  x: 80,
  y: 20,
  w: 32,
  h: 32,
  vx: 0,
  vy: 0,
  isGrounded: false,
  jumpsLeft: MAX_JUMPS,
  state: "idle",
  frameIndex: 0,
  frameTimer: 0,
  hp: MAX_HP,
  hitTimer: 0,
  facing: 1              // ★追加：最初は右向き
};

// コマを並べた画像（1コマ 32×32）
const playerImg = new Image();
playerImg.src = "7-3_bird.png";

const FRAME_SIZE = 32;
const FRAME_TIME = 0.12;

// 状態ごとに、画像の何段目を使うか（row）と、コマの数（count）
const ANIMS = {
  idle: { row: 0, count: 2 },
  run:  { row: 1, count: 4 },
  jump: { row: 2, count: 2 },
  fall: { row: 3, count: 2 },
};

// ------------------------------
// キー入力
// ------------------------------

const keys = {};

document.addEventListener("keydown", (e) => {
  keys[e.code] = true;

  if (e.code === "Space" && player.jumpsLeft > 0) {
    player.vy = -JUMP_SPEED;
    player.jumpsLeft = player.jumpsLeft - 1;
  }
});

document.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

// ------------------------------
// プレイヤーを初期状態に戻す
// ★追加した関数
// ------------------------------

function resetPlayer() {

  // 位置を初期状態に戻す
  player.x = 80;
  player.y = 20;

  // 移動速度をリセット
  player.vx = 0;
  player.vy = 0;

  // ジャンプ状態をリセット
  player.isGrounded = false;
  player.jumpsLeft = MAX_JUMPS;

  // アニメーションをリセット
  player.state = "idle";
  player.frameIndex = 0;
  player.frameTimer = 0;

  // HPと無敵時間をリセット
  player.hp = MAX_HP;
  player.hitTimer = 0;

  // 向きを右に戻す
  player.facing = 1;

  // 押されているキーをリセット
  for (const key in keys) {
    keys[key] = false;
  }
}

// ------------------------------
// 床との衝突判定
// ------------------------------

function collideWithFloor() {
  if (player.y + player.h > floor.y) {
    player.y = floor.y - player.h;
    player.vy = 0;
    player.isGrounded = true;
    player.jumpsLeft = MAX_JUMPS;
  } else {
    player.isGrounded = false;
  }
}

// ------------------------------
// プレイヤーの状態を決める
// ------------------------------

function decideState() {
  if (!player.isGrounded) {
    if (player.vy < 0) {
      return "jump";
    }
    return "fall";
  }

  if (player.vx !== 0) {
    return "run";
  }

  return "idle";
}

// ------------------------------
// プレイヤーを動かす
// （main.js の update から呼ばれる）
// ------------------------------

function updatePlayer(dt) {

  // 横の速さをキーで決める
  player.vx = 0;

  if (keys["ArrowRight"]) {
    player.vx = MOVE_SPEED;
  }

  if (keys["ArrowLeft"]) {
    player.vx = -MOVE_SPEED;
  }

  // 横方向の移動
  player.x = player.x + player.vx * dt;

  // 向き：動いているときだけ変える
  if (player.vx > 0) {
    player.facing = 1;
  }

  if (player.vx < 0) {
    player.facing = -1;
  }

  // 重力による落下
  const g = player.vy > 0
    ? GRAVITY * FALL_GRAVITY_RATE
    : GRAVITY;

  player.vy = player.vy + g * dt;
  player.y = player.y + player.vy * dt;

  // 床との衝突判定
  collideWithFloor();

  // 現在の状態を決める
  const newState = decideState();

  // 状態が変わったら、コマを最初に戻す
  if (newState !== player.state) {
    player.state = newState;
    player.frameIndex = 0;
    player.frameTimer = 0;
  }

  // コマ送り
  player.frameTimer = player.frameTimer + dt;

  if (player.frameTimer >= FRAME_TIME) {
    player.frameIndex = (player.frameIndex + 1) % ANIMS[player.state].count;
    player.frameTimer = 0;
  }

  // 当たらない時間（タイマー）
  if (player.hitTimer > 0) {
    player.hitTimer = player.hitTimer - dt;

    // マイナスにならないようにする
    if (player.hitTimer < 0) {
      player.hitTimer = 0;
    }
  }
}

// ------------------------------
// プレイヤーを描く
// （main.js の draw から呼ばれる）
// ------------------------------

function drawPlayer() {

  // 当たらない時間は、半透明で描く
  if (player.hitTimer > 0) {
    ctx.globalAlpha = 0.4;
  }

  const sx = player.frameIndex * FRAME_SIZE;
  const sy = ANIMS[player.state].row * FRAME_SIZE;

  ctx.save();
  ctx.translate(player.x + player.w / 2, player.y + player.h / 2);
  ctx.scale(player.facing, 1);

  ctx.drawImage(
    playerImg,
    sx, sy,
    FRAME_SIZE, FRAME_SIZE,
    -player.w / 2, -player.h / 2,
    player.w, player.h
  );

  ctx.restore();

  // 半透明を元に戻す
  ctx.globalAlpha = 1;

  // 情報表示
  ctx.fillStyle = "white";
  ctx.font = "14px sans-serif";
  ctx.fillText("vy: " + player.vy.toFixed(1), 10, 20);
  ctx.fillText("jumpsLeft: " + player.jumpsLeft, 10, 40);
  ctx.fillText("state: " + player.state, 10, 60);
  ctx.fillText("frameIndex: " + player.frameIndex, 10, 80);
  ctx.fillText("hp = " + player.hp, 10, 100);
}
