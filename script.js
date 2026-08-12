// ---------------------------------------------------------------
// Zahra's Birthday Site — shared interactivity
// ---------------------------------------------------------------

const WISH_STORAGE_KEY = "zahra-birthday-wishes";
const LIKE_STORAGE_KEY = "zahra-birthday-likes";

document.addEventListener("DOMContentLoaded", () => {
  initBalloons();
  initGiftReveals();
  initGalleryFallbacks();
  initLightbox();
  initWishWall();
  initScrollReveal();
  initGalleryHearts();
});

/* ---------------- Ambient balloons ---------------- */

function initBalloons() {
  const field = document.getElementById("balloonField");
  if (!field) return;

  const colors = ["#efb0c9", "#a2d2ff", "#ffd166", "#ffffff"];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  function spawnBalloon() {
    const balloon = document.createElement("div");
    balloon.className = "balloon";
    const size = 36 + Math.random() * 26;
    balloon.style.width = `${size}px`;
    balloon.style.height = `${size * 1.25}px`;
    balloon.style.left = `${Math.random() * 96}%`;
    balloon.style.background = colors[Math.floor(Math.random() * colors.length)];
    const duration = 9 + Math.random() * 6;
    balloon.style.animationDuration = `${duration}s`;
    field.appendChild(balloon);
    setTimeout(() => balloon.remove(), duration * 1000 + 500);
  }

  for (let i = 0; i < 4; i++) {
    setTimeout(spawnBalloon, i * 900);
  }
  setInterval(spawnBalloon, 2200);
}

/* ---------------- Confetti burst (reused by dua button + form) ---------------- */

function fireConfetti(count = 60) {
  const field = document.getElementById("confettiField");
  if (!field) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  const colors = ["#efb0c9", "#a2d2ff", "#ffd166", "#ffffff", "#4a2545"];

  for (let i = 0; i < count; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = `${1.6 + Math.random() * 1.4}s`;
    piece.style.animationDelay = `${Math.random() * 0.3}s`;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    field.appendChild(piece);
    setTimeout(() => piece.remove(), 3500);
  }
}

/* ---------------- Gift reveal (click support, caption lives inside the card) ---------------- */

function initGiftReveals() {
  const gifts = document.querySelectorAll(".gift-image");
  gifts.forEach((gift) => {
    gift.addEventListener("click", () => {
      gift.classList.toggle("revealed");
    });
  });
}

/* ---------------- Gallery: graceful placeholder for missing photos ---------------- */

function initGalleryFallbacks() {
  const cards = document.querySelectorAll(".gallery-card");
  cards.forEach((card) => {
    const img = card.querySelector("img");
    if (!img) return;

    img.addEventListener("error", () => {
      card.classList.add("placeholder");
      const tile = document.createElement("div");
      tile.className = "placeholder-tile";
      tile.innerHTML = `
        <span class="placeholder-icon">🖼️</span>
        <span class="placeholder-label">Photo ${card.dataset.index} coming soon</span>
      `;
      card.insertBefore(tile, img);
    }, { once: true });
  });
}

/* ---------------- Gallery hearts (persisted per browser) ---------------- */

function initGalleryHearts() {
  const buttons = document.querySelectorAll(".heart-button");
  if (!buttons.length) return;

  let liked = {};
  try {
    liked = JSON.parse(localStorage.getItem(LIKE_STORAGE_KEY)) || {};
  } catch (e) {
    liked = {};
  }

  buttons.forEach((btn) => {
    const card = btn.closest(".gallery-card");
    const index = card ? card.dataset.index : btn.dataset.index;

    if (liked[index]) {
      btn.textContent = "❤️";
      btn.classList.add("liked");
    }

    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // don't trigger the lightbox
      const isLiked = btn.classList.toggle("liked");
      btn.textContent = isLiked ? "❤️" : "🤍";
      liked[index] = isLiked;
      try {
        localStorage.setItem(LIKE_STORAGE_KEY, JSON.stringify(liked));
      } catch (e) {
        /* storage unavailable — ignore */
      }
      if (isLiked) fireConfetti(18);
    });
  });
}

/* ---------------- Make a Wish + guestbook ---------------- */

function initWishWall() {
  const prayButton = document.getElementById("prayButton");
  const wall = document.getElementById("wishWall");
  const form = document.getElementById("wishForm");
  const list = document.getElementById("wishList");
  if (!prayButton || !wall || !form || !list) return;

  function loadWishes() {
    try {
      return JSON.parse(localStorage.getItem(WISH_STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveWishes(wishes) {
    try {
      localStorage.setItem(WISH_STORAGE_KEY, JSON.stringify(wishes));
    } catch (e) {
      /* storage unavailable — ignore */
    }
  }

  function renderWishes() {
    const wishes = loadWishes();
    list.innerHTML = "";

    if (wishes.length === 0) {
      const empty = document.createElement("li");
      empty.className = "wish-empty";
      empty.textContent = "No duas yet — be the first! 🤲";
      list.appendChild(empty);
      return;
    }

    // Keep a stable reference back to each wish's real position in storage,
    // since the list is displayed newest-first.
    wishes
      .map((wish, originalIndex) => ({ wish, originalIndex }))
      .reverse()
      .forEach(({ wish, originalIndex }) => {
        const item = document.createElement("li");
        item.className = "wish-item";
        item.dataset.id = originalIndex;

        const content = document.createElement("div");
        content.className = "wish-content";
        const name = document.createElement("strong");
        name.textContent = wish.name;
        const text = document.createElement("span");
        text.textContent = wish.text;
        content.appendChild(name);
        content.appendChild(text);

        const actions = document.createElement("div");
        actions.className = "wish-actions";

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "wish-action-btn wish-edit-btn";
        editBtn.setAttribute("aria-label", "Edit this dua");
        editBtn.textContent = "✏️";

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "wish-action-btn wish-delete-btn";
        deleteBtn.setAttribute("aria-label", "Delete this dua");
        deleteBtn.textContent = "🗑️";

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        item.appendChild(content);
        item.appendChild(actions);
        list.appendChild(item);
      });
  }

  function startEdit(item, originalIndex) {
    const wishes = loadWishes();
    const wish = wishes[originalIndex];
    if (!wish) return;

    item.classList.add("editing");
    item.innerHTML = "";

    const editForm = document.createElement("div");
    editForm.className = "wish-edit-form";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = wish.name;
    nameInput.maxLength = 40;
    nameInput.className = "wish-edit-name";

    const textInput = document.createElement("textarea");
    textInput.value = wish.text;
    textInput.maxLength = 200;
    textInput.className = "wish-edit-text";

    const editActions = document.createElement("div");
    editActions.className = "wish-edit-actions";

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "wish-action-btn wish-save-btn";
    saveBtn.textContent = "Save";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "wish-action-btn wish-cancel-btn";
    cancelBtn.textContent = "Cancel";

    saveBtn.addEventListener("click", () => {
      const newName = nameInput.value.trim();
      const newText = textInput.value.trim();
      if (!newName || !newText) return;
      const currentWishes = loadWishes();
      if (!currentWishes[originalIndex]) return;
      currentWishes[originalIndex] = { name: newName, text: newText };
      saveWishes(currentWishes);
      renderWishes();
    });

    cancelBtn.addEventListener("click", () => {
      renderWishes();
    });

    editActions.appendChild(saveBtn);
    editActions.appendChild(cancelBtn);
    editForm.appendChild(nameInput);
    editForm.appendChild(textInput);
    editForm.appendChild(editActions);
    item.appendChild(editForm);

    nameInput.focus();
  }

  function deleteWish(originalIndex) {
    const wishes = loadWishes();
    if (!wishes[originalIndex]) return;
    wishes.splice(originalIndex, 1);
    saveWishes(wishes);
    renderWishes();
  }

  list.addEventListener("click", (e) => {
    const item = e.target.closest(".wish-item");
    if (!item || !item.dataset.id) return;
    const originalIndex = Number(item.dataset.id);

    if (e.target.closest(".wish-edit-btn")) {
      startEdit(item, originalIndex);
    } else if (e.target.closest(".wish-delete-btn")) {
      deleteWish(originalIndex);
    }
  });

  prayButton.addEventListener("click", () => {
    if (prayButton.classList.contains("done")) return;
    prayButton.classList.add("done");
    prayButton.disabled = true;
    fireConfetti(80);
    wall.hidden = false;
    renderWishes();
    requestAnimationFrame(() => {
      wall.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nameInput = document.getElementById("wishName");
    const textInput = document.getElementById("wishText");
    const name = nameInput.value.trim();
    const text = textInput.value.trim();
    if (!name || !text) return;

    const wishes = loadWishes();
    wishes.push({ name, text });
    saveWishes(wishes);
    renderWishes();
    fireConfetti(30);

    form.reset();
    nameInput.focus();
  });
}

/* ---------------- Scroll reveal ---------------- */

function initScrollReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  items.forEach((item) => observer.observe(item));
}

/* ---------------- Lightbox ---------------- */

function initLightbox() {
  const lightbox = document.getElementById("lightbox");
  if (!lightbox) return;

  const cards = Array.from(document.querySelectorAll(".gallery-card"));
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const closeBtn = document.getElementById("lightboxClose");
  const prevBtn = document.getElementById("lightboxPrev");
  const nextBtn = document.getElementById("lightboxNext");

  let currentIndex = 0;

  function openAt(index) {
    currentIndex = (index + cards.length) % cards.length;
    const card = cards[currentIndex];
    const img = card.querySelector("img");
    const caption = card.querySelector("figcaption");

    if (card.classList.contains("placeholder")) {
      lightboxImg.style.display = "none";
    } else {
      lightboxImg.style.display = "block";
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
    }
    lightboxCaption.textContent = caption ? caption.textContent : "";

    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
  }

  function close() {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImg.src = "";
  }

  cards.forEach((card, index) => {
    card.addEventListener("click", () => openAt(index));
  });

  closeBtn.addEventListener("click", close);
  prevBtn.addEventListener("click", () => openAt(currentIndex - 1));
  nextBtn.addEventListener("click", () => openAt(currentIndex + 1));

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) close();
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") openAt(currentIndex + 1);
    if (e.key === "ArrowLeft") openAt(currentIndex - 1);
  });
}
