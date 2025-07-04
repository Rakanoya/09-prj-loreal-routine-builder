/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productSearch = document.getElementById("productSearch");
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

/* RTL Language Toggle with enhanced language support */
function toggleRTL() {
  isRTL = !isRTL;
  const html = document.documentElement;

  if (isRTL) {
    html.setAttribute("dir", "rtl");
    html.setAttribute("lang", "ar");
    document.title = "لوريال | مُنشئ الروتين الذكي ومستشار المنتجات";

    // Update placeholder texts and interface elements for Arabic
    updateInterfaceLanguage("ar");
  } else {
    html.setAttribute("dir", "ltr");
    html.setAttribute("lang", "en");
    document.title = "L'Oréal | Smart Routine & Product Advisor";

    // Update placeholder texts and interface elements for English
    updateInterfaceLanguage("en");
  }

  // Save RTL preference
  localStorage.setItem("loreal-rtl-mode", isRTL);
}

/* Update interface language text */
function updateInterfaceLanguage(language) {
  const productSearchInput = document.getElementById("productSearch");
  const categorySelect = document.getElementById("categoryFilter");
  const userInputField = document.getElementById("userInput");

  if (language === "ar") {
    // Arabic interface
    if (productSearchInput) {
      productSearchInput.placeholder = "ابحث عن المنتجات...";
    }
    if (userInputField) {
      userInputField.placeholder = "اكتب رسالتك هنا...";
    }
    // Update category options for Arabic
    updateCategoryOptions("ar");
  } else {
    // English interface
    if (productSearchInput) {
      productSearchInput.placeholder = "Search products...";
    }
    if (userInputField) {
      userInputField.placeholder = "Type your message here...";
    }
    // Update category options for English
    updateCategoryOptions("en");
  }
}

/* Update category dropdown options based on language */
function updateCategoryOptions(language) {
  const categorySelect = document.getElementById("categoryFilter");
  if (!categorySelect) return;

  if (language === "ar") {
    categorySelect.innerHTML = `
      <option value="" disabled selected>اختر فئة</option>
      <option value="cleanser">منظفات</option>
      <option value="moisturizer,skincare">مرطبات وعلاجات</option>
      <option value="haircare">العناية بالشعر</option>
      <option value="makeup">المكياج</option>
      <option value="hair color">صبغة الشعر</option>
      <option value="hair styling">تصفيف الشعر</option>
      <option value="men's grooming">العناية الرجالية</option>
      <option value="suncare">الحماية من الشمس</option>
      <option value="fragrance">العطور</option>
    `;
  } else {
    categorySelect.innerHTML = `
      <option value="" disabled selected>Choose a Category</option>
      <option value="cleanser">Cleansers</option>
      <option value="moisturizer,skincare">Moisturizers & Treatments</option>
      <option value="haircare">Haircare</option>
      <option value="makeup">Makeup</option>
      <option value="hair color">Hair Color</option>
      <option value="hair styling">Hair Styling</option>
      <option value="men's grooming">Men's Grooming</option>
      <option value="suncare">Suncare</option>
      <option value="fragrance">Fragrance</option>
    `;
  }
}

/* Detect browser language and auto-set RTL for Arabic speakers */
function detectAndSetLanguage() {
  const savedRTL = localStorage.getItem("loreal-rtl-mode");

  // If user has previously set a preference, use that
  if (savedRTL !== null) {
    if (savedRTL === "true") {
      toggleRTL();
    }
    return;
  }

  // Auto-detect browser language for first-time visitors
  const userLanguages = navigator.languages || [
    navigator.language || navigator.userLanguage,
  ];
  const isArabicSpeaker = userLanguages.some((lang) => {
    const langCode = lang.toLowerCase();
    return (
      langCode.startsWith("ar") || // Arabic
      langCode.startsWith("he") || // Hebrew
      langCode.startsWith("fa") || // Persian/Farsi
      langCode.startsWith("ur") || // Urdu
      langCode.startsWith("ku") || // Kurdish
      langCode.startsWith("ps") || // Pashto
      langCode.startsWith("sd") || // Sindhi
      langCode.startsWith("ug") // Uyghur
    );
  });

  if (isArabicSpeaker) {
    toggleRTL();
    console.log("Auto-detected RTL language preference");

    // Show a subtle notification that language was auto-detected
    setTimeout(() => {
      addMessageToChat(
        "assistant",
        "تم اكتشاف اللغة العربية تلقائياً. يمكنك تغيير اللغة باستخدام الزر أعلى اليمين. | Arabic language auto-detected. You can change language using the button in the top right."
      );
    }, 1000);
  }
}

/* Load RTL preference (keeping old function name for compatibility) */
function loadRTLPreference() {
  detectAndSetLanguage();
}

/* Generate routine using OpenAI API with web search capability */
async function generateRoutine() {
  if (selectedProducts.length === 0) {
    const message = isRTL
      ? "يرجى اختيار بعض المنتجات أولاً لإنشاء روتين!"
      : "Please select some products first to generate a routine!";
    addMessageToChat("assistant", message);
    return;
  }

  // Show loading indicator
  const loadingMessage = isRTL
    ? "جاري إنشاء روتينك الشخصي مع أحدث رؤى لوريال... ✨"
    : "Generating your personalized routine with current L'Oréal insights... ✨";
  showAILoading(loadingMessage);

  try {
    // Prepare the product data for the API
    const productInfo = selectedProducts.map((product) => ({
      name: product.name,
      brand: product.brand,
      category: product.category,
      description: product.description,
    }));

    // Create the prompt for OpenAI with web search capability
    const systemPrompt = isRTL
      ? `أنت خبير جمال وعناية بالبشرة مع إمكانية الوصول إلى المعلومات الحالية. قم بإنشاء روتين شخصي باستخدام المنتجات المقدمة. قم بتضمين ترتيب الاستخدام ونصائح التطبيق والتوقيت (صباحي/مسائي). ابحث أيضاً عن أي تحديثات منتجات لوريال الحديثة أو المراجعات أو تقنيات التطبيق. قم بتضمين المعلومات الحالية واذكر أي مصادر تجدها. يرجى الرد باللغة العربية.`
      : `You are a beauty and skincare expert with access to current information. Create a personalized routine using the provided products. Include the order of use, application tips, and timing (morning/evening). Also search for any recent L'Oréal product updates, reviews, or application techniques. Include current information and cite any sources you find.`;

    const userPrompt = isRTL
      ? `قم بإنشاء روتين جمال شخصي باستخدام هذه المنتجات: ${JSON.stringify(
          productInfo
        )}. يرجى أيضاً البحث عن أي معلومات حالية حول هذه المنتجات المحددة أو تقنيات التطبيق أو المراجعات الحديثة التي قد تساعد في تحسين الروتين. يرجى الرد باللغة العربية.`
      : `Create a personalized beauty routine using these products: ${JSON.stringify(
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

    // Hide loading indicator and add the routine
    hideAILoading();
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
    hideAILoading();
    const errorMessage = isRTL
      ? "عذراً، لا يمكنني إنشاء روتين الآن. يرجى التحقق من اتصالك والمحاولة مرة أخرى."
      : "Sorry, I couldn't generate a routine right now. Please check your connection and try again.";
    addMessageToChat("assistant", errorMessage);
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

/* Show AI loading indicator */
function showAILoading(message = "L'Oréal Assistant is thinking...") {
  const loadingDiv = document.createElement("div");
  loadingDiv.className = "ai-loading";
  loadingDiv.id = "ai-loading-indicator";

  loadingDiv.innerHTML = `
    <i class="fa-solid fa-robot"></i>
    <span class="ai-loading-text">${message}</span>
    <div class="loading-dots">
      <div class="loading-dot"></div>
      <div class="loading-dot"></div>
      <div class="loading-dot"></div>
    </div>
  `;

  chatWindow.appendChild(loadingDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Hide AI loading indicator */
function hideAILoading() {
  const loadingIndicator = document.getElementById("ai-loading-indicator");
  if (loadingIndicator) {
    loadingIndicator.remove();
  }
}

async function handleChatMessage(message) {
  // Add user message to chat
  addMessageToChat("user", message);

  // Show loading indicator
  showAILoading(
    isRTL ? "مساعد لوريال يفكر..." : "L'Oréal Assistant is thinking..."
  );

  // Add user message to conversation history
  conversationHistory.push({
    role: "user",
    content: message,
  });

  // Detect obvious off-topic questions
  const offTopicKeywords = [
    "weather", "news", "politics", "sports", "movie", "music", "stocks",
    "celebrity", "car", "gpt", "openai", "ai model", "game", "travel", "flight"
  ];

  const isOffTopic = offTopicKeywords.some((word) =>
    message.toLowerCase().includes(word)
  );

  if (isOffTopic) {
    hideAILoading();
    const redirectMessage = isRTL
      ? "أنا هنا لمساعدتك في الأسئلة المتعلقة بالجمال ومنتجات لوريال فقط. هل ترغب في مناقشة روتينك أو أي منتج محدد؟"
      : "I'm here to help with beauty-related questions and L'Oréal products only. Would you like to discuss your routine or a specific product?";
    addMessageToChat("assistant", redirectMessage);
    return;
  }

  try {
    // Build context-aware system prompt
    let systemPrompt = `You are a L'Oréal beauty assistant. 
Only answer questions related to beauty routines, skincare, haircare, makeup, fragrance, or the selected L'Oréal products. 
If the question is off-topic, remind the user to stay focused. 
Keep answers concise, relevant, and grounded in product use. Include citations if using current sources.`;

    if (currentRoutine) {
      systemPrompt += ` The user has generated a routine using the following products: ${selectedProducts
        .map((p) => `${p.name} (${p.brand})`)
        .join(", ")}. Focus your responses around these products and the routine.`;
    }

    // Build contextual messages with product reminder
    const memory = conversationHistory.slice(-10).filter(msg => msg.role !== "system");

    const memorySummary = memory.map((msg, index) => {
      const speaker = msg.role === "user" ? "User" : "Assistant";
      return `${speaker}: ${msg.content}`;
    }).join("\n");

    const contextReminder = {
      role: "system",
      content: `Ongoing conversation context:\n${memorySummary}`,
    };

    const messages = [
      { role: "system", content: systemPrompt },
      contextReminder,
      { role: "user", content: message },
    ];

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

    // Display assistant response
    hideAILoading();
    addMessageToChat("assistant", assistantMessage);

    // Add to conversation history
    conversationHistory.push({
      role: "assistant",
      content: assistantMessage,
    });
  } catch (error) {
    console.error("Error in chat:", error);
    hideAILoading();
    const errorMessage = isRTL
      ? "عذراً، أواجه مشكلة في الاستجابة الآن. يرجى التحقق من اتصالك والمحاولة مرة أخرى."
      : "Sorry, I'm having trouble responding right now. Please check your connection and try again.";
    addMessageToChat("assistant", errorMessage);
  }
}

/* Chat form submission handler */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const message = userInput.value.trim();
  if (!message) return;

  userInput.value = "";
  handleChatMessage(message);
});

/* Generate routine button handler */
generateRoutineBtn.addEventListener("click", generateRoutine);

/* Initialize the app */
document.addEventListener("DOMContentLoaded", () => {
  loadSelectedProductsFromStorage();
  loadRTLPreference();
  updateInterfaceLanguage(isRTL ? "ar" : "en");

  const welcomeMessage = isRTL
    ? "مرحباً! أنا مساعد الجمال من لوريال مع إمكانية الوصول إلى أحدث اتجاهات الجمال ومعلومات المنتجات. اختر بعض المنتجات أعلاه واضغط على 'إنشاء روتين' للبدء، أو اسألني أي أسئلة متعلقة بالجمال!"
    : "Hi! I'm your L'Oréal beauty assistant with access to current beauty trends and product information. Select some products above and click 'Generate Routine' to get started, or ask me any beauty-related questions!";

  addMessageToChat("assistant", welcomeMessage);
});
