function renderProductDetails() {
    const product = products.find(p => p.id === Number(window.selectedProductId));
    const container = document.getElementById("product-details");

    if (!product) {
        container.innerHTML = "<div class='empty'><h2>Product not found</h2></div>";
        return;
    }

    container.innerHTML = `
        <div class="detail-image"><img src="/static/${product.image}" alt="${product.name}"></div>
        <div class="detail-info">
            <p class="eyebrow">${product.brand}</p>
            <h1>${product.name}</h1>
            <p class="detail-price">${money(product.price)}</p>
            <p>${product.description}</p>
            <p><strong>Seller:</strong> ${product.seller}</p>
            <p><strong>Stock:</strong> ${product.stock}</p>
            <div class="spec-grid">
                <div><span>Categories</span><b>${product.categories.join(", ")}</b></div>
                <div><span>Strap</span><b>${product.strapMaterial}</b></div>
                <div><span>Dial</span><b>${product.dialColour}</b></div>
                <div><span>Case</span><b>${product.caseMaterial}</b></div>
                <div><span>Movement</span><b>${product.movementType}</b></div>
                <div><span>Water Resistance</span><b>${product.waterResistance}</b></div>
                <div><span>Warranty</span><b>${product.warranty}</b></div>
                <div><span>Gender</span><b>${product.gender}</b></div>
                <div><span>Display</span><b>${product.displayType}</b></div>
            </div>
            <div class="detail-actions">
                <button class="btn" onclick="addToCart(${product.id})">Add to Cart</button>
                <button class="outline-btn" onclick="toggleFavourite(${product.id})">♡ Favourite</button>
            </div>
        </div>
    `;
}

window.addEventListener("heliosProductsReady", renderProductDetails);
