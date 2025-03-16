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


document.addEventListener('DOMContentLoaded', () => {
  // Upvote question
  document.querySelectorAll('.po_qelab .upvote-triangle').forEach(button => {
    button.addEventListener('click', (e) => {
      const id = button.getAttribute('data-id');
      
      fetch('/upvote-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      })
      .then(res => res.json())
      .then(data => {
        // Update the votes on the page
        const voteElement = button.nextElementSibling.querySelector('p');
        voteElement.textContent = data.votes;
      });
    });
  });

  // Downvote question
  document.querySelectorAll('.po_qelab .downvote-triangle').forEach(button => {
    button.addEventListener('click', (e) => {
      const id = button.getAttribute('data-id');

      fetch('/downvote-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      })
      .then(res => res.json())
      .then(data => {
        // Update the votes on the page
        const voteElement = button.previousElementSibling.querySelector('p');
        voteElement.textContent = data.votes;
      });
    });
  });

  // Upvote answer
  document.querySelectorAll('.ansupdownvote .upvote-triangle').forEach(button => {
    button.addEventListener('click', (e) => {
      const questionId = button.getAttribute('data-question-id');
      const answerId = button.getAttribute('data-answer-id');

      fetch('/upvote-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ questionId, answerId })
      })
      .then(res => res.json())
      .then(data => {
        // Update the votes on the page
        const voteElement = button.nextElementSibling.querySelector('p');
        voteElement.textContent = data.votes;
      });
    });
  });

  // Downvote answer
  document.querySelectorAll('.ansupdownvote .downvote-triangle').forEach(button => {
    button.addEventListener('click', (e) => {
      const questionId = button.getAttribute('data-question-id');
      const answerId = button.getAttribute('data-answer-id');

      fetch('/downvote-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ questionId, answerId })
      })
      .then(res => res.json())
      .then(data => {
        // Update the votes on the page
        const voteElement = button.previousElementSibling.querySelector('p');
        voteElement.textContent = data.votes;
      });
    });
  });
});
