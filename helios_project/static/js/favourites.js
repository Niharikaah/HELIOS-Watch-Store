function renderFavourites() {
    if (typeof products === "undefined" || products.length === 0) {
        setTimeout(renderFavourites, 200);
        return;
    }

    const ids = getFavourites().map(Number);
    const list = products.filter(p => ids.includes(Number(p.id)));

    document.getElementById("favourite-grid").innerHTML =
        list.length ? list.map(productCard).join("") :
        `<div class="empty"><h2>No favourites yet</h2><p>Tap ♡ on a watch to save it.</p><a class="btn" href="/products">Browse Watches</a></div>`;
}

document.addEventListener("DOMContentLoaded", renderFavourites);