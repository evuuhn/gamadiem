let authenticated = false;
try {
  authenticated = localStorage.getItem("gamadiem_isLoggedIn") === "true";
} catch (error) {
  console.error("Could not read Gamadiem login status.", error);
}

if (!authenticated) {
  window.location.replace("index.html");
} else {
  const restaurants = [
    {
      id: "bu-yati",
      name: "Warung Makan Bu Yati",
      category: "Rice Meals",
      rating: "4.7",
      minPrice: 15000,
      maxPrice: 25000,
      distance: "400 m walk",
      description: "Home-style Indonesian meals • Kaliurang area",
      location: "Kaliurang, near Universitas Gadjah Mada, Yogyakarta",
      emoji: "🍛",
      sticker: "assets/recommendation-meal.png"
    },
    {
      id: "soto-pak-marto",
      name: "Soto Ayam Pak Marto",
      category: "Rice Meals",
      rating: "4.6",
      minPrice: 18000,
      maxPrice: 25000,
      distance: "650 m walk",
      description: "Soto ayam and warm rice • Agro area",
      location: "Agro area, Universitas Gadjah Mada, Yogyakarta",
      emoji: "🍲",
      sticker: "assets/recommendation-soup.png"
    },
    {
      id: "tuku-ugm",
      name: "Tuku Kopi UGM",
      category: "Drinks",
      rating: "4.8",
      minPrice: 20000,
      maxPrice: 28000,
      distance: "500 m walk",
      description: "Coffee and light bites • Bulaksumur",
      location: "Bulaksumur, Universitas Gadjah Mada, Yogyakarta",
      emoji: "☕",
      sticker: "assets/recommendation-coffee.png"
    },
    {
      id: "bakmi-johar",
      name: "Bakmi Johar",
      category: "Noodles",
      rating: "4.5",
      minPrice: 16000,
      maxPrice: 24000,
      distance: "700 m walk",
      description: "Noodle dishes • near campus",
      location: "Near Universitas Gadjah Mada, Yogyakarta",
      emoji: "🍜"
    },
    {
      id: "kantin-biogeo",
      name: "Kantin BioGeo FMIPA",
      category: "Rice Meals",
      rating: "4.5",
      minPrice: 12000,
      maxPrice: 20000,
      distance: "300 m walk",
      description: "Student lunch options • FMIPA UGM",
      location: "Kantin BioGeo FMIPA, Universitas Gadjah Mada, Yogyakarta",
      emoji: "🍱"
    },
    {
      id: "pogung-food-stalls",
      name: "Pogung Student Food Stalls",
      category: "Rice Meals",
      rating: "4.4",
      minPrice: 10000,
      maxPrice: 18000,
      distance: "1 km walk",
      description: "Budget-friendly rice meals • Pogung",
      location: "Pogung, near Universitas Gadjah Mada, Yogyakarta",
      emoji: "🍚"
    },
    {
      id: "karangmalang-angkringan",
      name: "Angkringan Karangmalang",
      category: "Snacks",
      rating: "4.5",
      minPrice: 6000,
      maxPrice: 15000,
      distance: "850 m walk",
      description: "Satay, rice packets and snacks • Karangmalang",
      location: "Karangmalang, near Universitas Gadjah Mada, Yogyakarta",
      emoji: "🍢"
    },
    {
      id: "klebengan-stalls",
      name: "Klebengan Student Food Stalls",
      category: "Snacks",
      rating: "4.3",
      minPrice: 5000,
      maxPrice: 12000,
      distance: "1.2 km walk",
      description: "Quick bites and student meals • Klebengan",
      location: "Klebengan, near Universitas Gadjah Mada, Yogyakarta",
      emoji: "🥟"
    }
  ];

  const foodList = document.getElementById("foodList");
  const priceFilter = document.getElementById("priceFilter");
  const mapFrame = document.getElementById("mapFrame");
  const mapPlaceLabel = document.getElementById("mapPlaceLabel");
  const openInMaps = document.getElementById("openInMaps");
  const categoryButtons = document.querySelectorAll(".filter-chip");
  let activeCategory = "All";
  let selectedRestaurantId = null;

  function formatRupiah(amount) {
    return "Rp " + amount.toLocaleString("id-ID");
  }

  function updateMap(restaurant) {
    if (!restaurant) {
      mapFrame.src = "https://maps.google.com/maps?q=Universitas%20Gadjah%20Mada%20Yogyakarta&t=&z=15&ie=UTF8&iwloc=&output=embed";
      mapPlaceLabel.textContent = "UNIVERSITAS GADJAH MADA (UGM)";
      openInMaps.href = "https://www.google.com/maps/dir/?api=1&destination=Universitas%20Gadjah%20Mada%20Yogyakarta";
      return;
    }

    const query = restaurant.name + ", " + restaurant.location;
    mapFrame.src = "https://maps.google.com/maps?q=" + encodeURIComponent(query) + "&t=&z=16&ie=UTF8&iwloc=&output=embed";
    mapPlaceLabel.textContent = restaurant.name;
    openInMaps.href = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(query);
  }

  function selectRestaurant(restaurant) {
    selectedRestaurantId = restaurant ? restaurant.id : null;
    foodList.querySelectorAll(".food-card").forEach(function (card) {
      const selected = card.dataset.restaurantId === selectedRestaurantId;
      card.classList.toggle("selected", selected);
      card.setAttribute("aria-pressed", String(selected));
    });
    updateMap(restaurant);
  }

  function createRestaurantCard(restaurant) {
    const card = document.createElement("article");
    card.className = "food-card";
    card.dataset.restaurantId = restaurant.id;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-pressed", "false");
    card.setAttribute("aria-label", restaurant.name + ", " + restaurant.category + ", " + formatRupiah(restaurant.minPrice) + " to " + formatRupiah(restaurant.maxPrice));

    const emoji = document.createElement("span");
    emoji.className = "food-emoji";
    emoji.setAttribute("aria-hidden", "true");
    emoji.textContent = restaurant.emoji;

    const copy = document.createElement("div");
    copy.className = "food-copy";

    const title = document.createElement("h3");
    title.textContent = restaurant.name;

    const meta = document.createElement("p");
    meta.className = "food-meta";
    const category = document.createElement("span");
    category.textContent = restaurant.category;
    const separator = document.createElement("span");
    separator.setAttribute("aria-hidden", "true");
    separator.textContent = "•";
    const rating = document.createElement("span");
    rating.className = "rating";
    rating.textContent = "★ " + restaurant.rating;
    meta.append(category, separator, rating);

    const price = document.createElement("p");
    price.className = "food-price";
    price.textContent = formatRupiah(restaurant.minPrice) + " – " + formatRupiah(restaurant.maxPrice);

    const description = document.createElement("p");
    description.className = "food-description";
    description.textContent = restaurant.description;
    copy.append(title, meta, price, description);

    const distance = document.createElement("span");
    distance.className = "food-distance";
    distance.textContent = "🚶 " + restaurant.distance;

    const heart = document.createElement("img");
    heart.className = "food-heart";
    heart.src = "assets/recommendation-heart.svg";
    heart.alt = "";

    card.append(emoji, copy, distance, heart);

    if (restaurant.sticker) {
      const sticker = document.createElement("img");
      sticker.className = "food-sticker";
      sticker.src = restaurant.sticker;
      sticker.alt = "";
      card.appendChild(sticker);
    }

    return card;
  }

  function renderRestaurants() {
    const maxPrice = Number(priceFilter.value);
    const filteredRestaurants = restaurants.filter(function (restaurant) {
      const matchesCategory = activeCategory === "All" || restaurant.category === activeCategory;
      return matchesCategory && restaurant.maxPrice <= maxPrice;
    });

    if (selectedRestaurantId && !filteredRestaurants.some(function (restaurant) {
      return restaurant.id === selectedRestaurantId;
    })) {
      selectRestaurant(null);
    }

    foodList.replaceChildren();
    if (filteredRestaurants.length === 0) {
      const emptyState = document.createElement("p");
      emptyState.className = "no-recommendations";
      emptyState.textContent = "No recommendations match these filters.";
      foodList.appendChild(emptyState);
      return;
    }

    filteredRestaurants.forEach(function (restaurant) {
      foodList.appendChild(createRestaurantCard(restaurant));
    });

    if (selectedRestaurantId) {
      selectRestaurant(restaurants.find(function (restaurant) {
        return restaurant.id === selectedRestaurantId;
      }));
    }
  }

  categoryButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      activeCategory = button.dataset.category;
      categoryButtons.forEach(function (categoryButton) {
        const selected = categoryButton === button;
        categoryButton.classList.toggle("active", selected);
        categoryButton.setAttribute("aria-pressed", String(selected));
      });
      renderRestaurants();
    });
  });

  priceFilter.addEventListener("change", renderRestaurants);

  foodList.addEventListener("click", function (event) {
    const card = event.target.closest(".food-card");
    if (!card || !foodList.contains(card)) return;
    const restaurant = restaurants.find(function (item) {
      return item.id === card.dataset.restaurantId;
    });
    if (restaurant) selectRestaurant(restaurant);
  });

  foodList.addEventListener("keydown", function (event) {
    if ((event.key !== "Enter" && event.key !== " ") || !event.target.matches(".food-card")) return;
    event.preventDefault();
    const restaurant = restaurants.find(function (item) {
      return item.id === event.target.dataset.restaurantId;
    });
    if (restaurant) selectRestaurant(restaurant);
  });

  const logoutModal = document.getElementById("logoutModal");
  const logoutLink = document.getElementById("logoutLink");
  const confirmLogoutButton = document.getElementById("confirmLogout");
  const feedback = document.getElementById("feedback");
  let feedbackTimer;

  function openLogoutModal() {
    logoutModal.classList.remove("hidden");
    logoutModal.setAttribute("aria-hidden", "false");
    confirmLogoutButton.focus();
  }

  function closeLogoutModal() {
    logoutModal.classList.add("hidden");
    logoutModal.setAttribute("aria-hidden", "true");
    logoutLink.focus();
  }

  logoutLink.addEventListener("click", function (event) {
    event.preventDefault();
    openLogoutModal();
  });
  document.getElementById("cancelLogout").addEventListener("click", closeLogoutModal);
  logoutModal.addEventListener("click", function (event) {
    if (event.target === logoutModal) closeLogoutModal();
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !logoutModal.classList.contains("hidden")) {
      closeLogoutModal();
    }
  });
  confirmLogoutButton.addEventListener("click", function () {
    try {
      localStorage.removeItem("gamadiem_isLoggedIn");
    } catch (error) {
      console.error("Could not clear Gamadiem login status.", error);
      feedback.textContent = "Status login tidak dapat dihapus. Coba lagi.";
      feedback.classList.add("error", "visible");
      window.clearTimeout(feedbackTimer);
      feedbackTimer = window.setTimeout(function () {
        feedback.classList.remove("visible");
      }, 3200);
      return;
    }
    window.location.assign("index.html");
  });

  renderRestaurants();
}
