document.addEventListener('DOMContentLoaded', function() {
    const editor = document.getElementById('answer-textarea');
    const boldBtn = document.querySelector('.po_useranstools img[data-format="bold"]');
    const italicBtn = document.querySelector('.po_useranstools img[data-format="italic"]');
    const headingBtn = document.querySelector('.po_useranstools .heading-btn');
    const codeBtn = document.querySelector('.po_useranstools img[data-format="code"]');
    const form = editor.closest('form');
    const hiddenInput = document.getElementById('hidden-desc');
    
    // Function to update button states
    function updateButtonStates() {
        // Check bold
        if (document.queryCommandState('bold')) {
            boldBtn.classList.add('active');
        } else {
            boldBtn.classList.remove('active');
        }
        
        // Check italic
        if (document.queryCommandState('italic')) {
            italicBtn.classList.add('active');
        } else {
            italicBtn.classList.remove('active');
        }
    }
    
    // Update button states on selection change
    editor.addEventListener('mouseup', updateButtonStates);
    editor.addEventListener('keyup', updateButtonStates);
    editor.addEventListener('focus', updateButtonStates);
    
    // Bold button
    boldBtn.addEventListener('click', function(e) {
        e.preventDefault();
        document.execCommand('bold', false, null);
        updateButtonStates();
        editor.focus();
    });
    
    // Italic button
    italicBtn.addEventListener('click', function(e) {
        e.preventDefault();
        document.execCommand('italic', false, null);
        updateButtonStates();
        editor.focus();
    });
    
    // Heading button
    headingBtn.addEventListener('click', function(e) {
        e.preventDefault();
        document.execCommand('formatBlock', false, 'h3');
        editor.focus();
    });
    
    // Code block button
    codeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        document.execCommand('formatBlock', false, 'pre');
        editor.focus();
    });
    
    // Update hidden input before form submission
    form.addEventListener('submit', function(e) {
        // Get the HTML content from the contenteditable div
        const content = editor.innerHTML;
        
        // If empty, prevent submission
        if (!editor.textContent.trim()) {
            e.preventDefault();
            alert('Please describe your question');
            return false;
        }
        
        // Set the hidden input value to the HTML content
        hiddenInput.value = content;
    });
    
    // Placeholder behavior for contenteditable
    editor.addEventListener('focus', function() {
        if (this.textContent.trim() === '') {
            this.innerHTML = '';
        }
    });
    
    editor.addEventListener('blur', function() {
        if (this.textContent.trim() === '') {
            this.innerHTML = '';
        }
    });
});
