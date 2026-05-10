let theme = 'light';

function toggleTheme() {
  const elements = document.querySelectorAll('.body');

  elements.forEach(element => {
    if (theme === 'light') {
      element.style.backgroundColor = '#2f2f2f';
      element.style.color = '#f0f0f0';
    } else {
      element.style.backgroundColor = '#f0f0f0';
      element.style.color = '#030303';
    }
  });

  theme = theme === 'light' ? 'dark' : 'light';
}
