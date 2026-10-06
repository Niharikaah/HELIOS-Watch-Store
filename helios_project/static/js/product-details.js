async function renderProductDetails() {
    const container = document.getElementById("product-details");
    const productId = Number(window.selectedProductId);

    try {
        const response = await fetch(`/api/product/${productId}`);
        const product = await response.json();

        if (!response.ok) {
            throw new Error(product.error || "Product not found");
        }

        container.innerHTML = `
            <div class="detail-image">
                <img src="/static/${product.image}" alt="${product.name}">
            </div>

            <div class="detail-info">
                <p class="eyebrow">${product.brand}</p>
                <h1>${product.name}</h1>
                <p class="detail-price">${money(product.price)}</p>
                <p>${product.description}</p>

                <p><strong>Seller:</strong> ${product.seller}</p>
                <p><strong>Stock:</strong> ${product.stock}</p>

                <div class="spec-grid">
                    <div><span>Categories</span><b>${product.categories.join(", ")}</b></div>
                    <div><span>Strap</span><b>${product.strap_material}</b></div>
                    <div><span>Dial</span><b>${product.dial_colour}</b></div>
                    <div><span>Case</span><b>${product.case_material}</b></div>
                    <div><span>Movement</span><b>${product.movement_type}</b></div>
                    <div><span>Water Resistance</span><b>${product.water_resistance}</b></div>
                    <div><span>Warranty</span><b>${product.warranty}</b></div>
                    <div><span>Gender</span><b>${product.gender}</b></div>
                    <div><span>Display</span><b>${product.display_type}</b></div>
                </div>

                <div class="detail-actions">
                    <button class="btn" onclick="addToCart(${product.id})">
                        Add to Cart
                    </button>

                    <button class="outline-btn" onclick="toggleFavourite(${product.id})">
                        ♡ Favourite
                    </button>
                </div>
            </div>
        `;
    } catch (error) {
        console.error(error);

        container.innerHTML = `
            <div class="empty">
                <h2>Product not found</h2>
                <p>We couldn't load this watch.</p>
            </div>
        `;
    }
}

document.addEventListener("DOMContentLoaded", renderProductDetails);