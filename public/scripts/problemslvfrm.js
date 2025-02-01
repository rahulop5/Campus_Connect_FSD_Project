const filterButton = document.querySelector('.filter button');
const inputDiv = document.querySelector('.input');

filterButton.addEventListener('click', () => {
  if (inputDiv.style.transform === 'translateX(-300px)') {
    inputDiv.style.transform = 'translateX(0)'; 
  } else {
    inputDiv.style.transform = 'translateX(-300px)'; 
  }
});