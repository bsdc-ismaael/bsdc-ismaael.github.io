// Initialize Stripe.js with your Publishable Key
const stripe = Stripe('pk_live_51QOgcwAWI44r05bCjiaFtRgy9MgqJimdRPVQksK8VRAZF4ZOg0hNQ8DAbq8TwUmtkyGLRWTujewzLzO6Q8L8jlTY00L0lcyWy5'); // Replace with your actual publishable key

// Menu Items with Prices
const menuItems = {
    breakfast: [
        { name: 'Desi Breakfast', price: 6.50 },
        { name: 'English Breakfast', price: 6.50 },
        { name: 'Puri Breakfast', price: 6.50 }
    ],
    paratha: [
        { name: 'Classic Paratha', price: 2.00 },
        { name: 'Aloo Paratha', price: 3.00 },
        { name: 'Keema Paratha', price: 3.50 },
        { name: 'Nutella Paratha', price: 2.50 }
    ],
    wraps: [
        { name: 'Desi Wrap', price: 4.50 }
    ],
    hotDrinks: [
        { name: 'Classic Karak', price: 2.50 },
        { name: 'Masala Chai', price: 2.50 },
        { name: 'Doodh Patti', price: 2.50 },
        { name: 'Haldi Milk', price: 2.50 }
    ],
    extras: [
        { name: 'Puri', price: 1.50 },
        { name: 'Lahori Channa', price: 2.50 },
        { name: 'Halwa', price: 3.00 },
        { name: 'Masala Beans', price: 2.00 },
        { name: 'Chicken Sausage', price: 1.50 },
        { name: 'Hashbrown', price: 1.50 }
    ]
};

// Populate category dropdown dynamically
function populateCategoryDropdown(category) {
    const categoryItems = menuItems[category];
    const categoryDropdown = document.getElementById("categoryItems");
    categoryDropdown.innerHTML = '';

    if (categoryItems) {
        categoryItems.forEach(item => {
            const option = document.createElement("option");
            option.value = item.name;
            option.textContent = `${item.name} - £${item.price}`;
            categoryDropdown.appendChild(option);
        });
    }
}

// Handle category selection
document.getElementById("mealCategory").addEventListener("change", function () {
    const category = this.value;

    if (category) {
        document.getElementById("additionalOptions").style.display = "block";
        populateCategoryDropdown(category);
    } else {
        document.getElementById("additionalOptions").style.display = "none";
    }
});

// Add items to cart
document.getElementById("addToCart").addEventListener("click", function () {
    const selectedItem = document.getElementById("categoryItems").value;
    const selectedCategory = document.getElementById("mealCategory").value;

    if (selectedItem && selectedCategory) {
        const itemDetails = {
            name: selectedItem,
            category: selectedCategory,
            price: menuItems[selectedCategory]?.find(item => item.name === selectedItem)?.price || 0
        };

        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        cart.push(itemDetails);
        localStorage.setItem('cart', JSON.stringify(cart));

        updateCart();
    } else {
        alert("Please select an item to add.");
    }
});

// Update cart display
function updateCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartList = document.getElementById("cartList");
    const totalAmount = calculateTotalAmount();

    cartList.innerHTML = '';

    if (cart.length === 0) {
        cartList.innerHTML = '<li>Your cart is empty.</li>';
    } else {
        cart.forEach((item, index) => {
            const listItem = document.createElement("li");
            listItem.textContent = `${item.name} (£${item.price.toFixed(2)})`;

            const removeButton = document.createElement("button");
            removeButton.textContent = "Remove";
            removeButton.onclick = () => {
                cart.splice(index, 1);
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCart();
            };

            listItem.appendChild(removeButton);
            cartList.appendChild(listItem);
        });

        document.getElementById("totalAmount").textContent = `Total: £${totalAmount.toFixed(2)}`;
    }
}

// Calculate total amount
function calculateTotalAmount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    return cart.reduce((total, item) => total + item.price, 0);
}

// Create Stripe Checkout session
async function createCheckoutSession() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const customerEmail = document.getElementById("email").value;

    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    if (!customerEmail) {
        alert("Please enter your email!");
        return;
    }

    try {
        const response = await fetch('https://bsdc-ismaael-github-io-blue.vercel.app/api/create-checkout-session', { // Updated Backend URL
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ items: cart }),
        });

        if (!response.ok) {
            throw new Error('Failed to create checkout session. Please check your backend.');
        }

        const session = await response.json();

        if (session.id) {
            // Redirect to Stripe Checkout
            stripe.redirectToCheckout({ sessionId: session.id });
        } else {
            alert('Failed to create Stripe Checkout session');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while creating the checkout session.');
    }
}


// Attach checkout functionality to button
document.getElementById("checkoutButton").addEventListener("click", createCheckoutSession);

// Initialize cart on page load
updateCart();
