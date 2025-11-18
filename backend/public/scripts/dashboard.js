function setProgress(percent) {
    const circle = document.querySelector('.progress-ring');
    const text = document.getElementById('progress-text');
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - percent / 100);

    circle.style.strokeDasharray = `${circumference}`;
    circle.style.strokeDashoffset = offset;
    text.innerText = `${percent}%`;
}

// Example: Set progress to 91%
setProgress(69);