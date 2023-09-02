window.onload = function () {
  const button = document.getElementById("chatSelect");
  button.style.borderBottomLeftRadius = "10px";
  button.style.borderBottomRightRadius = "10px";
};

document.getElementById("chatSelect").addEventListener("click", function () {
  const dropdown = document.getElementById("chatDropdown");
  const button = document.getElementById("chatSelect");

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
    const dropdown = document.getElementById("chatDropdown");
    const button = document.getElementById("chatSelect");

    dropdown.style.display = "none";
    button.style.borderBottomLeftRadius = "10px";
    button.style.borderBottomRightRadius = "10px";
  }
});

const chatLinks = document.querySelectorAll("#chatDropdown a");
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
const chatLinks = document.querySelectorAll("#chatDropdown a");
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