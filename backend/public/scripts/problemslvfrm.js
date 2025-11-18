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
