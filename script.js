// 1단계에서 만든 새로운 Google Sheets CSV 내보내기 링크를 여기에 붙여넣으세요.
const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/export?format=csv&gid=0';

// HTML 요소 가져오기 (이전과 동일)
const questionArea = document.getElementById('question-area');
const questionEl = document.getElementById('question');
const choicesEl = document.getElementById('choices');
const progressTextEl = document.getElementById('progress-text');
const resultArea = document.getElementById('result-area');
const scoreTextEl = document.getElementById('score-text');
const retryMessageEl = document.getElementById('retry-message');
const restartButton = document.getElementById('restart-button');

let allWords = []; // 시트에서 불러온 모든 단어 데이터
let currentQuestions = []; // 현재 풀어야 할 문제 10개
let currentQuestionIndex = 0;
let score = 0;
let incorrectQuestions = []; // 틀린 문제들을 저장할 배열

// 구글 시트에서 CSV 데이터 가져오기
async function fetchWords() {
    try {
        const response = await fetch(GOOGLE_SHEET_URL);
        const csvText = await response.text();
        // CSV 파싱: word와 meaning을 가진 객체 배열로 변환
        allWords = parseCSV(csvText);
        startNewGame();
    } catch (error) {
        questionEl.innerText = "문제를 불러오는 데 실패했습니다. URL을 확인해주세요.";
        console.error('Error fetching words:', error);
    }
}

// CSV 텍스트를 객체 배열로 변환
function parseCSV(text) {
    const lines = text.split(/\r\n|\n/).filter(line => line); // 빈 줄 제거
    const headers = lines[0].split(',');
    const words = [];
    for (let i = 1; i < lines.length; i++) {
        const data = lines[i].split(',');
        const wordObj = {
            word: data[0].trim(),
            meaning: data[1].trim()
        };
        words.push(wordObj);
    }
    return words;
}

// 새 게임 시작
function startNewGame() {
    score = 0;
    incorrectQuestions = [];
    // 전체 단어 목록에서 10개를 랜덤으로 선택하여 문제 세트로 만듦
    currentQuestions = selectRandomItems(allWords, 10);
    currentQuestionIndex = 0;
    resultArea.classList.add('hidden');
    questionArea.classList.remove('hidden');
    showQuestion();
}

// 배열에서 무작위로 n개의 항목 선택하는 헬퍼 함수
function selectRandomItems(arr, n) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
}

// 문제와 선택지 화면에 표시 (핵심 변경 부분)
function showQuestion() {
    choicesEl.innerHTML = '';
    
    // 현재 문제(정답) 데이터
    const correctEntry = currentQuestions[currentQuestionIndex];
    
    // 문제 유형을 랜덤으로 선택 (1: 단어 보고 뜻 맞추기, 2: 뜻 보고 단어 맞추기)
    const questionType = Math.random() < 0.5 ? 'wordToMeaning' : 'meaningToWord';

    let questionText, correctAnswer;
    let choicesPool = allWords; // 오답을 가져올 전체 단어 목록

    if (questionType === 'wordToMeaning') {
        questionText = `다음 단어의 뜻은 무엇일까요?\n\n"${correctEntry.word}"`;
        correctAnswer = correctEntry.meaning;
        // 오답 선택지는 다른 단어들의 '뜻' 중에서 가져옴
        choicesPool = allWords.map(item => item.meaning);
    } else {
        questionText = `다음 뜻을 가진 영어 단어는 무엇일까요?\n\n"${correctEntry.meaning}"`;
        correctAnswer = correctEntry.word;
        // 오답 선택지는 다른 단어들의 'word' 중에서 가져옴
        choicesPool = allWords.map(item => item.word);
    }

    questionEl.innerText = questionText;
    progressTextEl.innerText = `문제 ${currentQuestionIndex + 1} / ${currentQuestions.length}`;

    // 오답 후보군 생성 (정답은 제외)
    const wrongAnswersPool = choicesPool.filter(item => item !== correctAnswer);
    
    // 오답 3개 랜덤 선택
    const wrongAnswers = selectRandomItems(wrongAnswersPool, 3);
    
    // 정답 + 오답 3개를 합쳐서 섞기
    const choices = [correctAnswer, ...wrongAnswers];
    const shuffledChoices = choices.sort(() => Math.random() - 0.5);

    // 선택지 버튼 만들기
    shuffledChoices.forEach(choice => {
        const button = document.createElement('button');
        button.innerText = choice;
        button.classList.add('choice-btn');
        button.addEventListener('click', () => selectAnswer(button, correctAnswer));
        choicesEl.appendChild(button);
    });
}


// 답안 선택 시 (이전과 거의 동일)
function selectAnswer(selectedButton, correctAnswer) {
    const isCorrect = selectedButton.innerText === correctAnswer;

    Array.from(choicesEl.children).forEach(btn => {
        btn.disabled = true;
        if (btn.innerText === correctAnswer) {
            btn.classList.add('correct');
        }
    });

    if (isCorrect) {
        score++;
        selectedButton.classList.add('correct');
    } else {
        selectedButton.classList.add('wrong');
        incorrectQuestions.push(currentQuestions[currentQuestionIndex]);
    }
    
    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < currentQuestions.length) {
            showQuestion();
        } else {
            showResult();
        }
    }, 1000);
}

// 결과 표시 (이전과 동일)
function showResult() {
    questionArea.classList.add('hidden');
    resultArea.classList.remove('hidden');
    scoreTextEl.innerText = `총 ${currentQuestions.length}문제 중 ${score}문제를 맞혔습니다!`;

    if (incorrectQuestions.length > 0) {
        retryMessageEl.innerText = `틀린 ${incorrectQuestions.length}문제를 다시 풀어봅니다.`;
        currentQuestions = [...incorrectQuestions];
        incorrectQuestions = [];
        currentQuestionIndex = 0;
        score = 0;
        
        setTimeout(() => {
            resultArea.classList.add('hidden');
            questionArea.classList.remove('hidden');
            showQuestion();
        }, 2000);

    } else {
        retryMessageEl.innerText = "🎉 축하합니다! 모든 문제를 맞혔습니다!";
    }
}

// 이벤트 리스너 등록
restartButton.addEventListener('click', startNewGame);

// 퀴즈 시작!
fetchWords();
