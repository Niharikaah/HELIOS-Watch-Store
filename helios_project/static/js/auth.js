async function demoSignup() {
    const name = document.getElementById("signup-name").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const phone = document.getElementById("signup-phone").value.trim();
    const password = document.getElementById("signup-password").value;
    const role = document.getElementById("signup-role").value;
    const msg = document.getElementById("signup-message");

    if (!name || !email || !password) {
        msg.textContent = "Please fill all required fields.";
        return;
    }

    msg.textContent = "Creating account...";

    try {
        const response = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, phone, password, role })
        });

        const data = await response.json();

        if (!response.ok) {
            msg.textContent = data.error || "Could not create account.";
            return;
        }

        localStorage.setItem("heliosCurrentUser", JSON.stringify(data.user));
        msg.textContent = "Account created successfully! You are now logged in";

        document.getElementById("signup-name").value = "";
        document.getElementById("signup-email").value = "";
        document.getElementById("signup-phone").value = "";
        document.getElementById("signup-password").value = "";

    } catch (error) {
        console.error(error);
        msg.textContent = "Server error. Make sure Flask is running.";
    }
}

async function demoLogin() {
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const msg = document.getElementById("login-message");

    if (!email || !password) {
        msg.textContent = "Please enter email and password.";
        return;
    }

    msg.textContent = "Logging in...";

    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            msg.textContent = data.error || "Invalid email or password.";
            return;
        }

        localStorage.setItem("heliosCurrentUser", JSON.stringify(data.user));
        await syncCartFromServer();
        msg.textContent = `Welcome, ${data.user.name}!`;

    } catch (error) {
        console.error(error);
        msg.textContent = "Server error. Make sure Flask is running.";
    }
}
