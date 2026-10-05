async function placeDemoOrder() {
    const message = document.getElementById("checkout-message");
    const userId = getCurrentUserId();

    if (!userId) {
        message.textContent = "Please login before checkout.";
        return;
    }

    const address = document.getElementById("address").value.trim();
    const city = document.getElementById("city").value.trim();
    const state = document.getElementById("state").value.trim();
    const pincode = document.getElementById("pincode").value.trim();
    const paymentMethod = document.getElementById("payment-method").value;

    if (!address || !city || !state || !pincode) {
        message.textContent = "Please fill in the delivery address.";
        return;
    }

    message.textContent = "Placing your order...";

    try {
        const response = await fetch("/api/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: userId,
                address,
                city,
                state,
                pincode,
                payment_method: paymentMethod
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Could not place order.");
        }

        localStorage.removeItem("heliosCart");
        updateCartCount(0);

        message.innerHTML = `Order placed successfully! Order ID: <strong>#${data.order.order_id}</strong>.`;

        document.getElementById("address").value = "";
        document.getElementById("city").value = "";
        document.getElementById("state").value = "";
        document.getElementById("pincode").value = "";

    } catch (error) {
        console.error(error);
        message.textContent = error.message;
    }
}
