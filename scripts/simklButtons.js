// Maps each Simkl sub-list to its image + real Simkl URL + label.
const SIMKL_LISTS = {
  "simkl-movies-watched": {
    img: "images/screenshots/simkl-movies-watched.png",
    url: "https://simkl.com/movies/all/all-countries/completed/all-years/user-7334903/",
    label: "Movies - Watched",
  },
  "simkl-movies-planned": {
    img: "images/screenshots/simkl-movies-planned.png",
    url: "https://simkl.com/movies/all/all-countries/plan-to-watch/all-years/user-7334903/",
    label: "Movies - Planned",
  },
  "simkl-shows-watching": {
    img: "images/screenshots/simkl-shows-watching.png",
    url: "https://simkl.com/tv/all/all-types/all-countries/watching/all-years/user-7334903/",
    label: "Shows - Watching",
  },
  "simkl-shows-planned": {
    img: "images/screenshots/simkl-shows-planned.png",
    url: "https://simkl.com/tv/all/all-types/all-countries/plan-to-watch/all-years/user-7334903/",
    label: "Shows - Planned",
  },
  "simkl-shows-watched": {
    img: "images/screenshots/simkl-shows-watched.png",
    url: "https://simkl.com/tv/all/all-types/all-countries/completed/all-years/user-7334903/",
    label: "Shows - Watched",
  },
};

function showSimklCard(id, btn) {
  const data = SIMKL_LISTS[id];
  const group = id.startsWith("simkl-movies") ? "movies" : "shows";

  document.getElementById(`simkl-${group}-image`).src = data.img;
  document.getElementById(`simkl-${group}-label`).textContent = data.label;
  document.getElementById(`simkl-${group}-link`).href = data.url;

  // Highlight the selected button within its group
  btn.parentElement
    .querySelectorAll("button")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
}

// Default both cards to "Watched" on page load so neither starts empty
document.addEventListener("DOMContentLoaded", () => {
  showSimklCard(
    "simkl-movies-watched",
    document.querySelector("#simkl-movies-buttons button"),
  );
  showSimklCard(
    "simkl-shows-watched",
    document.querySelector("#simkl-shows-buttons button"),
  );
});
