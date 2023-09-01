window.onload = function () {
  var button = document.getElementById("chatSelect");
  button.style.borderBottomLeftRadius = "10px";
  button.style.borderBottomRightRadius = "10px";
};

document.getElementById("chatSelect").addEventListener("click", function () {
  var dropdown = document.getElementById("chatDropdown");
  var button = document.getElementById("chatSelect");

  if (dropdown.style.display === "block") {
    dropdown.style.display = "none";
    button.style.borderBottomLeftRadius = "10px";
    button.style.borderBottomRightRadius = "10px";
  } else {
    dropdown.style.display = "block";
    button.style.borderBottomLeftRadius = "0";
    button.style.borderBottomRightRadius = "0";
  }
});

window.addEventListener("click", function (event) {
  if (!event.target.matches("#chatSelect")) {
    var dropdown = document.getElementById("chatDropdown");
    var button = document.getElementById("chatSelect");

    dropdown.style.display = "none";
    button.style.borderBottomLeftRadius = "10px";
    button.style.borderBottomRightRadius = "10px";
  }
});
var chatLinks = document.querySelectorAll("#chatDropdown a");
chatLinks.forEach(function (link) {
  // Add event listener to each link
  link.addEventListener("click", function (event) {
    // If alt key is pressed, prevent default behavior and trigger HTMX request
    if (event.altKey) {
      event.preventDefault();
      htmx.trigger(link, "htmx:hx");
    }
  });
});
// Get all chat links
var chatLinks = document.querySelectorAll("#chatDropdown a");
chatLinks.forEach(function (link) {
  // Add event listener to each link
  link.addEventListener("click", function (event) {
    // If alt key is pressed, prevent default behavior and trigger HTMX request
    if (event.altKey) {
      event.preventDefault();
      link.setAttribute("hx-post", "/deleteChat");
      link.setAttribute("hx-swap", "outerHTML");
      link.setAttribute("hx-vals", `{"chatId": "${link.id}"}`);
      htmx.trigger(link, "htmx:hx");
    }
  });
});
