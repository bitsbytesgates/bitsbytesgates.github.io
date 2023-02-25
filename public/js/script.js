
function detectMob() {
//    alert(window.screen.availWidth);
//    alert(window.screen.availHeight);
    return ( ( window.screen.availWidth <= 800 ) || ( window.screen.availHeight <= 600 ) );
}

(function(document) {
  var toggle = document.querySelector('.sidebar-toggle');
  var sidebar = document.querySelector('#sidebar');
  var checkbox = document.querySelector('#sidebar-checkbox');

  document.addEventListener('click', function(e) {
    var target = e.target;

    if(!checkbox.checked ||
       sidebar.contains(target) ||
       (target === checkbox || target === toggle)) return;

    checkbox.checked = false;
  }, false);
})(document);

var toggler = document.getElementsByClassName("caret");
var i;

for (i = 0; i < toggler.length; i++) {
  toggler[i].addEventListener("click", function() {
    this.parentElement.querySelector(".nested").classList.toggle("active");
    this.classList.toggle("caret-down");
  });
}

var sidebar_checkbox = document.getElementById("sidebar-checkbox")
sidebar_checkbox.removeAttribute("checked");
// if (sidebar_checkbox != null) {
//     if (detectMob()) {
//         sidebar_checkbox.removeAttribute("checked");
//     } else {
//         sidebar_checkbox.setAttribute("checked", "checked");
//     }
// }
