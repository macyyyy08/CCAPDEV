Handlebars.registerHelper('isEqual', function(a, b, options) {
  return a == b ? options.fn(this) : options.inverse(this);
});

function showDropdown() {
  var dropdown = document.getElementById("myDropdown");
  dropdown.style.display = "block";
}

function hideDropdown() {
  var dropdown = document.getElementById("myDropdown");
  setTimeout(() => { 
      dropdown.style.display = "none";
  }, 200); 
}

function filterFunction() {
  var input, filter, div, a, i;
  input = document.getElementById("myInput");
  filter = input.value.toUpperCase();
  div = document.getElementById("myDropdown");
  a = div.getElementsByTagName("a");
  for (i = 0; i < a.length; i++) {
      txtValue = a[i].textContent || a[i].innerText;
      if (txtValue.toUpperCase().indexOf(filter) > -1) {
          a[i].style.display = "block"; 
      } else {
          a[i].style.display = "none";
      }
  }
}
