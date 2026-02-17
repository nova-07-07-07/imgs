let body, intro, jssuser, loginpage,  profileScreen;
let popUp = {};
let map, marker, tileLayer;
const SALEM = [11.6076, 78.0037];
let selectedMapType = 'road';
let selectedProfileFile = null;
let userdata = null;
let profilePreviewUrl = null;
let user = {
    profile_url: "https://cdn-icons-png.flaticon.com/512/847/847969.png",
    name: "Nova",
    id: "JSS1024",
    location: "Kattur",
    price: 30
};
let cart = [];
let orderPlaced = false;
let selectedItems = [];



const items_price = {
        "200": 100,
        "300": 130,
        "500": 140,
        "1000": 150,
        "2000": 140,
        "20000": userdata?.percanprice || 35
    };


// images used for the sliding carousel and function products
let imageList = [
    "https://raw.githubusercontent.com/nova-07-07-07/imgs/refs/heads/main/1_300ml_c.jpg",
    "https://raw.githubusercontent.com/nova-07-07-07/imgs/refs/heads/main/2_300ml.jpg",
    "https://raw.githubusercontent.com/nova-07-07-07/imgs/refs/heads/main/3_500ml.jpg",
    "https://raw.githubusercontent.com/nova-07-07-07/imgs/refs/heads/main/4_1l.jpg",
    "https://raw.githubusercontent.com/nova-07-07-07/imgs/refs/heads/main/5_3001l.jpg",
    "https://raw.githubusercontent.com/nova-07-07-07/imgs/refs/heads/main/6_all.jpg"
];

// ---------------- Power / Intro ----------------
function power_on() {
    dis_intro();

    if (jssuser) {
        fetchAndStoreUser(jssuser).then((val) => {
            if (val) {
                setTimeout(showHome, 3200);
            }else{
                setTimeout(()=> {
                // redirect to login page
                document.getElementById("home").style.display = "none";
                document.getElementById("login").style.display = "flex";
                }, 3200);
            }
        });
    } else {
        if (loginpage) {
            loginpage.style.display = "flex";
            body.style.backgroundColor = "#0c2132";
            body.style.color = "#fff";
        }
    }
}


function dis_intro() {
    if (intro) intro.style.display = "flex";
    if (body) body.style.backgroundColor = "#2e416a";

    setTimeout(() => {
        if (intro) intro.style.display = "none";
    }, 3000);
}



async function sendOtp() {
    const mobile = document.getElementById("mobile_signup").value;
    if (!mobile) return;
    try {
        const res = await fetch("http://localhost:5000/sendOtp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ mobile })
        });

        const response = await res.json();

        if (response.success ) {
            popUp.top.innerText = "OTP sent to " + mobile;
            popUp.bottom.innerText = "Please check your messages and enter the OTP to continue";
            popUp.window.style.display = "flex";
            setTimeout(closePopup, 2000);
            document.getElementById("otp_signup").focus();
        } else {
            popUp.top.innerText = "Failed to send OTP ";
            popUp.bottom.innerText = response.message || "Please try again";
            popUp.window.style.display = "flex";
            setTimeout(closePopup, 2000);
        }
    } catch (error) {
        console.error("Error sending OTP:", error);
        popUp.top.innerText = "Network error while sending OTP";
        popUp.bottom.innerText = "";
        popUp.window.style.display = "flex";
        setTimeout(closePopup, 2000);
    }
}
            

// ---------------- Signup ----------------
async function signup() {
    const id = document.getElementById("newwwid").value;
    const name = document.getElementById("name_signup").value;
    const password = document.getElementById("password_signup").value;
    const address = document.getElementById("address_signup").value;
    const mobile = document.getElementById("mobile_signup").value;
    const otp = document.getElementById("otp_signup").value;

    if (!id || !name || !password || !address || !mobile || !otp) {
        popUp.top.innerText = "Please fill all fields";
        popUp.bottom.innerText = `${!id ? "ID is required. " : ""}${!name ? "name is required. " : !password ? "password is required. " : !address ? "address is required." : ""}`;
        popUp.window.style.display = "flex";
        popUp.window.style.index = "1";
        setTimeout(closePopup, 2500);
        return;
    }

    try {
        let res;
        if (selectedProfileFile) {
            const form = new FormData();
            form.append('id', id);
            form.append('name', name);
            form.append('password', password);
            form.append('address', address);
            form.append('profileimg', selectedProfileFile, selectedProfileFile.name);
            form.append('mobile', mobile);
            form.append('otp', otp);

            res = await fetch("http://localhost:5000/signup", {
                method: "POST",
                body: form
            });
        } else {
            res = await fetch("http://localhost:5000/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ id, name, password, address, mobile, otp })
            });
        }

        const response = await res.json();

        if (response.success) {
            const stored = {
                id :response.userId,
                profileimg : response.profileimg,
                name : response.name,
                address : response.address,
                mobile : response.mobile,
                percanprice : response.percanprice
             };
             console.log(stored);
             
            localStorage.setItem("jssuser", response.userId);
            await fetchAndStoreUser(response.userId);

            popUp.top.innerText =
                `Signup successful!\n please note the following:\n Your ID: ${response.userId} \n password: ${password}`;
            popUp.bottom.innerText = "";

            setTimeout(() => {
                closePopup();
                dis_intro();
                setTimeout(showHome, 3200);
            }, 2500);
        } else {
            popUp.top.innerText =
                "Signup failed: " ;
            popUp.bottom.innerText = (response.message || "Unknown error");
            popUp.window.style.display = "flex";
            setTimeout(closePopup, 2500);
        }

    } catch (error) {
        console.error("Signup error:", error);
        popUp.top.innerText = "Signup failed ";
        popUp.bottom.innerText = "Network error";
        popUp.window.style.display = "flex";
        setTimeout(closePopup, 2500);
    }
}


// ============= Login ================
async function login() {
    const id = document.getElementById("loginId").value;
    const password = document.getElementById("loginPass").value;

    if (!id || !password) {
        popUp.top.innerText = "Warning";
        popUp.bottom.innerText = `${id ? (!password ? "Password is required." : ""):"ID is required "  }`;
    };

    try {
        const res = await fetch("http://localhost:5000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ id, password })
        });

        const response = await res.json();

        if (response.success) {
            localStorage.setItem("jssuser", id);
            await fetchAndStoreUser(id);

            if (loginpage) loginpage.style.display = "none";
            if (signuppage) signuppage.style.display = "none";
            if (body) body.style.backgroundColor = "#2e416a";

            dis_intro();

            const home = document.getElementById('home');
            if (home) home.style.display = 'block';

            // populate profile summary if available
            const userdata = response.datas || {};
            const profileContainer = document.getElementById('profileContainer');
            if (profileContainer) {
                const imgUrl = userdata.profileimg ? (userdata.profileimg.startsWith('http') ? userdata.profileimg : ('http://localhost:5000' + userdata.profileimg)) : '';
                profileContainer.innerHTML = `
                    <h3 style="margin-bottom:6px;">${userdata.name || id}</h3>
                    <div style="color:#cfd8f0;margin-bottom:8px;">${userdata.address || ''}</div>
                    ${imgUrl ? `<img src="${imgUrl}" alt="profile" style="width:120px;height:120px;border-radius:50%;object-fit:cover;"/>` : ''}
                `;
            }

        } else {
            popUp.top.innerText =
                "Login failed" ;
            popUp.bottom.innerText =  (response.message || "Unknown error");
            popUp.window.style.display = "flex";
            setTimeout(closePopup, 2500);
        }

    } catch (error) {
        popUp.top.innerText = "Login failed";
        popUp.bottom.innerText = "Network error";
        popUp.window.style.display = "flex";
        setTimeout(closePopup, 2500);
    }
}


// ---------------- Map logic ----------------


function openMap() {
    document.getElementById("mapBox").style.display = "block";
    if (map) return;

    map = L.map("mapBox").setView(SALEM, 13);

    const defaultTileUrl =
        (selectedMapType === 'satellite'
            ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");

    tileLayer = L.tileLayer(defaultTileUrl, {
        attribution: '&copy; OSM contributors'
    }).addTo(map);

    marker = L.marker(SALEM, { draggable: true }).addTo(map);
    setCoord(SALEM);

    marker.on("dragend", () => {
        const c = marker.getLatLng();
        setCoord([c.lat, c.lng]);
    });

    map.on("click", e => {
        marker.setLatLng(e.latlng);
        setCoord([e.latlng.lat, e.latlng.lng]);
    });
}

function setCoord(c) {
    document.getElementById("address_signup").value =
        c[0].toFixed(4) + ", " + c[1].toFixed(4);
}

async function fetchAndStoreUser(id) {
    try {
        const res = await fetch("http://localhost:5000/getUser/" + id);
        const data = await res.json();

        if (data.success) {
            userdata = data.user;
            return true;
        }else if(data.message === 'User not found'){
            console.log('User not found');
            // remove user from local storage 
            localStorage.removeItem("jssuser");
            return false;
        }
    } catch (err) {
        console.error("Failed to fetch user data:", err);
    }
}



// Toggle password visibility for signup (and fallback to login if signup field not present)
function togglePass() {
    const signupPass = document.getElementById('password_signup');
    const loginPass = document.getElementById('loginPass');
    const btn = document.getElementById('btnText-log');
    const el = signupPass || loginPass;
    if (!el) return;
    if (el.type === 'password') {
        el.type = 'text';
        if (btn) btn.textContent = '🔓';
    } else {
        el.type = 'password';
        if (btn) btn.textContent = '🔒';
    }
}


// show home screen and populate profile area
async function showHome() {
    
    const home = document.getElementById('home');
    document.getElementById("functionOdDiv").style.display = "none";
    if (loginpage) loginpage.style.display = 'none';
    if (signuppage) signuppage.style.display = 'none';
    if (intro) intro.style.display = 'none';
    if (profileScreen) profileScreen.style.display = 'none';
    if (body) {
        body.style.backgroundColor = '#2e416a';
        body.style.color = '#fff';
    }
    if (home) home.style.display = 'block';
    // populate profileContainer from stored userdata if present
    const profileContainer = document.getElementById('profileContainer');
    if (!userdata) {
        console.warn("Userdata not loaded");
        return;
    }
    // console.log(userdataStr);
    
    // Set profile image
    if (!profileContainer || userdata.profileimg === '') {
        document.getElementById("homescreenprofile").src = "https://cdn-icons-png.flaticon.com/512/847/847969.png";
    }else{
        document.getElementById("homescreenprofile").src ='http://localhost:5000' + userdata.profileimg;
    } 

    // bring back main interface elements and hide subordinate screens
    const bigBtn = document.getElementById("bigBtn");
    if (bigBtn) bigBtn.style.display = "flex";
    const bb = document.querySelector(".bottombar");
    if (bb) bb.style.display = "block";
    ["cartScreen", "profileScreen", "functionScreen", "billScreen"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });
    await check_order()
    if (orderPlaced) {
        show_order_animation();
    }else{
        cancel_order_animation();
    }

    if (document.body) document.body.style.backgroundColor = "#0c2132";
}

function showProfile() {
    document.getElementById("bigBtn").style.display = "none";
    document.querySelector(".bottombar").style.display = "none";
    document.getElementById("cartScreen").style.display = "none";
    document.getElementById("profileScreen").style.display = "block";
    document.getElementById("functionOdDiv").style.display = "none";
    document.body.style.backgroundColor = "#0c2132";

    if (!profileContainer || userdata.profileimg === '') {
        document.getElementById("homescreenprofile").src = "https://cdn-icons-png.flaticon.com/512/847/847969.png";
    }else{
        document.getElementById("homescreenprofile").src ='http://localhost:5000' + userdata.profileimg;
    }
    // Load userdata safely
    if (!userdata) return;

    // Split coordinates
    let lat = 11.5978;
    let lng = 77.9838;

    if (userdata.address) {
        const parts = userdata.address.split(",");
        lat = parseFloat(parts[0]);
        lng = parseFloat(parts[1]);
    }
    
    document.getElementById("profileContainer").innerHTML = `
        <img src="${userdata.profileimg ? 'http://localhost:5000' + userdata.profileimg : 'https://cdn-icons-png.flaticon.com/512/847/847969.png'}"
            alt="Profile Picture"
            style="width:120px;height:120px;border-radius:50%;margin-bottom:10px;">

        <h3>${userdata.name || "User"}</h3>
        <p>ID: <span>${userdata.id || "-"}</span></p>
        <p>Per Can Price: ₹<span>${userdata.percanprice || 35}</span></p>
        <p>Mobile: <span>${userdata.mobile || "-"}</span></p>   
        <p>Address</p>

        <div id="profileMap" style="width:100%;height:200px;border-radius:10px;margin:10px 0;"></div>

        
    `;

    // Create map (view only)
    const map = L.map('profileMap', {
        dragging: false,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: false,
        keyboard: false,
        zoomControl: true
    }).setView([lat, lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    L.marker([lat, lng]).addTo(map);
}



async function showCart() {

    document.getElementById("bigBtn").style.display = "none";
    document.querySelector(".bottombar").style.display = "none";
    document.getElementById("cartScreen").style.display = "block";
    document.getElementById("profileScreen").style.display = "none";
    document.getElementById("functionOdDiv").style.display = "none";

    const main = document.getElementById("cartBox");
    main.innerHTML = "";

    try {
        const response = await fetch(`http://localhost:5000/getCart/${userdata.id}`);
        const data = await response.json();

        if (!data.success) {
            main.innerHTML = "<p>No orders found</p>";
            return;
        }

        const orders = data.data || [];

        if (orders.length === 0) {
            main.innerHTML = "<p>Your cart is empty</p>";
            return;
        }

        orders.reverse(); // latest first

        orders.forEach(order => {

            const orderDiv = document.createElement("div");
            orderDiv.className = "orderCard";
            orderDiv.style.background = "#1e1e1e";
            orderDiv.style.margin = "10px";
            orderDiv.style.padding = "15px";
            orderDiv.style.borderRadius = "10px";
            orderDiv.style.cursor = "pointer";
            orderDiv.style.color = "white";

            // status color
            let statusColor = "#ffaa00";
            if (order.status === "delivered") statusColor = "#00ff88";
            if (order.status === "cancelled") statusColor = "#ff4444";

            orderDiv.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:1.2em;font-weight:bold;">
                        ${order.items ? "Function Order" : "Water Can Order"}
                    </span>
                    <span style="color:${statusColor};font-weight:600;">
                        ${order.status || "pending"}
                    </span>
                </div>

                <br>

                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <p>Ordered: ${new Date(order.created_at).toLocaleDateString()}</p>
                    <p>Delivery: ${order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : "N/A"}</p>
                </div>

                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <p style="margin-top:10px;">
                        Total Amount: ₹${order.total_amount}
                        ${order.payment_status === "paid" ? "✔️ paid" : ""}
                    </p>

                    ${["delivered", "cancelled"].includes(order.status) ? "" : `
                        <button class="cancelOrderBtn"
                            style="
                                background:#00d8ff;
                                border:none;
                                color:black;
                                font-size:14px;
                                border-radius:5px;
                                padding:6px 12px;
                                cursor:pointer;
                                font-weight:600;
                            ">
                            Cancel Order
                        </button>
                    `}
                </div>
            `;

            const cancelBtn = orderDiv.querySelector(".cancelOrderBtn");

            if (cancelBtn) {
                cancelBtn.onclick = (e) => {
                    e.stopPropagation();

                    popUp.top.innerText = "Cancel Order?";
                    popUp.bottom.innerHTML = `
                        <div style="text-align:center;">
                            <p>Are you sure you want to cancel this order?</p>
                            <div style="display:flex;gap:10px;justify-content:center;margin-top:15px;">
                                <button id="confirmCancelBtn"
                                    style="background:#ff4d4d;border:none;color:white;border-radius:5px;padding:6px 14px;cursor:pointer;">
                                    Yes
                                </button>
                                <button id="closeCancelBtn"
                                    style="background:#555;border:none;color:white;border-radius:5px;padding:6px 14px;cursor:pointer;">
                                    No
                                </button>
                            </div>
                        </div>
                    `;

                    popUp.window.style.display = "flex";

                    document.getElementById("confirmCancelBtn").onclick = async () => {

                        try {
                            const res = await fetch("http://localhost:5000/cancelOrder", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    order_id: order.order_id,
                                    user_id: userdata.id
                                })
                            });

                            const result = await res.json();

                            if (result.success) {

                                closePopup();

                                // 🔥 IMPORTANT FIX
                                await check_order();  // re-check backend status

                                if (!orderPlaced) {
                                    cancel_order_animation();  // restore red button
                                }

                                showCart();

                            } else {
                                popUp.top.innerText = "Error";
                                popUp.bottom.innerText = result.message || "Cancel failed";
                                setTimeout(closePopup, 2500);
                            }

                        } catch (err) {
                            popUp.top.innerText = "Network Error";
                            popUp.bottom.innerText = "Please try again";
                            setTimeout(closePopup, 2500);
                        }
                    };

                    document.getElementById("closeCancelBtn").onclick = closePopup;
                };
            }


            // Click card → popup
            orderDiv.onclick = () => showOrderPopup(order);

            main.appendChild(orderDiv);
        });

    } catch (error) {
        console.error("Cart fetch error:", error);
        main.innerHTML = "<p>Error loading cart</p>";
    }
}



function showOrderPopup(order) {

    // Overlay
    const popup = document.createElement("div");
    popup.style.position = "fixed";
    popup.style.top = "0";
    popup.style.left = "0";
    popup.style.width = "100%";
    popup.style.height = "100%";
    popup.style.background = "rgba(0,0,0,0.7)";
    popup.style.display = "flex";
    popup.style.alignItems = "center";
    popup.style.justifyContent = "center";
    popup.style.zIndex = "9999";
    popup.style.backdropFilter = "blur(5px)";
    popup.style.animation = "fadeIn 0.3s ease";

    // Main Box
    const box = document.createElement("div");
    box.style.background = "linear-gradient(135deg, #1e1e2f, #2c2c3f)";
    box.style.padding = "25px";
    box.style.borderRadius = "18px";
    box.style.color = "white";
    box.style.width = "350px";
    box.style.maxHeight = "80vh";
    box.style.overflowY = "auto";
    box.style.boxShadow = "0 10px 30px rgba(0,0,0,0.6)";
    box.style.animation = "slideUp 0.3s ease";

    // Header
    let itemsHtml = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
            <h2 style="margin:0;font-size:18px;color:#00d8ff;">🧾 Order Details</h2>
            <button id="closePopupBtn"
                style="
                    background:#ff4d4d;
                    border:none;
                    color:white;
                    border-radius:50%;
                    width:28px;
                    height:28px;
                    cursor:pointer;
                    font-weight:bold;
                ">×</button>
        </div>
        <p style="font-size:13px;color:#bbb;margin-top:-8px;">
            Delivery: ${order.delivery_date}
        </p>
        <hr style="border:0;border-top:1px solid #444;margin:10px 0;">
    `;

    // Items
    if (order.items) {
    order.items.forEach(item => {
        itemsHtml += `
            <div style="
                background:#2f2f45;
                padding:12px;
                border-radius:12px;
                margin-bottom:10px;
                box-shadow:0 4px 10px rgba(0,0,0,0.3);
            ">
                <div style="font-size:14px;">
                    💧 <b>${item.size} ml</b>
                </div>
                <div style="font-size:13px;color:#ccc;margin-top:4px;">
                    Qty: ${item.quantity}
                </div>
                <div style="font-size:13px;color:#ccc;">
                    Unit: ₹${item.unit_price}
                </div>
                <div style="font-size:14px;margin-top:4px;color:#00ff99;">
                    Total: ₹${item.total}
                </div>
            </div>
        `;
    });
    }else{
        itemsHtml += `
            <div style="
                background:#2f2f45;
                padding:12px;
                border-radius:12px;
                margin-bottom:10px;
                box-shadow:0 4px 10px rgba(0,0,0,0.3);
            ">
                <div style="font-size:14px;">
                    🧾 <b>Water Can</b>
                </div>
                <div style="font-size:13px;color:#ccc;">
                    Unit: ₹${userdata.percanprice}
                </div>
                <div style="font-size:14px;margin-top:4px;color:#00ff99;">
                    Total: ₹${order.total_amount}
                </div>
            </div>
        `;
    }
    // Footer Total
    itemsHtml += `
        <hr style="border:0;border-top:1px solid #444;margin:12px 0;">
        <h3 style="text-align:right;color:#00d8ff;margin:0;">
            Grand Total: ₹${order.total_amount}
        </h3>
    `;

    box.innerHTML = itemsHtml;

    // Prevent closing when clicking inside box
    box.onclick = (e) => e.stopPropagation();

    // Close on overlay click
    popup.onclick = () => popup.remove();

    popup.appendChild(box);
    document.body.appendChild(popup);

    // Close button action
    document.getElementById("closePopupBtn").onclick = () => popup.remove();

    // Animation styles (inject once)
    if (!document.getElementById("popupAnimations")) {
        const style = document.createElement("style");
        style.id = "popupAnimations";
        style.innerHTML = `
            @keyframes fadeIn {
                from { opacity:0; }
                to { opacity:1; }
            }
            @keyframes slideUp {
                from { transform:translateY(30px); opacity:0; }
                to { transform:translateY(0); opacity:1; }
            }
        `;
        document.head.appendChild(style);
    }
}


function openFunctionOrder() {
    document.getElementById("bigBtn").style.display = "none";
    document.querySelector(".bottombar").style.display = "none";

    let main = document.getElementById("functionOdDiv");
    main.style.display = "flex";
    main.innerHTML = "";

    const functionList = document.createElement("div");
    functionList.style.width = "100%";

    let quantities = {};
    let qtyInputs = {};

    fetch("http://localhost:5000/funlist")
        .then(res => res.json())
        .then(data => {
            if (!data.success) return;

            const items = data.data || {};

            // Create table
            const table = document.createElement("table");
            table.style.width = "100%";
            table.style.borderCollapse = "collapse";
            table.style.textAlign = "center";

            // Header
            const header = document.createElement("tr");
            header.innerHTML = `
                <th style="border:1px solid #ccc;padding:10px;">Size</th>
                <th style="border:1px solid #ccc;padding:10px;">Available</th>
                <th style="border:1px solid #ccc;padding:10px;">Quantity</th>
            `;
            table.appendChild(header);

            function updateResetVisibility() {
                const totalAmount = Object.keys(quantities)
                    .reduce((sum, size) =>
                        sum + (quantities[size] || 0) * (items_price[size] || 0), 0);

                document.getElementById("totalAmountDisplay").textContent =
                    `Total: ₹${totalAmount}`;

                const totalQty = Object.values(quantities)
                    .reduce((a, b) => a + (b || 0), 0);

                reset.style.display = totalQty > 0 ? "inline-block" : "none";
            }

            // Create rows
            Object.keys(items).forEach(size => {
                const row = document.createElement("tr");

                // Size column
                const sizeCell = document.createElement("td");
                if (size === "100") sizeCell.textContent = "100ml";
                else if (size === "200") sizeCell.textContent = "200ml";
                else if (size === "300") sizeCell.textContent = "300ml";
                else if (size === "500") sizeCell.textContent = "500ml";
                else if (size === "1000") sizeCell.textContent = "1L";
                else if (size === "2000") sizeCell.textContent = "2L";
                else if (size === "20000") sizeCell.textContent = "20L";
                sizeCell.style.border = "1px solid #6f4f4f";
                sizeCell.style.padding = "10px";

                // Availability column
                const availCell = document.createElement("td");
                availCell.textContent = items[size] ? "Available" : "Out of Stock";
                availCell.style.border = "1px solid #6f4f4f";
                availCell.style.padding = "10px";
                availCell.style.color = items[size] ? "green" : "red";

                // Quantity column
                const qtyCell = document.createElement("td");
                qtyCell.style.border = "1px solid #6f4f4f";
                qtyCell.style.padding = "10px";

                const minus = document.createElement("button");
                minus.textContent = "-";
                minus.style.marginRight = "5px";
                minus.style.width = "20px";
                minus.style.backgroundColor = "#113b5d00";
                minus.style.color = "#ffffff";
                minus.disabled = items[size] ? false : true;

                const qtyDisplay = document.createElement("input");
                qtyDisplay.type = "number";
                qtyDisplay.value = 0;
                qtyDisplay.min = 0;
                qtyDisplay.onchange = () => {
                    const value = parseInt(qtyDisplay.value);
                    if (value >= 0) {
                        quantities[size] = value;
                        updateResetVisibility();
                    }
                };
                qtyDisplay.style.width = "50px";
                qtyDisplay.style.border = "none";
                qtyDisplay.style.backgroundColor = "#f0f0f000";
                qtyDisplay.style.color = "#ffffff";
                qtyDisplay.style.textAlign = "center";
                // qtyDisplay.readOnly = true;
                qtyDisplay.disabled = items[size] ? false : true;

                const plus = document.createElement("button");
                plus.textContent = "+";
                plus.style.marginLeft = "5px";
                plus.style.width = "20px";
                plus.style.backgroundColor = "#113b5d00";
                plus.style.color = "#ffffff";
                plus.disabled = items[size] ? false : true;
                // Initialize quantity
                quantities[size] =
                    (selectedItems.find(i => i.name === size) || {}).quantity || 0;
                qtyDisplay.value = quantities[size];
                qtyInputs[size] = qtyDisplay;

                minus.onclick = () => {
                    if (quantities[size] > 0) {
                        quantities[size]--;
                        qtyDisplay.value = quantities[size];
                        updateResetVisibility();
                    }
                };

                plus.onclick = () => {
                    quantities[size]++;
                    qtyDisplay.value = quantities[size];
                    updateResetVisibility();
                };

                qtyCell.appendChild(minus);
                qtyCell.appendChild(qtyDisplay);
                qtyCell.appendChild(plus);

                row.appendChild(sizeCell);
                row.appendChild(availCell);
                row.appendChild(qtyCell);

                table.appendChild(row);
            });

            functionList.appendChild(table);

            // total amount display
            const totalDisplay = document.createElement("div");
            totalDisplay.id = "totalAmountDisplay";
            totalDisplay.style.marginTop = "15px";
            totalDisplay.style.paddingRight = "30px";
            totalDisplay.style.textAlign = "right";
            totalDisplay.style.color = "#ffffff";
            totalDisplay.style.fontSize = "24px";
            totalDisplay.style.fontWeight = "bold";
            totalDisplay.textContent = "Total: ₹0";
            totalDisplay.style.textShadow = "2px 2px 4px #000000aa";
            functionList.appendChild(totalDisplay);



            // Buttons container
            const btnContainer = document.createElement("div");
            btnContainer.style.marginTop = "20px";
            btnContainer.style.display = "flex";
            btnContainer.style.gap = "20px";
            btnContainer.style.justifyContent = "end";

            // Continue button
            const continueBtn = document.createElement("button");
            continueBtn.textContent = "Continue";
            continueBtn.style.padding = "10px 20px";
            continueBtn.style.marginRight = "10px";
            continueBtn.style.backgroundColor = "#0e692eca";
            continueBtn.style.color = "#ffffff";

            continueBtn.onclick = () => {
                selectedItems = [];

                Object.keys(quantities).forEach(size => {
                    if (quantities[size] > 0) {
                        selectedItems.push({
                            name: size,
                            quantity: quantities[size]
                        });
                    }
                });
                bill();
            };

            // Reset button
            const reset = document.createElement("button");
            reset.textContent = "Reset";
            reset.style.padding = "10px 20px";
            reset.style.backgroundColor = "#ff4d4d";
            reset.style.color = "#fff";

            reset.onclick = () => {
                selectedItems = [];

                Object.keys(quantities).forEach(size => {
                    quantities[size] = 0;
                    if (qtyInputs[size]) {
                        qtyInputs[size].value = 0;
                    }
                });

                updateResetVisibility();
            };
            btnContainer.appendChild(reset);
            btnContainer.appendChild(continueBtn);
            

            functionList.appendChild(btnContainer);
            main.appendChild(functionList);

            // Initial state
            updateResetVisibility();
        });
}


function bill() {
    let totalItems = 0;
    for (let item of selectedItems) {
        totalItems += item.quantity;
    }

    if (totalItems === 0) {
        popUp.top.innerText = "Warning";
        popUp.bottom.innerText = "Please select items to proceed";
        popUp.window.style.display = "flex";
        setTimeout(closePopup, 2500);
        return;
    }

    document.getElementById("functionOdDiv").style.display = "none";
    document.getElementById("billScreen").style.display = "block";

    const billDetails = document.getElementById("billDetails");
    billDetails.innerHTML = ""; // clear old content

    const items_price = {
        "200": 100,
        "300": 130,
        "500": 140,
        "1000": 150,
        "2000": 140,
        "20000": userdata?.percanprice || 35
    };

    const sizeLabels = {
        "200": "200ml",
        "300": "300ml",
        "500": "500ml",
        "1000": "1L",
        "2000": "2L",
        "20000": "20L"
    };

    // ---------- Table ----------
    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.style.textAlign = "center";

    const header = document.createElement("tr");
    header.innerHTML = `
        <th style="border:1px solid #ccc;padding:10px;">Item</th>
        <th style="border:1px solid #ccc;padding:10px;">Quantity</th>
        <th style="border:1px solid #ccc;padding:10px;">Price</th>
    `;
    table.appendChild(header);

    let totalPrice = 0;

    for (let item of selectedItems) {
        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        nameCell.textContent = sizeLabels[item.name] || item.name;
        nameCell.style.border = "1px solid #6f4f4f";
        nameCell.style.padding = "10px";

        const qtyCell = document.createElement("td");
        qtyCell.textContent = item.quantity + " X "+`₹${items_price[item.name] }`;
        qtyCell.style.border = "1px solid #6f4f4f";
        qtyCell.style.padding = "10px";

        const price = item.quantity * items_price[item.name];

        const priceCell = document.createElement("td");
        priceCell.textContent = `₹${price}`;
        priceCell.style.border = "1px solid #6f4f4f";
        priceCell.style.padding = "10px";

        totalPrice += price;

        row.appendChild(nameCell);
        row.appendChild(qtyCell);
        row.appendChild(priceCell);
        table.appendChild(row);
    }

    // total row
    const totalRow = document.createElement("tr");

    const totalLabel = document.createElement("td");
    totalLabel.textContent = "Total";
    totalLabel.colSpan = 2;
    totalLabel.style.border = "1px solid #6f4f4f";
    totalLabel.style.padding = "10px";
    totalLabel.style.fontWeight = "bold";

    const totalCell = document.createElement("td");
    totalCell.textContent = `₹${totalPrice}`;
    totalCell.style.border = "1px solid #6f4f4f";
    totalCell.style.padding = "10px";
    totalCell.style.fontWeight = "bold";

    totalRow.appendChild(totalLabel);
    totalRow.appendChild(totalCell);
    table.appendChild(totalRow);

    billDetails.appendChild(table);

    // ---------- Delivery Date ----------
    const deliveryInput = document.createElement("input");
    deliveryInput.type = "date";
    deliveryInput.style.marginTop = "15px";
    deliveryInput.style.padding = "10px";

    const today = new Date().toISOString().split("T")[0];
    deliveryInput.value = today;

    

    // ---------- Confirm Button ----------
    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = "Confirm Order";
    confirmBtn.style.display = "block";
    confirmBtn.style.marginTop = "15px";
    confirmBtn.style.padding = "10px 20px";
    confirmBtn.style.backgroundColor = "#0e692eca";
    confirmBtn.style.color = "#ffffff";
    confirmBtn.style.border = "none";
    confirmBtn.style.cursor = "pointer";

    confirmBtn.onclick = () => {
        
        const order = {
            user: userdata,
            items: selectedItems,
            deliveryDate: deliveryInput.value
        };
        // send order to server /placeOrder

        fetch("http://localhost:5000/placeOrder", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(order)
        })
           .then(res => res.json())
           .then(data => {
                if (!data.success) {
                    popUp.top.innerText = "Error";
                    popUp.bottom.innerText = data.message;
                    popUp.window.style.display = "flex";
                    setTimeout(closePopup, 2500);
                    return;
                }
                popUp.top.innerText = "Success";
                popUp.bottom.innerText = "Order placed successfully";
                popUp.window.style.display = "flex";
                setTimeout(closePopup, 2500);
            })
           .catch(err => {
                console.error(err);
                popUp.top.innerText = "Error";
                popUp.bottom.innerText = "Failed to place order. Please try again later";
                popUp.window.style.display = "flex";
                setTimeout(closePopup, 2500);
            });

        console.log("Order confirmed:", order);

        orderPlaced = true;

        document.getElementById("billScreen").style.display = "none";
        document.getElementById("bigBtn").style.display = "block";
        document.querySelector(".bottombar").style.display = "flex";
        document.getElementById("cartScreen").style.display = "none";
        document.getElementById("profileScreen").style.display = "none";


        showCart();
    };
    let oder_confirm_div = document.createElement("div");
    oder_confirm_div.style.textAlign = "center";
    oder_confirm_div.style.display = "flex";
    oder_confirm_div.style.flexDirection = "row";
    oder_confirm_div.style.justifyContent = "center";
    oder_confirm_div.style.alignItems = "center";
    oder_confirm_div.style.marginTop = "15px";
    oder_confirm_div.style.gap = "30px";

    oder_confirm_div.appendChild(deliveryInput);
    oder_confirm_div.appendChild(confirmBtn);
    billDetails.appendChild(oder_confirm_div);


}

// ---------------- Popup ----------------
function closePopup() {
    popUp.window.style.display = "none";
}


// ---------------- DOM Ready ----------------
window.addEventListener("DOMContentLoaded", function () {
    body = document.body;
    intro = document.getElementsByClassName("cd-intro")[0];
    jssuser = localStorage.getItem("jssuser");
    loginpage = document.getElementById("login");
    signuppage = document.getElementById("signup");
    profileScreen = document.getElementById("profileScreen");

    popUp = {
        window: document.getElementById("popupwindow"),
        top: document.getElementById("popupTop"),
        bottom: document.getElementById("popupBottom")
    };

    power_on();

    // New user button
    const newUserBtn = document.getElementById("newUserOnlogin");
    if (newUserBtn) {
        newUserBtn.addEventListener("click", async () => {
            loginpage.style.display = "none";
            signuppage.style.display = "flex";

            const idInput = document.getElementById("newwwid");
            idInput.value = "Loading...";

            try {
                const res = await fetch("http://localhost:5000/getNewId");
                const data = await res.json();
                idInput.value = data.newId;
            } catch {
                idInput.value = "Error";
            }
        });
    }

    // Profile image upload for signup: click image -> open file picker
    const profileImg = document.getElementById('profile_img_on_signup');
    const profileInput = document.getElementById('profile_upload_input');
    if (profileImg && profileInput) {
        profileImg.addEventListener('click', () => profileInput.click());
        profileInput.addEventListener('change', (e) => {
            const f = e.target.files && e.target.files[0];
            if (f) {
                // store file for upload
                selectedProfileFile = f;
                // preview
                if (profilePreviewUrl) URL.revokeObjectURL(profilePreviewUrl);
                profilePreviewUrl = URL.createObjectURL(f);
                profileImg.src = profilePreviewUrl;
            }
        });
    }

    // Map type radio controls (attach early so selection works before map open)
    const mapRadios = document.getElementsByName('mapType');
    if (mapRadios) {
        mapRadios.forEach(r => {
            // reflect initial UI selection
            if (r.checked) selectedMapType = r.value;
            r.addEventListener('change', () => {
                selectedMapType = r.value;
                // if map is already initialized, switch tiles immediately
                if (tileLayer) {
                    const url = (selectedMapType === 'satellite')
                        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
                    tileLayer.setUrl(url);
                }
            });
        });
    }

    // Old user button
    const oldUserBtn = document.getElementById("olduseronSignup");
    if (oldUserBtn) {
        oldUserBtn.addEventListener("click", () => {
            signuppage.style.display = "none";
            loginpage.style.display = "flex";
        });
    }

    // Click-to-copy ID
    const idInput = document.getElementById("newwwid");
    if (idInput) {
        idInput.addEventListener("click", () => {
            idInput.select();
            navigator.clipboard.writeText(idInput.value);
        });
    }

    // Close popup on background click
    if (popUp.window) {
        popUp.window.addEventListener("click", (e) => {
            const content =
                popUp.window.querySelector(".popupcontent");
            if (!content.contains(e.target)) closePopup();
        });
    }

    // initialize slider images (version-1 behavior) using global imageList
    const track = document.getElementById("slideTrack");
    if (track) {
        imageList.forEach(src => {
            const img = document.createElement("img");
            img.src = src;
            track.appendChild(img);
        });
        const firstClone = document.createElement("img");
        firstClone.src = imageList[0];
        track.appendChild(firstClone);
        let index = 0;
        setInterval(() => {
            index++;
            track.style.transform = `translateX(-${index * 100}%)`;
            if (index === imageList.length) {
                setTimeout(() => {
                    track.style.transition = "none";
                    track.style.transform = "translateX(0)";
                    index = 0;
                    setTimeout(() => {
                        track.style.transition = "transform 0.6s ease";
                    }, 50);
                }, 600);
            }
        }, 2500);
    }
    check_order();
});

async function check_order() {
    try {
        const res = await fetch(`http://localhost:5000/getCart/${jssuser}`);
        const data = await res.json();

        const orders = data.data || [];

        orderPlaced = orders.some(order =>
            order.status !== "cancelled" &&
            order.status !== "delivered"
        );

    } catch (err) {
        console.error("Order check failed:", err);
        orderPlaced = false;
    }
}

function show_order_animation(){
    const bigBtn = document.getElementById("bigBtn");
    const content = document.getElementById("btnContent");

    bigBtn.style.backgroundColor = "#0070ff";
    bigBtn.style.color = "white";
    bigBtn.classList.add("loader");

    content.innerHTML = `
        <div class="truck-box">
            <img width="100%" height="50px" src="https://cdnl.iconscout.com/lottie/premium/thumb/delivery-man-drive-delivery-truck-animation-gif-download-7480788.gif">
            <div>Order Placed</div>
        </div>
    `;
}

function cancel_order_animation(){
    
    // <div id="bigBtn" class="big-btn" onclick="handleBigBtn()">
    //     <div id="btnContent">
    //         <div id="btnText">Need Water</div>
    //     </div>
    // </div>
    const bigBtn = document.getElementById("bigBtn");
    const content = document.getElementById("btnContent");

    bigBtn.style.backgroundColor = "#ff0000";
    bigBtn.style.color = "white";
    bigBtn.classList.remove("loader");
    content.innerHTML = `
        <div id="btnText">Need Water</div>
    `;
}
    


// ===== ordering & cart logic from version-1 =====

let functionProducts = imageList.map((src, i) => ({
    name: ["300ml", "500ml", "1L", "2L", "20L"][i] || "",
    price: [10,15,20,30,40][i] || 0,
    img: src
}));

function handleBigBtn() {
    if (orderPlaced) {
        // navigate to cart
        showCart();
        return;
    }

    // create popup
    let new_pop_up = document.createElement("div");
    new_pop_up.classList.add("new_pop_up");

    new_pop_up.innerHTML = `
        <div class="pop_up_content">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <h2>Confirm Order</h2>
            </div>

            <div style="display:flex;justify-content:center;gap:10px;margin-bottom:15px;">
                <button id="qtyMinus">-</button>
                <input id="qtyInput" type="number" value="1" min="1" style="width:40px;text-align:center;">
                <button id="qtyPlus">+</button>
            </div>

            <div style="display:flex;gap:10px;justify-content:flex-end;">
                <button class="close_pop_up">Cancel</button>
                <button class="confirm_pop_up">Confirm</button>
            </div>
        </div>
    `;

    document.body.appendChild(new_pop_up);

    const qtyInput = new_pop_up.querySelector("#qtyInput");

    // quantity controls
    new_pop_up.querySelector("#qtyMinus").onclick = () => {
        let v = parseInt(qtyInput.value) || 1;
        if (v > 1) qtyInput.value = v - 1;
    };

    new_pop_up.querySelector("#qtyPlus").onclick = () => {
        let v = parseInt(qtyInput.value) || 1;
        qtyInput.value = v + 1;
    };

    // cancel button
    new_pop_up.querySelector(".close_pop_up").onclick = () => {
        new_pop_up.remove();
    };

    // confirm button
    new_pop_up.querySelector(".confirm_pop_up").onclick = async () => {
        const qty = parseInt(qtyInput.value) || 1;

        await fetch("http://localhost:5000/waterBottleOrder", {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({
                user: jssuser,
                quantity: qty
            })
        });

        new_pop_up.remove();
        orderPlaced = true;

        // show animation
        show_order_animation();
    };

    // click outside closes popup
    new_pop_up.addEventListener("click", (e) => {
        if (e.target === new_pop_up) {
            new_pop_up.remove();
        }
    });
}

function openPopup() {
    const ov = document.getElementById("popupOverlay");
    if (ov) ov.classList.add("active");
}
