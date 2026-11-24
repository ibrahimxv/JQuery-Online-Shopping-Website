$(function () {

  var PRODUCTS_KEY = "shop_products";
  var CART_KEY = "shop_cart";
  var PLACEHOLDER = "data:image/svg+xml;utf8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">' +
    '<rect width="100%" height="100%" fill="#e5e7eb"/>' +
    '<text x="50%" y="50%" fill="#9ca3af" font-size="22" text-anchor="middle" font-family="Arial">No Image</text></svg>'
  );

  var defaultProducts = [
    { id: 1, name: "Wireless Headphones", price: 59.99, category: "Electronics",
      description: "Bluetooth over-ear headphones with noise isolation and 30 hours of battery life.",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400" },
    { id: 2, name: "Smart Watch", price: 129.5, category: "Electronics",
      description: "Fitness tracker with heart-rate monitor, GPS and water resistance.",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400" },
    { id: 3, name: "Classic T-Shirt", price: 19.9, category: "Clothing",
      description: "Soft 100% cotton t-shirt, comfortable fit for everyday wear.",
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400" },
    { id: 4, name: "Leather Backpack", price: 74.0, category: "Accessories",
      description: "Durable leather backpack with laptop compartment and multiple pockets.",
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400" },
    { id: 5, name: "Running Shoes", price: 89.0, category: "Sports",
      description: "Lightweight breathable running shoes with cushioned sole.",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400" },
    { id: 6, name: "Ceramic Table Lamp", price: 34.5, category: "Home",
      description: "Modern bedside lamp with warm light, perfect for any room.",
      image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400" }
  ];

  /* ---------- localStorage helpers ---------- */
  function load(key, fallback) {
    var raw = localStorage.getItem(key);
    if (raw === null) { return fallback; }
    try { return JSON.parse(raw); } catch (e) { return fallback; }
  }
  function saveProducts() { localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products)); }
  function saveCart() { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

  var products = load(PRODUCTS_KEY, null);
  if (!products) { products = defaultProducts; saveProducts(); }
  var cart = load(CART_KEY, []);   // [{ id, qty }]
  var newlyAddedId = null;

  /* ---------- utils ---------- */
  function esc(str) { return $("<div>").text(str).html(); }
  function money(n) { return "$" + Number(n).toFixed(2); }
  function findProduct(id) {
    for (var i = 0; i < products.length; i++) { if (products[i].id === id) { return products[i]; } }
    return null;
  }
  function findCartItem(id) {
    for (var i = 0; i < cart.length; i++) { if (cart[i].id === id) { return cart[i]; } }
    return null;
  }

  /* ---------- category filter options ---------- */
  function renderCategories() {
    var current = $("#categoryFilter").val() || "all";
    var cats = [];
    $.each(products, function (i, p) { if ($.inArray(p.category, cats) === -1) { cats.push(p.category); } });
    $("#categoryFilter").empty().append('<option value="all">All categories</option>');
    $.each(cats, function (i, c) { $("#categoryFilter").append('<option value="' + esc(c) + '">' + esc(c) + "</option>"); });
    if ($.inArray(current, cats) !== -1) { $("#categoryFilter").val(current); }
  }

  /* ---------- products ---------- */
  function getVisibleProducts() {
    var term = $.trim($("#searchInput").val()).toLowerCase();
    var cat = $("#categoryFilter").val() || "all";
    var sort = $("#sortPrice").val();

    var list = $.grep(products, function (p) {
      var okName = p.name.toLowerCase().indexOf(term) !== -1;
      var okCat = (cat === "all") || (p.category === cat);
      return okName && okCat;
    });

    if (sort === "asc") { list.sort(function (a, b) { return a.price - b.price; }); }
    if (sort === "desc") { list.sort(function (a, b) { return b.price - a.price; }); }
    return list;
  }

  function renderProducts() {
    var list = getVisibleProducts();
    var $grid = $("#productList");
    $grid.empty();
    $("#totalProducts").text(products.length);

    if (list.length === 0) { $("#noProducts").show(); } else { $("#noProducts").hide(); }

    $.each(list, function (i, p) {
      var html =
        '<article class="card" data-id="' + p.id + '">' +
          '<div class="card-img-wrap">' +
            '<img class="card-img" src="' + esc(p.image) + '" alt="' + esc(p.name) + '" title="Double click to see price">' +
            '<div class="price-badge">' + money(p.price) + "</div>" +
          "</div>" +
          '<div class="card-body">' +
            '<h3 class="card-title">' + esc(p.name) + "</h3>" +
            '<span class="card-category">' + esc(p.category) + "</span>" +
            '<div class="card-price">' + money(p.price) + "</div>" +
            '<p class="card-desc">' + esc(p.description) + "</p>" +
            '<div class="card-actions">' +
              '<button class="btn btn-small btn-gray btn-desc">Details</button>' +
              '<button class="btn btn-small btn-green btn-add">Add to Cart</button>' +
              '<button class="btn btn-small btn-orange btn-edit">Edit</button>' +
              '<button class="btn btn-small btn-danger btn-delete">Delete</button>' +
            "</div>" +
          "</div>" +
        "</article>";
      $grid.append(html);
    });

    // broken image fallback
    $grid.find("img.card-img").on("error", function () { $(this).off("error").attr("src", PLACEHOLDER); });

    // new product animation
    if (newlyAddedId !== null) {
      var $card = $grid.find('.card[data-id="' + newlyAddedId + '"]');
      $card.hide().slideDown(500);
      newlyAddedId = null;
    }
  }

  /* ---------- cart ---------- */
  function renderCart() {
    var $items = $("#cartItems");
    $items.empty();

    // remove items whose product no longer exists
    cart = $.grep(cart, function (c) { return findProduct(c.id) !== null; });
    saveCart();

    var count = 0, total = 0;

    if (cart.length === 0) {
      $items.html('<div class="cart-empty">Your cart is empty</div>');
      $("#cartFooter").hide();
    } else {
      $("#cartFooter").show();
      $.each(cart, function (i, c) {
        var p = findProduct(c.id);
        var line = p.price * c.qty;
        count += c.qty;
        total += line;
        $items.append(
          '<div class="cart-item" data-id="' + p.id + '">' +
            '<img src="' + esc(p.image) + '" alt="">' +
            '<div class="cart-info">' +
              '<div class="cart-name">' + esc(p.name) + "</div>" +
              '<div class="cart-unit">' + money(p.price) + " each</div>" +
              '<div class="cart-line">' + money(line) + "</div>" +
            "</div>" +
            '<div class="qty">' +
              '<button class="qty-minus">−</button><span>' + c.qty + '</span><button class="qty-plus">+</button>' +
            "</div>" +
            '<button class="btn btn-small btn-danger cart-remove">Remove</button>' +
          "</div>"
        );
      });
      $items.find("img").on("error", function () { $(this).off("error").attr("src", PLACEHOLDER); });
    }

    $("#cartCount").text(count);
    $("#cartTotal").text(money(total));
  }

  function addToCart(id) {
    var item = findCartItem(id);
    if (item) { item.qty += 1; } else { cart.push({ id: id, qty: 1 }); }
    saveCart();
    renderCart();
    $("#cartCount").animate({ fontSize: "18px" }, 120).animate({ fontSize: "12px" }, 120);
  }

  function changeQty(id, delta) {
    var item = findCartItem(id);
    if (!item) { return; }
    item.qty += delta;
    if (item.qty <= 0) {
      cart = $.grep(cart, function (c) { return c.id !== id; });
    }
    saveCart();
    renderCart();
  }

  /* ---------- form helpers ---------- */
  function clearErrors() {
    $(".error").text("");
    $("#productForm input, #productForm select, #productForm textarea").removeClass("invalid");
  }
  function setError($field, $err, msg) { $field.addClass("invalid"); $err.text(msg); }

  function resetForm() {
    $("#productForm")[0].reset();
    $("#productId").val("");
    $("#formTitle").text("Add New Product");
    $("#submitBtn").text("Add Product");
    clearErrors();
  }

  function showMessage(text) {
    $("#formMessage").text(text).stop(true, true).fadeIn(300).delay(1800).fadeOut(400);
  }

  function validate() {
    var ok = true;
    clearErrors();

    var name = $.trim($("#pName").val());
    var priceRaw = $.trim($("#pPrice").val());
    var price = parseFloat(priceRaw);
    var cat = $("#pCategory").val();
    var img = $.trim($("#pImage").val());
    var desc = $.trim($("#pDesc").val());

    if (name === "") { setError($("#pName"), $("#errName"), "Product name is required."); ok = false; }
    else if (name.length < 3) { setError($("#pName"), $("#errName"), "Product name must be at least 3 characters."); ok = false; }

    if (priceRaw === "") { setError($("#pPrice"), $("#errPrice"), "Price is required."); ok = false; }
    else if (isNaN(price) || price <= 0) { setError($("#pPrice"), $("#errPrice"), "Price must be greater than 0."); ok = false; }

    if (cat === "") { setError($("#pCategory"), $("#errCategory"), "Category is required."); ok = false; }
    if (img === "") { setError($("#pImage"), $("#errImage"), "Image URL is required."); ok = false; }
    if (desc === "") { setError($("#pDesc"), $("#errDesc"), "Description is required."); ok = false; }

    return ok;
  }

  /* ================= EVENTS ================= */

  // keyup – live search
  $("#searchInput").on("keyup", renderProducts);

  // change – category and sort
  $("#categoryFilter").on("change", renderProducts);
  $("#sortPrice").on("change", renderProducts);

  // click – cart open/close (slideToggle)
  $("#cartToggle").on("click", function () { $("#cartPanel").slideToggle(300); });
  $("#cartClose").on("click", function () { $("#cartPanel").slideUp(250); });

  // click – form show/hide
  $("#toggleForm").on("click", function () {
    if ($("#formSection").is(":visible") && $("#productId").val() === "") {
      $("#formSection").slideUp(300);
    } else {
      resetForm();
      $("#formSection").slideDown(300);
    }
  });
  $("#cancelEdit").on("click", function () { resetForm(); $("#formSection").slideUp(300); });

  // click – description toggle()
  $("#productList").on("click", ".btn-desc", function () {
    $(this).closest(".card").find(".card-desc").toggle(200);
    $(this).text($(this).text() === "Details" ? "Hide" : "Details");
  });

  // dblclick – show price (fadeToggle)
  $("#productList").on("dblclick", ".card-img", function () {
    $(this).siblings(".price-badge").fadeToggle(250);
  });

  // mouseenter / mouseleave – animate size
  $("#productList").on("mouseenter", ".card", function () {
    $(this).addClass("hover").find(".card-img").stop(true).animate({ height: "210px" }, 200);
  });
  $("#productList").on("mouseleave", ".card", function () {
    $(this).removeClass("hover").find(".card-img").stop(true).animate({ height: "180px" }, 200);
  });

  // click – add to cart
  $("#productList").on("click", ".btn-add", function () {
    addToCart(Number($(this).closest(".card").data("id")));
  });

  // click – delete product (fadeOut)
  $("#productList").on("click", ".btn-delete", function () {
    var $card = $(this).closest(".card");
    var id = Number($card.data("id"));
    $card.fadeOut(400, function () {
      products = $.grep(products, function (p) { return p.id !== id; });
      saveProducts();
      renderCategories();
      renderProducts();
      renderCart();
    });
  });

  // click – edit product
  $("#productList").on("click", ".btn-edit", function () {
    var p = findProduct(Number($(this).closest(".card").data("id")));
    if (!p) { return; }
    clearErrors();
    $("#productId").val(p.id);
    $("#pName").val(p.name);
    $("#pPrice").val(p.price);
    $("#pCategory").val(p.category);
    $("#pImage").val(p.image);
    $("#pDesc").val(p.description);
    $("#formTitle").text("Edit Product");
    $("#submitBtn").text("Update Product");
    $("#formSection").slideDown(300);
    $("html, body").animate({ scrollTop: $("#formSection").offset().top - 80 }, 400);
  });

  // submit – add / update product
  $("#productForm").on("submit", function (e) {
    e.preventDefault();
    if (!validate()) { return; }

    var data = {
      name: $.trim($("#pName").val()),
      price: parseFloat($("#pPrice").val()),
      category: $("#pCategory").val(),
      image: $.trim($("#pImage").val()),
      description: $.trim($("#pDesc").val())
    };

    var editId = $("#productId").val();
    if (editId !== "") {
      var p = findProduct(Number(editId));
      $.extend(p, data);
      showMessage("Product updated successfully!");
    } else {
      var maxId = 0;
      $.each(products, function (i, x) { if (x.id > maxId) { maxId = x.id; } });
      data.id = maxId + 1;
      products.push(data);
      newlyAddedId = data.id;
      showMessage("Product added successfully!");
    }

    saveProducts();
    renderCategories();
    renderProducts();
    renderCart();
    resetForm();
  });

  // cart: quantity +/- and remove
  $("#cartItems").on("click", ".qty-plus", function () {
    changeQty(Number($(this).closest(".cart-item").data("id")), 1);
  });
  $("#cartItems").on("click", ".qty-minus", function () {
    changeQty(Number($(this).closest(".cart-item").data("id")), -1);
  });
  $("#cartItems").on("click", ".cart-remove", function () {
    var $row = $(this).closest(".cart-item");
    var id = Number($row.data("id"));
    $row.fadeOut(300, function () {
      cart = $.grep(cart, function (c) { return c.id !== id; });
      saveCart();
      renderCart();
    });
  });

  // clear cart
  $("#clearCart").on("click", function () {
    cart = [];
    localStorage.removeItem(CART_KEY);
    renderCart();
  });

  /* ---------- init ---------- */
  renderCategories();
  renderProducts();
  renderCart();
});