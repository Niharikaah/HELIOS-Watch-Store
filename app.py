from flask import Flask, render_template, jsonify, request
import os
import psycopg
from psycopg.rows import dict_row
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "helios-dev-key")

DB_CONFIG = {
    "host": os.environ.get("HELIOS_DB_HOST", "localhost"),
    "port": os.environ.get("HELIOS_DB_PORT", "5432"),
    "dbname": os.environ.get("HELIOS_DB_NAME", "helios_db"),
    "user": os.environ.get("HELIOS_DB_USER", "postgres"),
    "password": os.environ.get("HELIOS_DB_PASSWORD", ""),
}


def get_connection():
    return psycopg.connect(**DB_CONFIG, row_factory=dict_row)


def get_products_from_db():
    query = """
        SELECT
            p.product_id AS id,
            p.product_name AS name,
            b.brand_name AS brand,
            s.name AS seller,
            p.price,
            p.stock,
            p.image,
            p.description,
            p.strap_material,
            p.dial_colour,
            p.case_material,
            p.movement_type,
            p.water_resistance,
            p.warranty,
            p.gender,
            p.display_type,
            COALESCE(
                ARRAY_AGG(c.category_name ORDER BY c.category_id)
                FILTER (WHERE c.category_name IS NOT NULL),
                ARRAY[]::varchar[]
            ) AS categories
        FROM products p
        JOIN brands b ON b.brand_id = p.brand_id
        JOIN users s ON s.user_id = p.seller_id
        LEFT JOIN product_categories pc ON pc.product_id = p.product_id
        LEFT JOIN categories c ON c.category_id = pc.category_id
        GROUP BY p.product_id, b.brand_name, s.name
        ORDER BY p.product_id;
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            return cur.fetchall()


def clean_product(row):
    return dict(row)


# -------------------- Pages --------------------
@app.route("/")
def home():
    return render_template("index.html")


@app.route("/products")
def products():
    return render_template("products.html")


@app.route("/product/<int:product_id>")
def product_details(product_id):
    return render_template("product-details.html", product_id=product_id)


@app.route("/cart")
def cart():
    return render_template("cart.html")


@app.route("/favourites")
def favourites():
    return render_template("favourites.html")


@app.route("/checkout")
def checkout():
    return render_template("checkout.html")


@app.route("/orders")
def orders():
    return render_template("orders.html")


@app.route("/login")
def login():
    return render_template("login.html")


@app.route("/signup")
def signup():
    return render_template("signup.html")


# -------------------- Product API --------------------
@app.route("/api/products")
def api_products():
    try:
        return jsonify([clean_product(p) for p in get_products_from_db()])
    except Exception as exc:
        app.logger.exception("Database error while loading products")
        return jsonify({"error": "Database connection failed", "details": str(exc)}), 500


@app.route("/api/product/<int:product_id>")
def api_product(product_id):
    try:
        products = get_products_from_db()
        product = next((p for p in products if p["id"] == product_id), None)
        if not product:
            return jsonify({"error": "Product not found"}), 404
        return jsonify(clean_product(product))
    except Exception as exc:
        app.logger.exception("Database error while loading product")
        return jsonify({"error": "Database connection failed", "details": str(exc)}), 500


# -------------------- Authentication API --------------------
@app.route("/api/auth/signup", methods=["POST"])
def api_signup():
    try:
        data = request.get_json() or {}
        name = data.get("name", "").strip()
        email = data.get("email", "").strip().lower()
        phone = data.get("phone", "").strip()
        password = data.get("password", "")
        role = data.get("role", "CUSTOMER").upper()

        if not name or not email or not password:
            return jsonify({"error": "Please fill all required fields."}), 400

        if role not in ("CUSTOMER", "SELLER"):
            role = "CUSTOMER"

        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT user_id FROM users WHERE email = %s", (email,))
                if cur.fetchone():
                    return jsonify({"error": "An account with this email already exists."}), 409

                cur.execute(
                    """
                    INSERT INTO users (name, email, password, phone, role)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING user_id, name, email, phone, role
                    """,
                    (name, email, generate_password_hash(password), phone, role),
                )
                user = cur.fetchone()
            conn.commit()

        return jsonify({
            "message": "Account created successfully! You are now logged in",
            "user": {
                "id": user["user_id"],
                "name": user["name"],
                "email": user["email"],
                "phone": user["phone"],
                "role": user["role"],
            },
        }), 201

    except Exception as exc:
        app.logger.exception("Signup database error")
        return jsonify({"error": "Could not create account.", "details": str(exc)}), 500


@app.route("/api/auth/login", methods=["POST"])
def api_login():
    try:
        data = request.get_json() or {}
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not email or not password:
            return jsonify({"error": "Please enter email and password."}), 400

        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT user_id, name, email, password, phone, role FROM users WHERE email = %s",
                    (email,),
                )
                user = cur.fetchone()

                if not user:
                    return jsonify({"error": "Invalid email or password."}), 401

                stored = user["password"]
                valid = False
                try:
                    valid = check_password_hash(stored, password)
                except (ValueError, TypeError):
                    valid = stored == password

                if not valid and stored == password:
                    valid = True
                    cur.execute(
                        "UPDATE users SET password = %s WHERE user_id = %s",
                        (generate_password_hash(password), user["user_id"]),
                    )
                    conn.commit()

                if not valid:
                    return jsonify({"error": "Invalid email or password."}), 401

        return jsonify({
            "message": "Login successful.",
            "user": {
                "id": user["user_id"],
                "name": user["name"],
                "email": user["email"],
                "phone": user["phone"],
                "role": user["role"],
            },
        })

    except Exception as exc:
        app.logger.exception("Login database error")
        return jsonify({"error": "Could not login.", "details": str(exc)}), 500


# -------------------- Cart helpers --------------------
def get_user_id(data=None):
    data = data or {}
    raw = data.get("user_id")
    try:
        return int(raw)
    except (TypeError, ValueError):
        return None


def ensure_cart(cur, user_id):
    cur.execute(
        """
        INSERT INTO carts (user_id)
        VALUES (%s)
        ON CONFLICT (user_id) DO NOTHING
        """,
        (user_id,),
    )
    cur.execute("SELECT cart_id FROM carts WHERE user_id = %s", (user_id,))
    row = cur.fetchone()
    return row["cart_id"]


# -------------------- Cart API --------------------
@app.route("/api/cart", methods=["GET"])
def api_get_cart():
    user_id = get_user_id(request.args)
    if not user_id:
        return jsonify({"error": "Please log in to view your cart."}), 401

    try:
        query = """
            SELECT
                ci.product_id AS id,
                ci.quantity,
                p.product_name AS name,
                b.brand_name AS brand,
                p.price,
                p.stock,
                p.image,
                p.description
            FROM carts c
            JOIN cart_items ci ON ci.cart_id = c.cart_id
            JOIN products p ON p.product_id = ci.product_id
            JOIN brands b ON b.brand_id = p.brand_id
            WHERE c.user_id = %s
            ORDER BY ci.product_id
        """
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (user_id,))
                items = cur.fetchall()

        total = sum(float(item["price"]) * item["quantity"] for item in items)
        count = sum(item["quantity"] for item in items)

        return jsonify({
            "items": [dict(item) for item in items],
            "total": total,
            "count": count,
        })

    except Exception as exc:
        app.logger.exception("Cart fetch error")
        return jsonify({"error": "Could not load cart.", "details": str(exc)}), 500


@app.route("/api/cart", methods=["POST"])
def api_add_to_cart():
    try:
        data = request.get_json() or {}
        user_id = get_user_id(data)
        product_id = get_user_id({"user_id": data.get("product_id")})
        quantity = int(data.get("quantity", 1))

        if not user_id:
            return jsonify({"error": "Please log in before adding items to cart."}), 401
        if not product_id or quantity < 1:
            return jsonify({"error": "Invalid product or quantity."}), 400

        with get_connection() as conn:
            with conn.cursor() as cur:
                cart_id = ensure_cart(cur, user_id)

                cur.execute(
                    "SELECT stock FROM products WHERE product_id = %s FOR UPDATE",
                    (product_id,),
                )
                product = cur.fetchone()
                if not product:
                    return jsonify({"error": "Product not found."}), 404

                if product["stock"] < quantity:
                    return jsonify({"error": "Not enough stock available."}), 400

                cur.execute(
                    "SELECT quantity FROM cart_items WHERE cart_id = %s AND product_id = %s",
                    (cart_id, product_id),
                )
                existing = cur.fetchone()

                if existing:
                    new_quantity = existing["quantity"] + quantity
                    if new_quantity > product["stock"]:
                        return jsonify({"error": "Cannot add more than available stock."}), 400
                    cur.execute(
                        "UPDATE cart_items SET quantity = %s WHERE cart_id = %s AND product_id = %s",
                        (new_quantity, cart_id, product_id),
                    )
                else:
                    cur.execute(
                        "INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (%s, %s, %s)",
                        (cart_id, product_id, quantity),
                    )

            conn.commit()

        return jsonify({"message": "Added to cart."}), 201

    except Exception as exc:
        app.logger.exception("Add to cart error")
        return jsonify({"error": "Could not add to cart.", "details": str(exc)}), 500


@app.route("/api/cart/<int:product_id>", methods=["PATCH"])
def api_update_cart(product_id):
    try:
        data = request.get_json() or {}
        user_id = get_user_id(data)
        quantity = int(data.get("quantity", 0))

        if not user_id:
            return jsonify({"error": "Please log in."}), 401
        if quantity < 1:
            return api_remove_from_cart(product_id)

        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT cart_id FROM carts WHERE user_id = %s", (user_id,))
                cart = cur.fetchone()
                if not cart:
                    return jsonify({"error": "Cart not found."}), 404

                cur.execute("SELECT stock FROM products WHERE product_id = %s", (product_id,))
                product = cur.fetchone()
                if not product:
                    return jsonify({"error": "Product not found."}), 404
                if quantity > product["stock"]:
                    return jsonify({"error": "Quantity exceeds available stock."}), 400

                cur.execute(
                    """
                    UPDATE cart_items
                    SET quantity = %s
                    WHERE cart_id = %s AND product_id = %s
                    """,
                    (quantity, cart["cart_id"], product_id),
                )
                if cur.rowcount == 0:
                    return jsonify({"error": "Item is not in the cart."}), 404

            conn.commit()

        return jsonify({"message": "Cart updated."})

    except Exception as exc:
        app.logger.exception("Cart update error")
        return jsonify({"error": "Could not update cart.", "details": str(exc)}), 500


@app.route("/api/cart/<int:product_id>", methods=["DELETE"])
def api_remove_from_cart(product_id):
    try:
        data = request.get_json(silent=True) or {}
        user_id = get_user_id(data) or get_user_id(request.args)
        if not user_id:
            return jsonify({"error": "Please log in."}), 401

        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT cart_id FROM carts WHERE user_id = %s", (user_id,))
                cart = cur.fetchone()
                if cart:
                    cur.execute(
                        "DELETE FROM cart_items WHERE cart_id = %s AND product_id = %s",
                        (cart["cart_id"], product_id),
                    )
            conn.commit()

        return jsonify({"message": "Item removed from cart."})

    except Exception as exc:
        app.logger.exception("Remove cart item error")
        return jsonify({"error": "Could not remove item.", "details": str(exc)}), 500


# -------------------- Checkout / Orders API --------------------
@app.route("/api/checkout", methods=["POST"])
def api_checkout():
    try:
        data = request.get_json() or {}
        user_id = get_user_id(data)
        address_line = data.get("address", "").strip()
        city = data.get("city", "").strip()
        state = data.get("state", "").strip()
        pincode = data.get("pincode", "").strip()
        payment_method = data.get("payment_method", "").strip()

        if not user_id:
            return jsonify({"error": "Please log in before checkout."}), 401
        if not all([address_line, city, state, pincode]):
            return jsonify({"error": "Please fill in the complete delivery address."}), 400
        if payment_method not in ("UPI", "Card", "Cash on Delivery"):
            return jsonify({"error": "Invalid payment method."}), 400

        with get_connection() as conn:
            with conn.cursor() as cur:
                # Lock the user's cart items while creating the order.
                cur.execute(
                    """
                    SELECT ci.product_id, ci.quantity, p.price, p.stock
                    FROM carts c
                    JOIN cart_items ci ON ci.cart_id = c.cart_id
                    JOIN products p ON p.product_id = ci.product_id
                    WHERE c.user_id = %s
                    FOR UPDATE OF ci, p
                    """,
                    (user_id,),
                )
                items = cur.fetchall()

                if not items:
                    return jsonify({"error": "Your cart is empty."}), 400

                for item in items:
                    if item["quantity"] > item["stock"]:
                        return jsonify({
                            "error": "One or more items no longer have enough stock."
                        }), 400

                total = sum(float(item["price"]) * item["quantity"] for item in items)

                cur.execute(
                    """
                    INSERT INTO addresses (user_id, address_line, city, state, pincode)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING address_id
                    """,
                    (user_id, address_line, city, state, pincode),
                )
                address_id = cur.fetchone()["address_id"]

                cur.execute(
                    """
                    INSERT INTO orders (user_id, address_id, total_amount, order_status)
                    VALUES (%s, %s, %s, 'Pending')
                    RETURNING order_id, order_date, total_amount, order_status
                    """,
                    (user_id, address_id, total),
                )
                order = cur.fetchone()

                for item in items:
                    cur.execute(
                        """
                        INSERT INTO order_items (order_id, product_id, quantity, unit_price)
                        VALUES (%s, %s, %s, %s)
                        """,
                        (order["order_id"], item["product_id"], item["quantity"], item["price"]),
                    )
                    cur.execute(
                        """
                        UPDATE products
                        SET stock = stock - %s
                        WHERE product_id = %s
                        """,
                        (item["quantity"], item["product_id"]),
                    )

                payment_status = "Pending" if payment_method == "Cash on Delivery" else "Successful"
                cur.execute(
                    """
                    INSERT INTO payments (order_id, payment_method, payment_status, amount)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (order["order_id"], payment_method, payment_status, total),
                )

                cur.execute(
                    """
                    DELETE FROM cart_items
                    WHERE cart_id = (SELECT cart_id FROM carts WHERE user_id = %s)
                    """,
                    (user_id,),
                )

            conn.commit()

        return jsonify({
            "message": "Order placed successfully!",
            "order": {
                "order_id": order["order_id"],
                "date": order["order_date"].isoformat(),
                "total": float(order["total_amount"]),
                "status": order["order_status"],
                "payment_method": payment_method,
                "payment_status": payment_status,
            },
        }), 201

    except Exception as exc:
        app.logger.exception("Checkout error")
        return jsonify({"error": "Could not place order.", "details": str(exc)}), 500


@app.route("/api/orders", methods=["GET"])
def api_orders():
    user_id = get_user_id(request.args)
    if not user_id:
        return jsonify({"error": "Please log in to view orders."}), 401

    try:
        query = """
            SELECT
                o.order_id,
                o.order_date,
                o.total_amount,
                o.order_status,
                p.payment_method,
                p.payment_status,
                COUNT(oi.product_id) AS item_types,
                COALESCE(SUM(oi.quantity), 0) AS item_count
            FROM orders o
            LEFT JOIN payments p ON p.order_id = o.order_id
            LEFT JOIN order_items oi ON oi.order_id = o.order_id
            WHERE o.user_id = %s
            GROUP BY o.order_id, p.payment_method, p.payment_status
            ORDER BY o.order_date DESC, o.order_id DESC
        """
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (user_id,))
                rows = cur.fetchall()

        return jsonify({"orders": [dict(row) for row in rows]})

    except Exception as exc:
        app.logger.exception("Orders fetch error")
        return jsonify({"error": "Could not load orders.", "details": str(exc)}), 500


if __name__ == "__main__":
    app.run(debug=True)
