async function renderOrders() {
    const container = document.getElementById("orders-list");
    const userId = getCurrentUserId();

    if (!userId) {
        container.innerHTML = `
            <div class="empty">
                <h2>Please login to view your orders</h2>
                <a class="btn" href="/login">Login</a>
            </div>`;
        return;
    }

    try {
        const response = await fetch(`/api/orders?user_id=${userId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load orders.");

        if (!data.orders.length) {
            container.innerHTML = `
                <div class="empty">
                    <h2>No orders yet</h2>
                    <p>Your completed orders will appear here.</p>
                    <a class="btn" href="/products">Shop Watches</a>
                </div>`;
            return;
        }

        container.innerHTML = data.orders.map(order => `
            <div class="order-card">
                <div>
                    <p class="brand">ORDER #${order.order_id}</p>
                    <h3>${new Date(order.order_date).toLocaleString()}</h3>
                    <p>${order.item_count} item(s) • ${order.payment_method || "Payment"}</p>
                    <p>Payment: ${order.payment_status || "Pending"}</p>
                </div>
                <div class="order-right">
                    <strong>${money(order.total_amount)}</strong>
                    <span class="status">${order.order_status}</span>
                </div>
            </div>
        `).join("");

    } catch (error) {
        console.error(error);
        container.innerHTML = `<div class="empty"><h2>Could not load orders</h2><p>${error.message}</p></div>`;
    }
}

renderOrders();
