/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productSearch = document.getElementById("productSearch");
const languageToggle = document.getElementById("languageToggle");
const languageText = document.getElementById("languageText");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateRoutineBtn = document.getElementById("generateRoutine");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const userInput = document.getElementById("userInput");

/* Modal elements */
const descriptionModal = document.getElementById("descriptionModal");
const modalProductName = document.getElementById("modalProductName");
const modalBrandName = document.getElementById("modalBrandName");
const modalDescription = document.getElementById("modalDescription");
const closeModalBtn = document.getElementById("closeModal");

/* Global variables to store data and state */
let allProducts = [];
let selectedProducts = [];
let conversationHistory = [];
let currentRoutine = null;
let currentSearchTerm = "";
let currentCategoryFilter = "";
let isRTL = false;

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  if (allProducts.length === 0) {
    const response = await fetch("products.json");
    const data = await response.json();
    allProducts = data.products;
  }
  return allProducts;
}

/* Load selected products from localStorage on page load */
function loadSelectedProductsFromStorage() {
  const saved = localStorage.getItem("loreal-selected-products");
  if (saved) {
    selectedProducts = JSON.parse(saved);
    updateSelectedProductsDisplay();
  }
}

/* Save selected products to localStorage */
function saveSelectedProductsToStorage() {
  localStorage.setItem(
    "loreal-selected-products",
    JSON.stringify(selectedProducts)
  );
}

/* Toggle product selection */
function toggleProductSelection(productId) {
  const product = allProducts.find((p) => p.id === productId);
  if (!product) return;

  const existingIndex = selectedProducts.findIndex((p) => p.id === productId);

  if (existingIndex >= 0) {
    // Remove product from selection
    selectedProducts.splice(existingIndex, 1);
  } else {
    // Add product to selection
    selectedProducts.push(product);
  }

  saveSelectedProductsToStorage();
  updateSelectedProductsDisplay();
  updateProductCardSelection();
}

/* Remove product from selection */
function removeProductFromSelection(productId) {
  selectedProducts = selectedProducts.filter((p) => p.id !== productId);
  saveSelectedProductsToStorage();
  updateSelectedProductsDisplay();
  updateProductCardSelection();
}

/* Clear all selected products */
function clearAllProducts() {
  selectedProducts = [];
  saveSelectedProductsToStorage();
  updateSelectedProductsDisplay();
  updateProductCardSelection();
}

/* Update the visual state of product cards based on selection */
function updateProductCardSelection() {
  const productCards = document.querySelectorAll(".product-card");
  productCards.forEach((card) => {
    const productId = parseInt(card.dataset.productId);
    const isSelected = selectedProducts.some((p) => p.id === productId);

    if (isSelected) {
      card.classList.add("selected");
    } else {
      card.classList.remove("selected");
    }
  });
}

/* Update the selected products display area */
function updateSelectedProductsDisplay() {
  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `
      <div class="empty-selection-message">
        No products selected yet. Click on products above to add them to your routine.
      </div>
    `;
    // Remove pulse animation when no products selected
    generateRoutineBtn.classList.remove("pulse");
    return;
  }

  const productsHTML = selectedProducts
    .map(
      (product) => `
    <div class="selected-product-item">
      <span>${product.name} (${product.brand})</span>
      <button class="remove-btn" onclick="removeProductFromSelection(${product.id})" title="Remove product">
        <i class="fa-solid fa-times"></i>
      </button>
    </div>
  `
    )
    .join("");

  selectedProductsList.innerHTML = `
    ${productsHTML}
    <button class="clear-all-btn" onclick="clearAllProducts()">
      <i class="fa-solid fa-trash"></i> Clear All
    </button>
  `;

  // Add pulse animation when products are selected
  generateRoutineBtn.classList.add("pulse");
}

/* Show product description in modal */
function showDescriptionModal(productId) {
  const product = allProducts.find((p) => p.id === productId);
  if (!product) return;

  modalProductName.textContent = product.name;
  modalBrandName.textContent = product.brand;
  modalDescription.textContent = product.description;

  descriptionModal.classList.add("show");

  // Prevent body scroll when modal is open
  document.body.style.overflow = "hidden";
}

/* Close modal */
function closeDescriptionModal() {
  descriptionModal.classList.remove("show");

  // Restore body scroll
  document.body.style.overflow = "auto";
}

/* Modal event listeners */
closeModalBtn.addEventListener("click", closeDescriptionModal);

/* Close modal when clicking on overlay */
descriptionModal.addEventListener("click", (e) => {
  if (e.target === descriptionModal) {
    closeDescriptionModal();
  }
});

/* Close modal with escape key */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && descriptionModal.classList.contains("show")) {
    closeDescriptionModal();
  }
});

/* Create HTML for displaying product cards */
function displayProducts(products) {
  if (products.length === 0) {
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        No products found matching your criteria.
      </div>
    `;
    return;
  }

  productsContainer.innerHTML = products
    .map(
      (product) => `
      <div class="product-card" data-product-id="${product.id}" onclick="toggleProductSelection(${product.id})">
        <div class="selected-indicator">
          <i class="fa-solid fa-check"></i>
        </div>
        <img src="${product.image}" alt="${product.name}" class="product-image">
        <div class="product-info">
          <h3 class="product-name">${product.name}</h3>
          <p class="product-brand">${product.brand}</p>
          <button class="description-toggle" onclick="event.stopPropagation(); showDescriptionModal(${product.id})">
            View Details
          </button>
        </div>
      </div>
    `
    )
    .join("");

  // Update selection state for newly displayed products
  updateProductCardSelection();
}

/* Filter products based on category and search term */
function filterProducts() {
  let filteredProducts = allProducts;

  // Apply category filter
  if (currentCategoryFilter) {
    const categoryArray = currentCategoryFilter.split(",");
    filteredProducts = filteredProducts.filter((product) =>
      categoryArray.includes(product.category)
    );
  }

  // Apply search filter
  if (currentSearchTerm) {
    const searchLower = currentSearchTerm.toLowerCase();
    filteredProducts = filteredProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(searchLower) ||
        product.brand.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower)
    );
  }

  displayProducts(filteredProducts);
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  await loadProducts();
  currentCategoryFilter = e.target.value;
  filterProducts();
});

/* Filter products as user types in search */
productSearch.addEventListener("input", async (e) => {
  await loadProducts();
  currentSearchTerm = e.target.value;
  filterProducts();
});

/* RTL Language Toggle */
function toggleRTL() {
  isRTL = !isRTL;
  const html = document.documentElement;

  if (isRTL) {
    html.setAttribute("dir", "rtl");
    html.setAttribute("lang", "ar");
    languageText.textContent = "English";
    document.title = "لوريال | مُنشئ الروتين الذكي ومستشار المنتجات";
  } else {
    html.setAttribute("dir", "ltr");
    html.setAttribute("lang", "en");
    languageText.textContent = "عربي";
    document.title = "L'Oréal | Smart Routine & Product Advisor";
  }

  // Save RTL preference
  localStorage.setItem("loreal-rtl-mode", isRTL);
}

/* Load RTL preference */
function loadRTLPreference() {
  const savedRTL = localStorage.getItem("loreal-rtl-mode");
  if (savedRTL === "true") {
    toggleRTL();
  }
}

/* Language toggle event listener */
languageToggle.addEventListener("click", toggleRTL);

/* Generate routine using OpenAI API with web search capability */
async function generateRoutine() {
  if (selectedProducts.length === 0) {
    addMessageToChat(
      "assistant",
      "Please select some products first to generate a routine!"
    );
    return;
  }

  // Show loading message
  addMessageToChat(
    "assistant",
    "Generating your personalized routine with current L'Oréal insights... ✨"
  );

  try {
    // Prepare the product data for the API
    const productInfo = selectedProducts.map((product) => ({
      name: product.name,
      brand: product.brand,
      category: product.category,
      description: product.description,
    }));

    // Create the prompt for OpenAI with web search capability
    const systemPrompt = `You are a beauty and skincare expert with access to current information. Create a personalized routine using the provided products. Include the order of use, application tips, and timing (morning/evening). Also search for any recent L'Oréal product updates, reviews, or application techniques. Include current information and cite any sources you find.`;

    const userPrompt = `Create a personalized beauty routine using these products: ${JSON.stringify(
      productInfo
    )}. Please also search for any current information about these specific products, application techniques, or recent reviews that might help optimize the routine.`;

    // Make API call to OpenAI via Cloudflare Worker with web search
    const response = await fetch(
      "https://crimson-feather-5898.horseykate1129.workers.dev/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
          max_tokens: 1200,
          temperature: 0.7,
          tools: [
            {
              type: "function",
              function: {
                name: "web_search",
                description:
                  "Search the web for current information about L'Oréal products, beauty routines, or skincare techniques",
                parameters: {
                  type: "object",
                  properties: {
                    query: {
                      type: "string",
                      description: "The search query",
                    },
                  },
                  required: ["query"],
                },
              },
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const routine = data.choices[0].message.content;

    // Store the routine for follow-up questions
    currentRoutine = routine;

    // Clear the loading message and add the routine
    chatWindow.innerHTML = "";
    addMessageToChat("assistant", routine);

    // Add this to conversation history
    conversationHistory.push({
      role: "system",
      content: `Generated routine for products: ${selectedProducts
        .map((p) => p.name)
        .join(", ")}`,
    });
    conversationHistory.push({
      role: "assistant",
      content: routine,
    });
  } catch (error) {
    console.error("Error generating routine:", error);
    chatWindow.innerHTML = "";
    addMessageToChat(
      "assistant",
      "Sorry, I couldn't generate a routine right now. Please check your connection and try again."
    );
  }
}

/* Add message to chat window */
function addMessageToChat(role, content) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `chat-message ${role}`;

  const icon = role === "user" ? "fa-user" : "fa-robot";
  messageDiv.innerHTML = `
    <div class="message-header">
      <i class="fa-solid ${icon}"></i>
      <span>${role === "user" ? "You" : "L'Oréal Assistant"}</span>
    </div>
    <div class="message-content">${content.replace(/\n/g, "<br>")}</div>
  `;

  chatWindow.appendChild(messageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Handle follow-up chat questions with web search */
async function handleChatMessage(message) {
  // Add user message to chat
  addMessageToChat("user", message);

  // Add user message to conversation history
  conversationHistory.push({
    role: "user",
    content: message,
  });

  try {
    // Create context-aware prompt with web search capability
    let systemPrompt = `You are a beauty and skincare expert assistant with access to current web information. Answer questions about beauty routines, skincare, haircare, makeup, fragrance, and related topics. Search for current information when relevant, especially for L'Oréal products. Keep responses helpful and concise. Include citations for any current information you find.`;

    if (currentRoutine) {
      systemPrompt += ` The user has generated a routine with these products: ${selectedProducts
        .map((p) => p.name)
        .join(
          ", "
        )}. You can reference this routine and these products in your answers.`;
    }

    // Prepare messages for API (include conversation history)
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-6), // Keep last 6 messages for context
      { role: "user", content: message },
    ];

    // Make API call via Cloudflare Worker with web search
    const response = await fetch(
      "https://crimson-feather-5898.horseykate1129.workers.dev/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: messages,
          max_tokens: 600,
          temperature: 0.7,
          tools: [
            {
              type: "function",
              function: {
                name: "web_search",
                description: "Search the web for current information",
                parameters: {
                  type: "object",
                  properties: {
                    query: {
                      type: "string",
                      description: "The search query",
                    },
                  },
                  required: ["query"],
                },
              },
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    // Add assistant response to chat
    addMessageToChat("assistant", assistantMessage);

    // Add to conversation history
    conversationHistory.push({
      role: "assistant",
      content: assistantMessage,
    });
  } catch (error) {
    console.error("Error in chat:", error);
    addMessageToChat(
      "assistant",
      "Sorry, I'm having trouble responding right now. Please check your connection and try again."
    );
  }
}

/* Chat form submission handler */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const message = userInput.value.trim();
  if (!message) return;

  // Clear input
  userInput.value = "";

  // Handle the message
  handleChatMessage(message);
});

/* Generate routine button handler */
generateRoutineBtn.addEventListener("click", generateRoutine);

/* Initialize the app */
document.addEventListener("DOMContentLoaded", () => {
  loadSelectedProductsFromStorage();
  loadRTLPreference();

  // Add initial welcome message
  addMessageToChat(
    "assistant",
    "Hi! I'm your L'Oréal beauty assistant with access to current beauty trends and product information. Select some products above and click 'Generate Routine' to get started, or ask me any beauty-related questions!"
  );
});
