function setStars(parentElement, n) {
    const stars = parentElement.querySelectorAll('.fa-star');

    // Reset all stars
    stars.forEach(star => {
        star.classList.remove('checked');
    });

    // Fill stars up to n
    for (let i = 0; i < n; i++) {
        stars[i].classList.add('checked');
    }
}
