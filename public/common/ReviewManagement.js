function checkAddForm() {
    var review = document.forms["reviewForm"]["review"].value;

    if (review.trim() === "") {
        alert("All fields must be filled out");
        return false;
    }
    else {
        return true;
    }
}

function checkEditForm() {
    var review = document.forms["reviewForm"]["review"].value;

    if (review.trim() === "") {
        alert("All fields must be filled out");
        return false;
    }
    else {
        return true;
    }
}