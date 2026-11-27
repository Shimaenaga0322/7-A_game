
// ========================================
// 敵を作る関数
// ========================================

const MAX_ENEMIES = 6;   // 敵は、同時にこの数まで

function createEnemy(x, vx, type = "normal", startY = null) {
  const y = startY ?? floor.y - 32;

  return {
    x: x,
    y: y,
    w: 32,
    h: 32,

    // 移動設定
    vx: vx,
    vy: 0,

    // 敵の種類
    type: type,

    // ジャンプ敵の設定
    jumpPower: 500,
    jumpTimer: 0.5,
    isGrounded: true,

    // 空中敵の設定
    flyY: y,
    state: "fly",

    attackTimer: 2.5,
    attackInterval: 2.5,

    // 攻撃準備
    prepareTimer: 0,
    prepareDuration: 0.6,

    // 急降下
    targetX: x,
    startX: x,
    startY: y,
    diveTimer: 0,
    diveDuration: 0.7,

    // 復帰
    returnSpeed: 250,

    alive: true
  };
}


// ========================================
// 敵の登録
// ========================================

let enemies = [];
let spawnTimer = 0;   // 敵を出すタイマー
let nextSpawn = 2;    // 次の敵を出すまでの時間（秒）


// ========================================
// 敵を初期状態に戻す
// ========================================

function resetEnemies() {

  // ★重要：以前の敵をすべて消す
  enemies = [];

  // 通常敵
  enemies.push(createEnemy(200, 80));
  enemies.push(createEnemy(380, -120));
  enemies.push(createEnemy(540, 60));

  // ジャンプ敵
  enemies.push(createEnemy(300, 0, "jumper"));

  // 空中敵
  enemies.push(createEnemy(450, 60, "flyer", 100));
  enemies.push(createEnemy(50, 70, "flyer", 40));
    spawnTimer = 0;
  nextSpawn = 2;
}

// 敵を時間で出す（タイマーの形・くり返す）
function spawnEnemies(dt) {
  spawnTimer = spawnTimer + dt;
  if (spawnTimer >= nextSpawn) {
    if (enemies.length < MAX_ENEMIES) {
      // 左の端か右の端か、くじで決める
      if (Math.random() < 0.5) {
        enemies.push(createEnemy(0, 100));                    // 左の端から、右へ
      } else {
        enemies.push(createEnemy(canvas.width - 32, -100));   // 右の端から、左へ
      }
    }
    spawnTimer = 0;
    nextSpawn = 1 + Math.random() * 2;   // 次は 1〜3 秒のどれか
  }
}


// ========================================
// 敵の更新処理
// ========================================

function updateEnemies(dt) {

  for (const enemy of enemies) {

    // --------------------------------
    // 空中敵
    // --------------------------------

    if (enemy.type === "flyer") {

      // 飛行中
      if (enemy.state === "fly") {

        // 左右に移動
        enemy.x += enemy.vx * dt;

        // 画面端で反転
        if (enemy.x < 0) {
          enemy.x = 0;
          enemy.vx = -enemy.vx;
        }

        if (enemy.x + enemy.w > canvas.width) {
          enemy.x = canvas.width - enemy.w;
          enemy.vx = -enemy.vx;
        }

        // 攻撃タイマー
        enemy.attackTimer -= dt;

        // 攻撃開始
        if (enemy.attackTimer <= 0) {

          // プレイヤーの位置を記録
          enemy.targetX = player.x + player.w / 2;

          // 画面外に狙いがはみ出さないようにする
          enemy.targetX = Math.max(
            enemy.w / 2,
            Math.min(canvas.width - enemy.w / 2, enemy.targetX)
          );

          // 攻撃準備に入る
          enemy.state = "prepare";
          enemy.prepareTimer = enemy.prepareDuration;
        }
      }


      // --------------------------------
      // 攻撃準備
      // --------------------------------

      else if (enemy.state === "prepare") {

        // 一瞬停止して狙いを定める
        enemy.prepareTimer -= dt;

        // 準備完了
        if (enemy.prepareTimer <= 0) {

          // 急降下開始時の位置を記録
          enemy.startX = enemy.x;
          enemy.startY = enemy.y;

          enemy.diveTimer = 0;

          enemy.state = "dive";
        }
      }


      // --------------------------------
      // 急降下
      // --------------------------------

      else if (enemy.state === "dive") {

        // 経過時間を増やす
        enemy.diveTimer += dt;

        // 0～1の範囲に変換
        const t = Math.min(
          enemy.diveTimer / enemy.diveDuration,
          1
        );

        // 横方向は一定の割合で移動
        const targetLeft = enemy.targetX - enemy.w / 2;

        enemy.x =
          enemy.startX + (targetLeft - enemy.startX) * t;

        // 下方向は二次曲線で加速
        const groundY = floor.y - enemy.h;

        enemy.y =
          enemy.startY + (groundY - enemy.startY) * t * t;

        // 急降下終了
        if (t >= 1) {
          enemy.y = groundY;
          enemy.state = "return";
        }
      }


      // --------------------------------
      // 元の高さに戻る
      // --------------------------------

      else if (enemy.state === "return") {

        enemy.y -= enemy.returnSpeed * dt;

        // 元の高さに到達
        if (enemy.y <= enemy.flyY) {

          enemy.y = enemy.flyY;

          // 飛行再開
          enemy.state = "fly";

          // 次の攻撃まで待つ
          enemy.attackTimer = enemy.attackInterval;
        }
      }

      // 空中敵の処理終了
      continue;
    }


    // --------------------------------
    // 通常敵・ジャンプ敵
    // --------------------------------

    // 横方向の移動
    enemy.x += enemy.vx * dt;

    // 画面端で反転
    if (enemy.x < 0) {
      enemy.x = 0;
      enemy.vx = -enemy.vx;
    }

    if (enemy.x + enemy.w > canvas.width) {
      enemy.x = canvas.width - enemy.w;
      enemy.vx = -enemy.vx;
    }

    // ジャンプ敵
    if (enemy.type === "jumper") {

      if (enemy.isGrounded) {

        enemy.jumpTimer -= dt;

        if (enemy.jumpTimer <= 0) {
          enemy.vy = -enemy.jumpPower;
          enemy.isGrounded = false;
        }

      } else {

        enemy.vy += GRAVITY * dt;
        enemy.y += enemy.vy * dt;

        const groundY = floor.y - enemy.h;

        if (enemy.y >= groundY) {
          enemy.y = groundY;
          enemy.vy = 0;
          enemy.isGrounded = true;
          enemy.jumpTimer = 0.5;
        }
      }
    }
  }
}


// ========================================
// 敵の描画処理
// ========================================

function drawEnemies() {

  for (const enemy of enemies) {

    // 敵の種類によって色を変える
    if (enemy.type === "jumper") {
      ctx.fillStyle = "#06d6a0";

    } else if (enemy.type === "flyer") {

      if (enemy.state === "prepare") {
        // 攻撃準備中は黄色
        ctx.fillStyle = "#ffd166";

      } else if (enemy.state === "dive") {
        // 急降下中は赤色
        ctx.fillStyle = "#ef476f";

      } else {
        // 飛行中・復帰中は紫色
        ctx.fillStyle = "#9b5de5";
      }

    } else {
      ctx.fillStyle = "#ff6b6b";
    }

    ctx.fillRect(
      enemy.x,
      enemy.y,
      enemy.w,
      enemy.h
    );

    // 攻撃準備中のマーク
    if (
      enemy.type === "flyer" &&
      enemy.state === "prepare"
    ) {
      ctx.fillStyle = "white";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(
        "!",
        enemy.x + enemy.w / 2 - 3,
        enemy.y - 8
      );
    }
  }
}


// ========================================
// プレイヤーとの衝突判定
// ========================================

function collideWithEnemies(prevBottom) {

  for (const enemy of enemies) {

    // 上から踏んだ場合
    if (
      aabb(player, enemy) &&
      prevBottom <= enemy.y &&
      player.vy > 0
    ) {
      enemy.alive = false;
      player.vy = -JUMP_SPEED / 2;
      score = score + 1;              // 点数を足す（★ main.js の score を書き換える）
    }

    // 横からぶつかった場合
    else if (
      aabb(player, enemy) &&
      player.hitTimer <= 0
    ) {
      player.hp -= 1;
      player.hitTimer = HIT_TIME;
    }
  }

  // 倒された敵を削除
  enemies = enemies.filter((enemy) => enemy.alive);
}
