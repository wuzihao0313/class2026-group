const canvas = document.getElementById("drawCanvas");
const ctx = canvas.getContext("2d");

const penColor = document.getElementById("penColor");
const penSize = document.getElementById("penSize");
const clearBtn = document.getElementById("clearBtn");
const sendBtn = document.getElementById("sendBtn");
const nickname = document.getElementById("nickname");
const messageInput = document.getElementById("messageInput");
const gallery = document.getElementById("gallery");
const status = document.getElementById("status");

let drawing = false;
let hasDrawn = false;

ctx.lineCap = "round";
ctx.lineJoin = "round";
ctx.strokeStyle = penColor.value;
ctx.lineWidth = Number(penSize.value);

// 白色画布
function resetCanvas() {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

resetCanvas();

// 获取鼠标或触摸位置
function getPosition(event) {
    const rect = canvas.getBoundingClientRect();

    return {
        x: (event.clientX - rect.left) *
            canvas.width / rect.width,
        y: (event.clientY - rect.top) *
            canvas.height / rect.height
    };
}

// 开始画画
canvas.addEventListener("pointerdown", function (event) {
    event.preventDefault();
    drawing = true;
    hasDrawn = true;

    canvas.setPointerCapture(event.pointerId);

    const pos = getPosition(event);

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
});

// 绘画过程
canvas.addEventListener("pointermove", function (event) {
    if (!drawing) return;

    event.preventDefault();

    const pos = getPosition(event);

    ctx.strokeStyle = penColor.value;
    ctx.lineWidth = Number(penSize.value);

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
});

// 结束画画
function stopDrawing() {
    drawing = false;
    ctx.beginPath();
}

canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointercancel", stopDrawing);

// 清空画板
clearBtn.addEventListener("click", function () {
    resetCanvas();
    hasDrawn = false;
    status.textContent = "画板をきれいにしたよ！";
});

// 发送作品
sendBtn.addEventListener("click", function () {
    const name = nickname.value.trim() || "ねこ好き";
    const comment = messageInput.value.trim();

    if (!hasDrawn && comment === "") {
        status.textContent = "絵かメッセージを入力してね！";
        return;
    }

    // 创建作品卡片
    const card = document.createElement("article");
    card.className = "art-card";

    // 保存画作副本
    if (hasDrawn) {
        const picture = document.createElement("canvas");
        picture.width = canvas.width;
        picture.height = canvas.height;

        const pictureCtx = picture.getContext("2d");
        pictureCtx.drawImage(canvas, 0, 0);

        card.appendChild(picture);
    }

    const author = document.createElement("p");
    author.className = "author";
    author.textContent = "♡ " + name;

    const message = document.createElement("p");
    message.className = "comment";
    message.textContent = comment || "ねこを描いたよ！";

    const time = document.createElement("p");
    time.className = "comment";
    time.textContent = new Date().toLocaleString("ja-JP");

    card.appendChild(author);
    card.appendChild(message);
    card.appendChild(time);

    // 新作品显示在最前面
    gallery.prepend(card);

    // 清空输入内容和画板
    resetCanvas();
    hasDrawn = false;
    nickname.value = "";
    messageInput.value = "";

    status.textContent = "公園に投稿したよ！ありがとう ♡";
});

// 按 Enter 以外的方式保留多行留言
messageInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        sendBtn.click();
    }
});
