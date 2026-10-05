async function renderCart() {
    const container = document.getElementById("cart-items");
    const totalElement = document.getElementById("cart-total");
    const userId = getCurrentUserId();

    if (!userId) {
        container.innerHTML = `
            <div class="empty">
                <h2>Please login to view your cart</h2>
                <p>Your cart is saved to your HELIOS account.</p>
                <a class="btn" href="/login">Login</a>
            </div>`;
        totalElement.textContent = "₹0";
        updateCartCount(0);
        return;
    }

    try {
        const response = await fetch(`/api/cart?user_id=${userId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load cart");

        updateCartCount(data.count);

        if (!data.items.length) {
            container.innerHTML = `<div class="empty"><h2>Your cart is empty</h2><p>Add a watch to get started.</p><a class="btn" href="/products">Browse Watches</a></div>`;
            totalElement.textContent = "₹0";
            return;
        }

        container.innerHTML = data.items.map(item => `
            <div class="cart-item">
                <div class="cart-thumb">
                    <img src="/static/${item.image}" alt="${item.name}">
                </div>
                <div class="cart-main">
                    <p class="brand">${item.brand}</p>
                    <h3>${item.name}</h3>
                    <p>${money(item.price)}</p>
                    <div class="quantity">
                        <button onclick="changeQuantity(${item.id}, -1)">−</button>
                        <span>${item.quantity}</span>
                        <button onclick="changeQuantity(${item.id}, 1)">+</button>
                        <button class="remove" onclick="removeFromCart(${item.id})">Remove</button>
                    </div>
                </div>
            </div>
        `).join("");

        totalElement.textContent = money(data.total);

    } catch (error) {
        console.error(error);
        container.innerHTML = `<div class="empty"><h2>Could not load cart</h2><p>${error.message}</p></div>`;
    }
}

async function changeQuantity(id, change) {
    const userId = getCurrentUserId();
    if (!userId) return;

    try {
        const cartResponse = await fetch(`/api/cart?user_id=${userId}`);
        const cartData = await cartResponse.json();
        const item = cartData.items.find(x => Number(x.id) === Number(id));
        if (!item) return;

        const newQuantity = Number(item.quantity) + change;

        if (newQuantity <= 0) {
            await removeFromCart(id);
            return;
        }

        const response = await fetch(`/api/cart/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, quantity: newQuantity })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not update cart");

        await syncCartFromServer();
        await renderCart();
    } catch (error) {
        console.error(error);
        showToast(error.message);
    }
}

async function removeFromCart(id) {
    const userId = getCurrentUserId();
    if (!userId) return;

    try {
        const response = await fetch(`/api/cart/${id}?user_id=${userId}`, {
            method: "DELETE"
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not remove item");

        await syncCartFromServer();
        await renderCart();
        showToast("Removed from cart");
    } catch (error) {
        console.error(error);
        showToast(error.message);
    }
}

renderCart();
