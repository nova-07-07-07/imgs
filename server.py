from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import json
import os
from datetime import datetime
import random

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

ORDERS_FILE = "orders.json"
# "100" : 80,
ITEM_PRICES = {
    "100" : 80,
    "200": 100,
    "300": 130,
    "500": 140,
    "1000": 150,
    "2000": 140,
    "20000": 35   
}

function_order_items = {
    "100" : False,
    "200":False,
    "300":True,
    "500":False,
    "1000":False,
    "2000":False,
    "20000":True
}

# Storage for users
users_db = {}
USERS_FILE = "users.json"
mobile_otp = {}
# Folder to store uploaded profile images
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Allowed image extensions
ALLOWED_EXT = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXT


# -------------------------------------------------
# Utility Functions
# -------------------------------------------------

def generate_4_digit():
    """Generate unique 4-digit ID"""
    while True:
        new_id = str(random.randint(1000, 9999))
        if new_id not in users_db:
            return new_id

def load_users():
    global users_db
    if not os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'w') as f:
            json.dump({'users': {}}, f, indent=2)

    try:
        with open(USERS_FILE, 'r') as f:
            data = json.load(f)
            users_db = data.get('users', {})
        print("Users loaded successfully.")
    except Exception as e:
        print("Error loading users:", e)
        users_db = {}

def save_users():
    try:
        temp_file = USERS_FILE + ".tmp"
        with open(temp_file, 'w') as f:
            json.dump({'users': users_db}, f, indent=2)
        os.replace(temp_file, USERS_FILE)
        print("Users saved successfully.")
    except Exception as e:
        print("Error saving users:", e)

# -------------------------------------------------
# Routes
# -------------------------------------------------

@app.route('/signup', methods=['POST'])
def signup():
    """Signup endpoint accepts multipart/form-data so a profile image can be uploaded.
    Expected form fields: id, name, password, address (optional), profileimg (file optional)
    """
    # If request contains files, use form fields; otherwise try JSON
    if request.content_type and request.content_type.startswith('multipart/form-data'):
        form = request.form
        files = request.files
        user_id = form.get('id')
        name = form.get('name')
        password = form.get('password')
        address = form.get('address')
        profile_file = files.get('profileimg')
        mobile = form.get('mobile')
        otp = form.get('otp')
    else:
        data = request.get_json() or {}
        user_id = data.get('id')
        name = data.get('name')
        password = data.get('password')
        address = data.get('address')
        profile_file = None
        mobile = data.get('mobile')
        otp = data.get('otp')


    if not user_id or not name or not password:
        return jsonify({
            'success': False,
            'message': 'ID, name, and password required'
        }), 400

    if user_id in users_db:
        return jsonify({
            'success': False,
            'message': 'User ID already exists'
        }), 409

    profile_url = ''
    if profile_file and profile_file.filename and allowed_file(profile_file.filename):
        from datetime import datetime, UTC
        filename = secure_filename(f"{user_id}_{int(datetime.now(UTC).timestamp())}_{profile_file.filename}")
        save_path = os.path.join(UPLOAD_FOLDER, filename)
        profile_file.save(save_path)
        # public URL path
        profile_url = f"/uploads/{filename}"

    from datetime import datetime, UTC, timedelta

    otp_data = mobile_otp.get(mobile)

    if not otp_data:
        return jsonify({'success': False, 'message': 'OTP not requested'}), 400

    # check expiry (5 minutes)
    created = datetime.fromisoformat(otp_data["created_at"])
    if datetime.now(UTC) - created > timedelta(minutes=5):
        mobile_otp.pop(mobile, None)
        return jsonify({'success': False, 'message': 'OTP expired'}), 400

    # check OTP value
    if otp_data["otp"] != otp:
        return jsonify({'success': False, 'message': 'Invalid OTP'}), 400

    # OTP valid → remove it
    mobile_otp.pop(mobile, None)

    with open('temp.json', 'w') as f:
        json.dump(mobile_otp, f, indent=2)




    users_db[user_id] = {
        'name': name,
        'password': password,
        'percanprice': 35,  
        'address': address or '',
        'profileimg': profile_url,
        'created_at': datetime.now().isoformat(),
        'mobile': mobile
    }

    save_users()

    print(f"User {name} registered successfully.")

    return jsonify({
        'success': True,
        'message': f'User {name} registered successfully',
        'userId': user_id,
        'name': name,
        'address': address,
        'mobile': mobile,
        'percanprice': 35,
        'profileimg': profile_url
    }), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data:
        return jsonify({'success': False, 'message': 'Invalid fields'}), 400

    user_id = data.get('id')
    password = data.get('password')

    if not user_id or not password:
        return jsonify({
            'success': False,
            'message': 'ID and password required'
        }), 400

    if user_id not in users_db:
        return jsonify({
            'success': False,
            'message': 'User not found'
        }), 404

    if users_db[user_id]['password'] != password:
        return jsonify({
            'success': False,
            'message': 'Invalid password'
        }), 401

    user = users_db[user_id]
    return jsonify({
        'success': True,
        'message': 'Login successful',
        'datas': {
        'id': user_id,
        'name': user.get('name'),
        'address': user.get('address', ''),
        'profileimg': user.get('profileimg', ''),
        'mobile': user.get('mobile', ''),
        'percanprice': user.get('percanprice', 35)
    }
    }), 200

@app.route('/getNewId', methods=['GET'])
def get_new_id():
    new_id = generate_4_digit()
    return jsonify({
        'success': True,
        'newId': new_id
    }), 200

@app.route('/getUser/<user_id>', methods=['GET'])
def get_user(user_id):
    if user_id not in users_db:
        return jsonify({'success': False, 'message': 'User not found'}), 404

    user = users_db[user_id]

    return jsonify({
        'success': True,
        'user': {
            'id': user_id,
            'name': user.get('name'),
            'address': user.get('address'),
            'mobile': user.get('mobile'),
            'percanprice': user.get('percanprice', 35),
            'profileimg': user.get('profileimg')
        }
    }), 200

@app.route('/uploads/<path:filename>', methods=['GET'])
def uploaded_file(filename):
    """Serve uploaded profile images."""
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'Server is running'}), 200

@app.route('/sendOtp', methods=['POST'])
def send_otp():
    try:
        data = request.get_json()
        if not data or 'mobile' not in data:
            return jsonify({'success': False, 'message': 'Mobile number required'}), 400

        mobile = data['mobile']

        # validate mobile
        if not mobile.isdigit() or len(mobile) != 10:
            return jsonify({'success': False, 'message': 'Invalid mobile number'}), 400

        # check already registered
        for user in users_db.values():
            if user.get('mobile') == mobile:
                return jsonify({'success': False, 'message': 'Mobile already registered'}), 409

        # generate OTP
        otp = str(random.randint(1000, 9999))
        from datetime import datetime, UTC
        # store OTP properly
        mobile_otp[mobile] = {
            "otp": otp,
            "created_at": datetime.now(UTC).isoformat()
        }

        # save to file safely
        with open('temp.json', 'w') as f:
            json.dump(mobile_otp, f, indent=2)

        print(f"OTP for {mobile}: {otp}")  # simulate SMS

        return jsonify({'success': True}), 200

    except Exception as e:
        print("OTP error:", e)
        return jsonify({'success': False, 'message': 'Server error'}), 500

@app.route('/funlist', methods=['GET'])
def funlist():
    return jsonify({'success': True, 'data' : function_order_items}),200

@app.route('/placeOrder', methods=['POST'])
def place_order():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'Invalid order data'}), 400

        user_info = data.get('user')
        items = data.get('items')
        delivery_date = data.get('deliveryDate')

        if not user_info or not items:
            return jsonify({'success': False, 'message': 'Missing user or items'}), 400

        total_amount = 0
        validated_items = []

        # 🔒 Validate and calculate
        for item in items:
            size = str(item.get("name"))
            quantity = int(item.get("quantity", 0))

            if size not in ITEM_PRICES:
                return jsonify({'success': False, 'message': f'Invalid item size: {size}'}), 400

            if quantity <= 0:
                continue  # skip invalid quantity

            item_price = ITEM_PRICES[size]
            item_total = item_price * quantity

            total_amount += item_total

            validated_items.append({
                "size": size,
                "quantity": quantity,
                "unit_price": item_price,
                "total": item_total
            })

        if total_amount == 0:
            return jsonify({'success': False, 'message': 'No valid items selected'}), 400

        new_order = {
            "order_id": int(datetime.now().timestamp()),
            "user": user_info,
            "items": validated_items,
            "delivery_date": delivery_date,
            "total_amount": total_amount,
            "created_at": datetime.now().isoformat(),
            "status": "pending",
            "payment_status": "pending",
            "payment_method": "cash",
            "paid_amount" : 0
        }

        # Load existing orders
        if os.path.exists(ORDERS_FILE):
            with open(ORDERS_FILE, "r") as f:
                try:
                    orders = json.load(f)
                except:
                    orders = []
        else:
            orders = []

        orders.append(new_order)

        # Save back
        with open(ORDERS_FILE, "w") as f:
            json.dump(orders, f, indent=4)

        return jsonify({
            'success': True,
            'message': 'Order placed successfully',
            'total_amount': total_amount,
            'order_id': new_order["order_id"]
        }), 200

    except Exception as e:
        print("Order error:", e)
        return jsonify({'success': False, 'message': 'Server error'}), 500

@app.route('/getCart/<user_id>', methods=['GET'])
def get_cart(user_id):
    try:

        if os.path.exists("orders.json"):
            with open("orders.json", "r") as f:
                orders = json.load(f)
        else:
            orders = []


        # filter orders for this user
        user_cart = [
            order for order in orders
            if order.get("user", {}).get("id") == user_id
        ]

        return jsonify({
            "success": True,
            "data": user_cart
        })

    except Exception as e:
        print("Cart error:", e)
        return jsonify({"success": False}), 500
    
@app.route('/waterBottleOrder', methods=['POST'])
def water_bottle_order():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'Invalid order data'}), 400
        user_id = data.get('user')
        quantity = data.get('quantity')
        if not user_id or not quantity:
            return jsonify({'success': False, 'message': 'Missing user or quantity'}), 400
        # check if user exists
        if user_id not in users_db:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        # check if quantity is valid
        if quantity <= 0:
            return jsonify({'success': False, 'message': 'Invalid quantity'}), 400
               
        # check if user has enough balance
        user = users_db[user_id]
        # generate order order_id,user,items = Null,delivery_date = null,total_amount = quantity * user.percanprice,created_at = now,status = pending,payment_status = pending
        new_order = {
            "order_id": int(datetime.now().timestamp()),
            "user": {
                "id": user_id,
                "name": user.get("name"),
                "mobile": user.get("mobile"),
                "address": user.get("address"),
                "percanprice": user.get("percanprice"),
                "profileimg": user.get("profileimg")
            },
            "items": None,
            "delivery_date": None,
            "total_amount": quantity * user.get('percanprice', 35),
            "created_at": datetime.now().isoformat(),
            "status": "pending",
            "payment_status": "pending",
            "payment_method": "cash",
            "paid_amount" : 0
        }
        # Load existing orders
        if os.path.exists(ORDERS_FILE):
            with open(ORDERS_FILE, "r") as f:
                try:
                    orders = json.load(f)
                except:
                    orders = []
        else:
            orders = []
        orders.append(new_order)
        # Save back
        with open(ORDERS_FILE, "w") as f:
            json.dump(orders, f, indent=4)
        return jsonify({
            'success': True,
            'message': 'Order placed successfully',
            'total_amount': new_order["total_amount"],
            'order_id': new_order["order_id"]
        }), 200
    except Exception as e:
        print("Order error:", e)
        return jsonify({'success': False, 'message': 'Server error'}), 500

@app.route('/cancelOrder', methods=['POST'])
def cancel_order():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'Invalid order data'}), 400

        order_id = data.get('order_id')
        user_id = data.get('user_id')

        if not order_id or not user_id:
            return jsonify({'success': False, 'message': 'Missing order_id or user_id'}), 400

        changed_order = None

        # Load existing orders
        if os.path.exists(ORDERS_FILE):
            with open(ORDERS_FILE, "r") as f:
                try:
                    orders = json.load(f)
                except:
                    orders = []
        else:
            orders = []

        # Search order
        for order in orders:
            if (
                order.get("order_id") == order_id and
                order.get("user", {}).get("id") == user_id
            ):
                order["status"] = "cancelled"
                changed_order = order
                break

        # AFTER loop check
        if not changed_order:
            return jsonify({'success': False, 'message': 'Order not found'}), 404

        # Save back
        with open(ORDERS_FILE, "w") as f:
            json.dump(orders, f, indent=4)

        return jsonify({
            'success': True,
            'message': 'Order cancelled successfully',
            'order': changed_order
        }), 200

    except Exception as e:
        print("Order error:", e)
        return jsonify({'success': False, 'message': 'Server error'}), 500


# -------------------------------------------------
# Main
# -------------------------------------------------
 
if __name__ == '__main__':
    load_users()
    print("Starting server on http://")
    app.run(host='0.0.0.0', port=5000, debug=True)
