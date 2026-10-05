function renderProducts() {
    const search = document.getElementById("search-input").value.toLowerCase().trim();
    const category = document.getElementById("category-filter").value;

    const filtered = products.filter(p => {
        const matchesSearch =
            !search ||
            p.name.toLowerCase().includes(search) ||
            p.brand.toLowerCase().includes(search) ||
            p.seller.toLowerCase().includes(search);
        const matchesCategory = !category || p.categories.includes(category);
        return matchesSearch && matchesCategory;
    });

    document.getElementById("product-grid").innerHTML =
        filtered.length ? filtered.map(productCard).join("") :
        `<div class="empty"><h2>No watches found</h2><p>Try another search or category.</p></div>`;
}

const params = new URLSearchParams(window.location.search);
const initialCategory = params.get("category") || "";
const initialSearch = params.get("search") || "";

document.getElementById("search-input").value = initialSearch;
document.getElementById("category-filter").value = initialCategory;
document.getElementById("search-input").addEventListener("input", renderProducts);
document.getElementById("category-filter").addEventListener("change", renderProducts);
window.addEventListener("heliosProductsReady", renderProducts);
