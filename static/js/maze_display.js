const START_POS = { x: 1, y: 1 };  // Start one cell in from top-left
const GOAL_POS = { x: null, y: null };  // Will be set when maze is generated

// ========== KHỞI TẠO BIẾN TOÀN CỤC ==========
let canvas, ctx;
let currentMaze = null;
let cellSize = 30;
let playerPos = { x: 0, y: 0 };
let goalPos = { x: 0, y: 0 };
let gameStartTime = null;
let isGameActive = false;

// Các màu sắc cho theme mặc định
const THEMES = {
    default: {
        wall: '#2c3e50',
        path: '#ecf0f1',
        player: '#e74c3c',
        goal: '#27ae60',
        visited: '#95a5a6'
    },
    neon: {
        wall: '#1a1a1a',
        path: '#000000',
        player: '#ff0066',
        goal: '#00ff00',
        visited: '#003366'
    }
};

let currentTheme = THEMES.default;

// ========== KHỞI TẠO GAME ==========
function initMazeGame() {
    console.log('Khởi tạo trò chơi mê cung...');

    // Thiết lập canvas
    canvas = document.getElementById('mazeCanvas');
    ctx = canvas.getContext('2d');

    // Gắn các sự kiện
    setupEventListeners();

    // Tạo mê cung mới khi trang được tải
    generateNewMaze();

    console.log('Hoàn tất khởi tạo trò chơi');
}

// ========== XỬ LÝ SỰ KIỆN ==========
function setupEventListeners() {
    // Nút tạo mê cung mới
    document.getElementById('generateMaze').addEventListener('click', generateNewMaze);

    // Nút chuyển đổi theme
    document.getElementById('toggleTheme').addEventListener('click', toggleTheme);

    // Phím di chuyển
    document.addEventListener('keydown', handleKeyPress);

    console.log('Đã thiết lập các sự kiện');
}

// ========== TẠO MÊ CUNG MỚI ==========
// Cập nhật hàm generateNewMaze
async function generateNewMaze() {
    console.log('Đang tạo mê cung mới...');

    const width = parseInt(document.getElementById('mazeWidth').value);
    const height = parseInt(document.getElementById('mazeHeight').value);

    // Validate input
    if (isNaN(width) || isNaN(height)) {
        showStatus('Kích thước mê cung không hợp lệ');
        console.error('Kích thước không hợp lệ:', { width, height });
        return;
    }

    try {
        const response = await fetch('/api/maze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ width, height })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Lỗi khi tạo mê cung');
        }

        if (!data.grid || !Array.isArray(data.grid)) {
            throw new Error('Dữ liệu mê cung không hợp lệ');
        }

        console.log('Đã nhận mê cung từ server:', data);
        currentMaze = data;

        // Thiết lập lại trò chơi
        resetGame();

        // Vẽ mê cung
        resizeCanvas();
        drawMaze();

    } catch (error) {
        console.error('Lỗi chi tiết:', error);
        showStatus(error.message || 'Không thể tạo mê cung mới. Vui lòng thử lại.');
    }
}

// ========== RESET GAME ==========
function resetGame() {
    console.log('Đặt lại trạng thái trò chơi');

    playerPos = { ...START_POS };  // Start at fixed position

    // Set goal position to one cell in from bottom-right
    GOAL_POS.x = currentMaze.width - 2;
    GOAL_POS.y = currentMaze.height - 2;

    gameStartTime = Date.now();
    isGameActive = true;

    // Xóa đường đi đã đi qua
    clearVisitedCells();
}

// Cập nhật hàm drawMaze với kiểm tra an toàn hơn
function drawMaze() {
    if (!currentMaze) {
        console.error('Không có dữ liệu mê cung');
        return;
    }

    if (!currentMaze.grid || !Array.isArray(currentMaze.grid)) {
        console.error('Cấu trúc mê cung không hợp lệ:', currentMaze);
        return;
    }

    console.log('Đang vẽ mê cung kích thước:',
                currentMaze.width, 'x', currentMaze.height);

    // Xóa canvas
    if (!ctx) {
        console.error('Không tìm thấy context của canvas');
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Vẽ từng ô của mê cung
    for (let y = 0; y < currentMaze.height; y++) {
        for (let x = 0; x < currentMaze.width; x++) {
            drawCell(x, y);
        }
    }

    // Vẽ người chơi và đích
    drawPlayer();
    drawGoal();
}

// ========== VẼ MỘT Ô ==========
function drawCell(x, y) {
    const isWall = currentMaze.grid[y][x] === 1;

    // Tính toán vị trí và kích thước ô
    const cellX = x * cellSize;
    const cellY = y * cellSize;

    // Vẽ nền ô
    ctx.fillStyle = isWall ? currentTheme.wall : currentTheme.path;
    ctx.fillRect(cellX, cellY, cellSize, cellSize);

    // Vẽ viền ô
    ctx.strokeStyle = '#666';
    ctx.strokeRect(cellX, cellY, cellSize, cellSize);

    // Thêm hiệu ứng cho tường (optional)
    if (isWall) {
        addWallEffect(cellX, cellY);
    }
}

// ========== HIỆU ỨNG CHO TƯỜNG ==========
function addWallEffect(x, y) {
    // Tạo gradient cho tường
    const gradient = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, cellSize, cellSize);
}

// ========== VẼ NGƯỜI CHƠI ==========
function drawPlayer() {
    const x = playerPos.x * cellSize;
    const y = playerPos.y * cellSize;

    // Vẽ hiệu ứng phát sáng
    const gradient = ctx.createRadialGradient(
        x + cellSize/2, y + cellSize/2, 0,
        x + cellSize/2, y + cellSize/2, cellSize
    );
    gradient.addColorStop(0, 'rgba(231, 76, 60, 0.3)');
    gradient.addColorStop(1, 'rgba(231, 76, 60, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(x - cellSize/2, y - cellSize/2, cellSize*2, cellSize*2);

    // Vẽ người chơi
    ctx.beginPath();
    ctx.fillStyle = currentTheme.player;
    ctx.arc(x + cellSize/2, y + cellSize/2, cellSize/3, 0, Math.PI * 2);
    ctx.fill();
}

// ========== XỬ LÝ DI CHUYỂN ==========
function handleKeyPress(event) {
    if (!isGameActive || !currentMaze) return;

    const key = event.key.toLowerCase();
    const oldPos = {...playerPos};

    console.log('Phím được nhấn:', key);

    // Store the potential new position
    let newPos = {...playerPos};

    switch(key) {
        case 'arrowup':
        case 'w':
            newPos.y -= 1;
            break;
        case 'arrowdown':
        case 's':
            newPos.y += 1;
            break;
        case 'arrowleft':
        case 'a':
            newPos.x -= 1;
            break;
        case 'arrowright':
        case 'd':
            newPos.x += 1;
            break;
    }

    // Validate the move before applying it
    if (canMove(newPos.x, newPos.y)) {
        playerPos = newPos;
        console.log('Di chuyển đến:', playerPos);
        markVisited(playerPos.x, playerPos.y);
        drawMaze();
        checkWin();
    } else {
        console.log('Di chuyển không hợp lệ:', newPos);
    }
}


// ========== KIỂM TRA DI CHUYỂN HỢP LỆ ==========
function canMove(x, y) {
    // Kiểm tra có nằm trong mê cung không
    if (x < 0 || x >= currentMaze.width || y < 0 || y >= currentMaze.height) {
        console.log('Di chuyển ra ngoài mê cung');
        return false;
    }

    // Kiểm tra có phải là tường không
    if (currentMaze.grid[y][x] === 1) {
        console.log('Không thể đi qua tường');
        return false;
    }

    return true;
}

function logMazeState() {
    console.log('Trạng thái mê cung:', {
        dimensions: `${currentMaze.width}x${currentMaze.height}`,
        playerPos: playerPos,
        goalPos: GOAL_POS,
        startPos: START_POS,
        isActive: isGameActive
    });
}

// ========== KIỂM TRA THẮNG ==========
function drawGoal() {
    const x = GOAL_POS.x * cellSize;
    const y = GOAL_POS.y * cellSize;

    // Draw glow effect
    const gradient = ctx.createRadialGradient(
        x + cellSize/2, y + cellSize/2, 0,
        x + cellSize/2, y + cellSize/2, cellSize
    );
    gradient.addColorStop(0, 'rgba(39, 174, 96, 0.4)');
    gradient.addColorStop(1, 'rgba(39, 174, 96, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(x - cellSize/2, y - cellSize/2, cellSize*2, cellSize*2);

    // Draw goal marker
    ctx.beginPath();
    ctx.fillStyle = currentTheme.goal;

    // Draw star shape
    const centerX = x + cellSize/2;
    const centerY = y + cellSize/2;
    const spikes = 5;
    const outerRadius = cellSize/3;
    const innerRadius = cellSize/6;

    let rot = Math.PI/2*3;
    let step = Math.PI/spikes;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY - outerRadius);

    for(let i = 0; i < spikes; i++) {
        let x1 = centerX + Math.cos(rot) * outerRadius;
        let y1 = centerY + Math.sin(rot) * outerRadius;
        ctx.lineTo(x1, y1);
        rot += step;

        let x2 = centerX + Math.cos(rot) * innerRadius;
        let y2 = centerY + Math.sin(rot) * innerRadius;
        ctx.lineTo(x2, y2);
        rot += step;
    }

    ctx.lineTo(centerX, centerY - outerRadius);
    ctx.closePath();
    ctx.fill();
}

function checkWin() {
    if (playerPos.x === goalPos.x && playerPos.y === goalPos.y) {
        console.log('Người chơi đã thắng!');
        isGameActive = false;

        const timeElapsed = Math.floor((Date.now() - gameStartTime) / 1000);
        showStatus(`Chúc mừng! Bạn đã hoàn thành mê cung trong ${timeElapsed} giây!`);

        // Gửi kết quả lên server (nếu cần)
        submitScore(timeElapsed);
    }
}

// Thêm vào phần khai báo biến toàn cục ở đầu file
let visitedCells = new Set(); // Lưu trữ các ô đã đi qua

// Thêm hàm này vào file
function clearVisitedCells() {
    console.log('Xóa lịch sử các ô đã đi qua');
    visitedCells.clear();
}

// Thêm hàm đánh dấu ô đã đi qua
function markVisited(x, y) {
    visitedCells.add(`${x},${y}`);
}

// Thêm hàm kiểm tra ô đã đi qua chưa
function isVisited(x, y) {
    return visitedCells.has(`${x},${y}`);
}

// Cập nhật hàm drawCell để vẽ màu khác cho ô đã đi qua
function drawCell(x, y) {
    const isWall = currentMaze.grid[y][x] === 1;
    const visited = isVisited(x, y);

    // Tính toán vị trí và kích thước ô
    const cellX = x * cellSize;
    const cellY = y * cellSize;

    // Chọn màu dựa trên trạng thái ô
    if (isWall) {
        ctx.fillStyle = currentTheme.wall;
    } else if (visited) {
        ctx.fillStyle = currentTheme.visited;
    } else {
        ctx.fillStyle = currentTheme.path;
    }

    // Vẽ nền ô
    ctx.fillRect(cellX, cellY, cellSize, cellSize);

    // Vẽ viền ô
    ctx.strokeStyle = '#666';
    ctx.strokeRect(cellX, cellY, cellSize, cellSize);

    // Thêm hiệu ứng cho tường
    if (isWall) {
        addWallEffect(cellX, cellY);
    }
}

// ========== HIỂN THỊ THÔNG BÁO ==========
// Cập nhật hàm showStatus để hiển thị rõ ràng hơn
function showStatus(message) {
    const statusElement = document.getElementById('statusMessage');
    if (!statusElement) {
        console.error('Không tìm thấy phần tử statusMessage');
        return;
    }

    statusElement.textContent = message;
    statusElement.classList.add('fade-in');
    console.log('Hiển thị thông báo:', message);

    // Xóa thông báo sau 5 giây
    setTimeout(() => {
        statusElement.classList.remove('fade-in');
        statusElement.textContent = '';
    }, 5000);
}

// ========== CHUYỂN ĐỔI THEME ==========
function toggleTheme() {
    currentTheme = currentTheme === THEMES.default ? THEMES.neon : THEMES.default;
    console.log('Chuyển đổi theme:', currentTheme === THEMES.default ? 'Default' : 'Neon');
    drawMaze();
}

// ========== ĐIỀU CHỈNH KÍCH THƯỚC ==========
function resizeCanvas() {
    const padding = 40; // Khoảng cách đệm

    // Tính toán kích thước cell để vừa với màn hình
    const maxWidth = window.innerWidth - padding;
    const maxHeight = window.innerHeight - 200; // Trừ đi space cho controls

    cellSize = Math.min(
        Math.floor(maxWidth / currentMaze.width),
        Math.floor(maxHeight / currentMaze.height),
        40 // Kích thước tối đa của cell
    );

    // Cập nhật kích thước canvas
    canvas.width = currentMaze.width * cellSize;
    canvas.height = currentMaze.height * cellSize;

    console.log('Đã điều chỉnh kích thước canvas:', canvas.width, 'x', canvas.height);
}

// ========== XỬ LÝ KHI CỬA SỔ THAY ĐỔI KÍCH THƯỚC ==========
window.addEventListener('resize', () => {
    if (currentMaze) {
        resizeCanvas();
        drawMaze();
    }
});

// ========== KHỞI TẠO KHI TRANG ĐÃ TẢI XONG ==========
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMazeGame);
} else {
    initMazeGame();
}