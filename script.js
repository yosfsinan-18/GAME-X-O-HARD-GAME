let currentUser = null;
let currentScore = 0;
let board = ["", "", "", "", "", "", "", "", ""];
let isGameActive = false;

function signup() {
    let user = document.getElementById("username").value;
    if(user) {
        currentUser = user;
        let randomId = Math.floor(10000 + Math.random() * 90000);
        document.getElementById("auth-container").style.display = "none";
        document.getElementById("game-container").style.display = "block";
        document.getElementById("profile-name").innerText = user;
        document.getElementById("footer-user").innerText = user;
        document.getElementById("profile-id").innerText = randomId;
    } else {
        alert("خاڵا ناڤی پڕ بکە!");
    }
}

function login() {
    signup();
}

function startAIGame() {
    document.getElementById("board").style.display = "grid";
    board = ["", "", "", "", "", "", "", "", ""];
    isGameActive = true;
    document.getElementById("status").innerText = "نۆرەیا تە یە (X)";
    renderBoard();
}

function makeMove(index) {
    if (!isGameActive || board[index] !== "") return;
    
    board[index] = "X";
    renderBoard();
    
    if (checkWin("X")) {
        document.getElementById("status").innerText = "تە برد! 🏆";
        currentScore += 10;
        document.getElementById("footer-score").innerText = currentScore;
        isGameActive = false;
        return;
    }
    
    // لڤینا ڕۆبۆتێ AI (زیرەک)
    document.getElementById("status").innerText = "ڕۆبۆت دڤێت بڤلێت...";
    setTimeout(() => {
        let emptyCells = [];
        board.forEach((val, idx) => { if(val === "") emptyCells.push(idx); });
        
        if(emptyCells.length > 0 && isGameActive) {
            let aiMove = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            board[aiMove] = "O";
            renderBoard();
            
            if (checkWin("O")) {
                document.getElementById("status").innerText = "ڕۆبۆتی برد!";
                isGameActive = false;
            } else {
                document.getElementById("status").innerText = "نۆرەیا تە یە (X)";
            }
        }
    }, 500);
}

function renderBoard() {
    let cells = document.querySelectorAll(".cell");
    cells.forEach((cell, idx) => {
        cell.innerText = board[idx];
    });
}

function checkWin(player) {
    const winConditions = [
        [0,1,2], [3,4,5], [6,7,8],
        [0,3,6], [1,4,7], [2,5,8],
        [0,4,8], [2,4,6]
    ];
    return winConditions.some(condition => {
        return condition.every(index => board[index] === player);
    });
}

function startOnlineGame() {
    alert("تایبەتمەندییا ئنلاین ب ID چالاک بوو! (دڤێت سێرڤەرەکێ Socket.io هه‌بێت)");
}
