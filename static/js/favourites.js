function renderFavourites() {
    const ids = getFavourites();
    const list = products.filter(p => ids.includes(p.id));
    document.getElementById("favourite-grid").innerHTML =
        list.length ? list.map(productCard).join("") :
        `<div class="empty"><h2>No favourites yet</h2><p>Tap ♡ on a watch to save it.</p><a class="btn" href="/products">Browse Watches</a></div>`;
}
renderFavourites();
