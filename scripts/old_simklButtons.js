document.querySelectorAll(".accordion").forEach(button => {
  button.addEventListener("click", () => {
    const targetId = button.getAttribute("data-target");
    const panel = document.getElementById(targetId);

    // Close all panels and restore buttons
    document.querySelectorAll(".panel").forEach(p => {
      p.style.display = "none";
      p.previousElementSibling.style.display = "block";
    });

    // Hide clicked button & show its panel
    button.style.display = "none";
    panel.style.display = "flex";
  });
});
