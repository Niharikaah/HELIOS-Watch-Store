# HELIOS – Online Watch Marketplace

HELIOS is a web-based online watch marketplace developed as a DBMS project using Flask, PostgreSQL, HTML, CSS and JavaScript.

The application allows users to browse watches, search and filter products, manage favourites and cart items, complete checkout, and view their orders.

## Live Website

https://helios-watch-store.onrender.com

## GitHub Repository

https://github.com/Niharikaah/HELIOS-Watch-Store

## Features

- User registration and login
- Watch catalogue
- Product search
- Category filtering
- Product details and specifications
- Favourites
- Shopping cart
- Checkout
- Order placement
- Order history
- PostgreSQL database integration
- Responsive user interface

## Technology Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Python, Flask
- **Database:** PostgreSQL
- **Database Hosting:** Neon
- **Deployment:** Render

## Database

The HELIOS database contains 12 tables:

1. USERS
2. BRANDS
3. CATEGORIES
4. PRODUCTS
5. PRODUCT_CATEGORIES
6. CARTS
7. CART_ITEMS
8. FAVOURITES
9. ADDRESSES
10. ORDERS
11. ORDER_ITEMS
12. PAYMENTS

The database schema is available in:

`database/schema.sql`

## Order Statuses

Orders can have the following statuses:

- Pending
- Confirmed
- Shipped
- Delivered
- Cancelled

## Payment Methods

The system supports:

- UPI
- Card
- Cash on Delivery

## Running the Project Locally

From the `helios_project` directory:

```powershell
pip install -r requirements.txt