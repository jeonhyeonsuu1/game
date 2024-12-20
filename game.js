const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 960; // 화면 너비 고정
canvas.height = 540; // 화면 높이 고정

let carImage = new Image();
carImage.src = 'car.png'; // 자동차 이미지 경로
let roadImage = new Image();
roadImage.src = 'road.png'; // 도로 이미지 경로
let personImage = new Image();
personImage.src = 'person.png'; // 장애물 이미지 경로

let collisionSound = new Audio('collision.mp3'); // 충돌 소리 경로
collisionSound.volume = 0.5;

let car = { x: canvas.width / 5, y: canvas.height - 150, width: 50, height: 100, speed: 8, boost: false };
let obstacles = [];
let score = 0;
let boostTime = 0;
let boostDuration = 100; // 부스터 지속 시간
let boostCooldown = 0; // 쿨다운 카운터
let boostCooldownMax = 200; // 부스터 쿨다운
let obstacleSpeed = 10; // 장애물 속도
let windEffects = []; // 바람 효과 배열

let roadY = 0; // 도로 배경의 Y 위치

// 키 입력 핸들러
let keys = {};
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

function spawnObstacle() {
    const width = 50;
    const height = 80;
    const x = Math.random() * (canvas.width - width);
    obstacles.push({ x, y: -height, width, height });
}

function spawnWindEffect() {
    for (let i = 0; i < 10; i++) {
        windEffects.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            alpha: 1,
            size: Math.random() * 5 + 2
        });
    }
}

function update() {
    // 도로 배경 이동
    roadY += obstacleSpeed;
    if (roadY >= canvas.height) roadY = 0;

    // 차량 이동
    if (keys['ArrowLeft'] && car.x > 0) car.x -= car.speed;
    if (keys['ArrowRight'] && car.x < canvas.width - car.width) car.x += car.speed;

    // 부스터 활성화
    if (keys[' '] && !car.boost && boostCooldown === 0) {
        car.boost = true;
        boostTime = boostDuration;
        boostCooldown = boostCooldownMax;
        obstacleSpeed = 15; // 부스터 중 장애물 속도 증가
        spawnWindEffect();
    }

    if (car.boost) {
        car.speed = 15; // 부스터 속도
        boostTime--;
        if (boostTime <= 0) {
            car.boost = false;
            car.speed = 10; // 기본 속도 복원
            obstacleSpeed = 10; // 장애물 속도 복원
        }
    }

    if (boostCooldown > 0) {
        boostCooldown--;
    }

    // 장애물 업데이트
    for (let i = 0; i < obstacles.length; i++) {
        let obs = obstacles[i];
        obs.y += obstacleSpeed;
        if (obs.y > canvas.height) {
            obstacles.splice(i, 1);
            score++;
            i--;
            continue;
        }

        // 부스터 중 충돌 시 소리 재생 및 장애물 파괴
        if (car.boost &&
            car.x < obs.x + obs.width &&
            car.x + car.width > obs.x &&
            car.y < obs.y + obs.height &&
            car.y + car.height > obs.y) {
            collisionSound.currentTime = 0; // 소리 다시 시작
            collisionSound.play();
            obstacles.splice(i, 1); // 장애물 파괴
            i--;
            continue;
        }

        // 일반 충돌 시
        if (
            car.x < obs.x + obs.width &&
            car.x + car.width > obs.x &&
            car.y < obs.y + obs.height &&
            car.y + car.height > obs.y
        ) {
            collisionSound.currentTime = 0; // 소리 다시 시작
            collisionSound.play();
            alert(`Game Over! Your score: ${score}`);
            document.location.reload();
        }
    }

    // 새로운 장애물 생성 확률
    if (Math.random() < 0.1) spawnObstacle();

    // 바람 효과 업데이트
    for (let wind of windEffects) {
        wind.y += 10;
        wind.alpha -= 0.02;
        if (wind.alpha <= 0) {
            windEffects.shift();
        }
    }
}

function draw() {
    // 도로 배경 그리기
    ctx.drawImage(roadImage, 0, roadY, canvas.width, canvas.height);
    ctx.drawImage(roadImage, 0, roadY - canvas.height, canvas.width, canvas.height);

    // 차량 그리기
    ctx.drawImage(carImage, car.x, car.y, car.width, car.height);

    // 장애물 그리기
    for (let obs of obstacles) {
        ctx.drawImage(personImage, obs.x, obs.y, obs.width, obs.height);
    }

    // 점수 표시 (왼쪽 하단)
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, canvas.height - 20);

    // 부스터 상태 표시
    if (car.boost) {
        ctx.fillStyle = 'yellow';
        ctx.font = '20px Arial';
        ctx.fillText(`BOOST!`, canvas.width - 100, 30);
    }

    // 부스터 쿨타임 표시
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    if (boostCooldown > 0) {
        ctx.fillText(`Boost Cooldown: ${(boostCooldown / 13).toFixed(1)}s`, canvas.width / 2 - 100, 30);
    } else {
        ctx.fillText(`Boost Ready`, canvas.width / 2 - 50, 30);
    }

    // 바람 효과 그리기
    for (let wind of windEffects) {
        ctx.fillStyle = `rgba(255, 255, 255, ${wind.alpha})`;
        ctx.beginPath();
        ctx.arc(wind.x, wind.y, wind.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
