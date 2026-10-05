function money(value) {
    return "₹" + Number(value).toLocaleString("en-IN");
}

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem("heliosCurrentUser") || "null");
    } catch (e) {
        return null;
    }
}

function getCurrentUserId() {
    const user = getCurrentUser();
    return user ? Number(user.id ?? user.user_id) : null;
}

function getCart() {
    return JSON.parse(localStorage.getItem("heliosCart") || "[]");
}

function saveCart(cart) {
    localStorage.setItem("heliosCart", JSON.stringify(cart));
    updateCartCount();
}

function getFavourites() {
    return JSON.parse(localStorage.getItem("heliosFavourites") || "[]");
}

function saveFavourites(items) {
    localStorage.setItem("heliosFavourites", JSON.stringify(items));
}

async function syncCartFromServer(showError = false) {
    const userId = getCurrentUserId();
    if (!userId) {
        saveCart([]);
        return [];
    }

    try {
        const response = await fetch(`/api/cart?user_id=${userId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load cart");

        const cart = data.items.map(item => ({
            id: Number(item.id),
            quantity: Number(item.quantity)
        }));
        localStorage.setItem("heliosCart", JSON.stringify(cart));
        updateCartCount(data.count);
        return cart;
    } catch (error) {
        console.error(error);
        if (showError) showToast("Could not load cart");
        return getCart();
    }
}

function updateCartCount(count = null) {
    if (count === null) {
        count = getCart().reduce((sum, item) => sum + item.quantity, 0);
    }
    const el = document.getElementById("cart-count");
    if (el) el.textContent = count;
}

async function addToCart(id) {
    const userId = getCurrentUserId();

    if (!userId) {
        showToast("Please login first");
        setTimeout(() => { window.location.href = "/login"; }, 700);
        return;
    }

    try {
        const response = await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: userId,
                product_id: id,
                quantity: 1
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not add to cart");

        await syncCartFromServer();
        showToast("Added to cart");
    } catch (error) {
        console.error(error);
        showToast(error.message);
    }
}

function toggleFavourite(id) {
    let favourites = getFavourites();
    if (favourites.includes(id)) favourites = favourites.filter(x => x !== id);
    else favourites.push(id);
    saveFavourites(favourites);
    if (typeof renderProducts === "function") renderProducts();
    if (typeof renderFavourites === "function") renderFavourites();
}

function showToast(message) {
    let toast = document.getElementById("helios-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "helios-toast";
        document.body.appendChild(toast);
    }
    toast.textContent = "✓  " + message;
    toast.classList.add("show");
    clearTimeout(window.heliosToastTimer);
    window.heliosToastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function productCard(product) {
    const fav = getFavourites().includes(product.id);
    const rating = product.rating || 4.8;
    const reviews = product.reviews || 60;
    return `
        <article class="product-card premium-product-card">
            <button class="fav-btn ${fav ? "active" : ""}" onclick="toggleFavourite(${product.id})" aria-label="Favourite">♡</button>
            <a href="/product/${product.id}" class="product-image"><img src="/static/${product.image}" alt="${product.name}"></a>
            <div class="product-info">
                <p class="brand">${product.brand}</p>
                <h3><a href="/product/${product.id}">${product.name}</a></h3>
                <div class="rating"><span>★★★★★</span> <small>(${reviews})</small></div>
                <div class="product-bottom">
                    <strong>${money(product.price)}</strong>
                    <button class="small-btn" onclick="addToCart(${product.id})">🛒 Add to Cart</button>
                </div>
            </div>
        </article>`;
}

document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();
    syncCartFromServer();

    const search = document.getElementById("global-search");
    if (search) search.addEventListener("keydown", e => {
        if (e.key === "Enter" && search.value.trim()) {
            window.location.href = "/products?search=" + encodeURIComponent(search.value.trim());
        }
    });
});
