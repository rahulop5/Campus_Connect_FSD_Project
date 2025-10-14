const filterButton = document.querySelector('.filter button');
const inputDiv = document.querySelector('.input');
const hiddenDiv = document.querySelector('.hidden-div');

filterButton.addEventListener('click', () => {
  if (inputDiv.style.transform === 'translateX(-100%)') {
    inputDiv.style.transform = 'translateX(0)';
    hiddenDiv.style.left = '100%';
  } else {
    inputDiv.style.transform = 'translateX(-100%)';
    hiddenDiv.style.left = '0';
  }
});

document.addEventListener('click', async (e) => {
  const target = e.target;

  // --- Upvote Question ---
  if (target.matches('.po_qelab .upvote-triangle')) {
    const id = target.dataset.id;
    if (!id) return console.error("Question ID missing in upvote button");

    const res = await fetch('/upvote-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const data = await res.json();
    if (data?.votes !== undefined) {
      target.nextElementSibling.querySelector('p').textContent = data.votes;
    }
  }

  // --- Downvote Question ---
  if (target.matches('.po_qelab .downvote-triangle')) {
    const id = target.dataset.id;
    if (!id) return console.error("Question ID missing in downvote button");

    const res = await fetch('/downvote-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const data = await res.json();
    if (data?.votes !== undefined) {
      target.previousElementSibling.querySelector('p').textContent = data.votes;
    }
  }

  // --- Upvote Answer ---
  if (target.matches('.ansupdownvote .upvote-triangle')) {
    const questionId = target.dataset.questionId;
    const answerId = target.dataset.answerId;
    if (!questionId || !answerId) return console.error("Missing IDs for answer upvote");

    const res = await fetch('/upvote-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, answerId })
    });
    const data = await res.json();
    if (data?.votes !== undefined) {
      target.nextElementSibling.querySelector('p').textContent = data.votes;
    }
  }

  // --- Downvote Answer ---
  if (target.matches('.ansupdownvote .downvote-triangle')) {
    const questionId = target.dataset.questionId;
    const answerId = target.dataset.answerId;
    if (!questionId || !answerId) return console.error("Missing IDs for answer downvote");

    const res = await fetch('/downvote-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, answerId })
    });
    const data = await res.json();
    if (data?.votes !== undefined) {
      target.previousElementSibling.querySelector('p').textContent = data.votes;
    }
  }
});
