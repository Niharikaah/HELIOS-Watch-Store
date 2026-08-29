let products = [];

// Ratings/review counts are presentation-only because our current DB schema
// does not have a reviews table yet.
const productMeta = {
    1: {rating: 4.9, reviews: 128},
    2: {rating: 4.8, reviews: 96},
    3: {rating: 4.9, reviews: 84},
    4: {rating: 4.7, reviews: 72},
    5: {rating: 4.6, reviews: 110},
    6: {rating: 4.8, reviews: 58},
    7: {rating: 4.9, reviews: 69},
    8: {rating: 4.7, reviews: 54}
};

function prepareProducts(data) {
    products = data.map(p => ({
        ...p,
        price: Number(p.price),
        stock: Number(p.stock),
        rating: productMeta[p.id]?.rating || 4.8,
        reviews: productMeta[p.id]?.reviews || 60,
        strapMaterial: p.strap_material,
        dialColour: p.dial_colour,
        caseMaterial: p.case_material,
        movementType: p.movement_type,
        waterResistance: p.water_resistance,
        displayType: p.display_type
    }));
}

fetch("/api/products")
    .then(response => {
        if (!response.ok) throw new Error("Could not load products from PostgreSQL");
        return response.json();
    })
    .then(data => {
        prepareProducts(data);
        window.dispatchEvent(new Event("heliosProductsReady"));
    })
    .catch(error => {
        console.error(error);
        document.querySelectorAll("#product-grid, #featured-products").forEach(el => {
            el.innerHTML = `<div class="empty"><h2>Could not load watches</h2><p>Check the PostgreSQL connection and refresh the page.</p></div>`;
        });
    });
